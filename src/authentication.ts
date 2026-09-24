import * as cheerio from 'cheerio';
import makeFetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';

import {
  ANKETI_SIGN_IN_URL,
  GITLAB_LDAP_CALLBACK_URL,
  IKNOW_CAS_SERVICE_URL,
  SERVICE_LOGIN_URLS,
  SERVICES_REQUIRING_AUTHENTICATION_VALIDATION,
} from './constants.js';
import { Service } from './lib/Service.js';
import {
  type CookieValidationResult,
  formatCookieHeader,
  getCookieValidationResult,
  getCookieValidity,
} from './utils.js';

const getAuthenticationValidationError = (
  service: Service,
  validation: CookieValidationResult,
) => {
  if (service === Service.GITLAB) {
    const redirect = validation.redirect
      ? `; redirect ${validation.redirect}`
      : '';

    return new Error(
      `GitLab authentication did not produce a valid session (status ${validation.status ?? 'unknown'}${redirect})`,
    );
  }

  return new Error(
    `Authentication for "${service}" produced an invalid session`,
  );
};

export class CasAuthentication {
  private readonly cookieJars = new Map<Service, CookieJar>();

  private readonly password: string;

  private readonly username: string;

  constructor({ password, username }: { password: string; username: string }) {
    this.username = username;
    this.password = password;
  }

  private static readonly getFullLoginUrl = (service: Service) => {
    if (service === Service.CAS) {
      return SERVICE_LOGIN_URLS[Service.CAS];
    }

    return `${SERVICE_LOGIN_URLS[Service.CAS]}?service=${encodeURIComponent(SERVICE_LOGIN_URLS[service])}`;
  };

  private static readonly submitOidcFormPost = async (
    fetchWithCookies: typeof fetch,
    html: string,
  ) => {
    const $ = cheerio.load(html);
    const form = $('form[action*="/signin-oidc"]').first();

    if (form.length === 0) {
      return;
    }

    const action = form.attr('action');

    if (!action) {
      return;
    }

    const params = new URLSearchParams();

    form.find('input[type="hidden"]').each((_i, input) => {
      const name = $(input).attr('name');
      const value = $(input).attr('value');

      if (name) {
        params.append(name, value ?? '');
      }
    });

    const response = await fetchWithCookies(action, {
      body: params,
      method: 'POST',
    });

    await response.body?.cancel();
  };

  public readonly authenticate = async (service: Service) => {
    this.cookieJars.delete(service);

    const jar = await this.authenticateService(service);
    const serviceLoginUrl = SERVICE_LOGIN_URLS[service];
    const cookies = await jar.getCookies(serviceLoginUrl);

    if (cookies.length === 0) {
      throw new Error(
        `Authentication for "${service}" produced no cookies; the credentials may be invalid or the service may be unavailable`,
      );
    }

    if (SERVICES_REQUIRING_AUTHENTICATION_VALIDATION.has(service)) {
      const validation = await getCookieValidationResult({
        cookieJar: jar,
        service,
      });

      if (!validation.valid) {
        throw getAuthenticationValidationError(service, validation);
      }

      const validatedCookies = await jar.getCookies(serviceLoginUrl);

      if (validatedCookies.length === 0) {
        throw new Error(
          `Authentication for "${service}" produced no cookies; the credentials may be invalid or the service may be unavailable`,
        );
      }
    }

    this.cookieJars.set(service, jar);
  };

  public readonly buildCookieHeader = async (service: Service) => {
    const cookies = await this.getCookie(service);

    return formatCookieHeader(cookies);
  };

  public readonly getCookie = async (service: Service) =>
    this.cookieJars.get(service)?.getCookies(SERVICE_LOGIN_URLS[service]) ?? [];

  public readonly isCookieValid = async (service: Service) => {
    const serviceLoginUrl = SERVICE_LOGIN_URLS[service];

    const cookies = await this.getCookie(service);
    const jar = new CookieJar();

    for (const cookie of cookies) {
      await jar.setCookie(cookie, serviceLoginUrl);
    }

    return getCookieValidity({ cookieJar: jar, service });
  };

  private readonly authenticateAnketi = async (): Promise<CookieJar> => {
    const jar = new CookieJar();
    const fetchWithCookies = makeFetchCookie(fetch, jar);
    const casLoginUrl = `${SERVICE_LOGIN_URLS[Service.CAS]}?service=${encodeURIComponent(IKNOW_CAS_SERVICE_URL)}`;

    const initialResponse = await fetchWithCookies(casLoginUrl);

    const html = await initialResponse.text();

    const $ = cheerio.load(html);
    const urlSearchParams = this.getFormData($);

    const postResponse = await fetchWithCookies(casLoginUrl, {
      body: urlSearchParams,
      method: 'POST',
    });

    await postResponse.body?.cancel();

    const signInResponse = await fetchWithCookies(ANKETI_SIGN_IN_URL);

    await CasAuthentication.submitOidcFormPost(
      fetchWithCookies,
      await signInResponse.text(),
    );

    return jar;
  };

  private readonly authenticateCas = async (
    service: Service,
  ): Promise<CookieJar> => {
    const jar = new CookieJar();
    const fetchWithCookies = makeFetchCookie(fetch, jar);
    const casLoginUrl = CasAuthentication.getFullLoginUrl(service);

    const initialResponse = await fetchWithCookies(casLoginUrl);

    const html = await initialResponse.text();

    const $ = cheerio.load(html);
    const urlSearchParams = this.getFormData($);

    const postResponse = await fetchWithCookies(casLoginUrl, {
      body: urlSearchParams,
      method: 'POST',
    });

    await postResponse.body?.cancel();

    return jar;
  };

  private readonly authenticateGitlab = async (): Promise<CookieJar> => {
    const jar = new CookieJar();
    const fetchWithCookies = makeFetchCookie(fetch, jar);
    const signInUrl = SERVICE_LOGIN_URLS[Service.GITLAB];

    const initialResponse = await fetchWithCookies(signInUrl);

    if (!initialResponse.ok) {
      await initialResponse.body?.cancel();

      throw new Error('GitLab sign-in request failed');
    }

    const html = await initialResponse.text();

    const $ = cheerio.load(html);
    const urlSearchParams = this.getGitlabFormData($);

    const postResponse = await fetchWithCookies(GITLAB_LDAP_CALLBACK_URL, {
      body: urlSearchParams,
      method: 'POST',
    });

    await postResponse.body?.cancel();

    if (!postResponse.ok) {
      throw new Error('GitLab authentication request failed');
    }

    return jar;
  };

  private readonly authenticateIknow = async (): Promise<CookieJar> => {
    const jar = new CookieJar();
    const fetchWithCookies = makeFetchCookie(fetch, jar);
    const casLoginUrl = `${SERVICE_LOGIN_URLS[Service.CAS]}?service=${encodeURIComponent(IKNOW_CAS_SERVICE_URL)}`;

    const initialResponse = await fetchWithCookies(casLoginUrl);

    const html = await initialResponse.text();

    const $ = cheerio.load(html);
    const urlSearchParams = this.getFormData($);

    const postResponse = await fetchWithCookies(casLoginUrl, {
      body: urlSearchParams,
      method: 'POST',
    });

    await CasAuthentication.submitOidcFormPost(
      fetchWithCookies,
      await postResponse.text(),
    );

    return jar;
  };

  private readonly authenticateService = async (
    service: Service,
  ): Promise<CookieJar> => {
    if (service === Service.GITLAB) {
      return this.authenticateGitlab();
    }

    if (service === Service.IKNOW) {
      return this.authenticateIknow();
    }

    if (service === Service.ANKETI) {
      return this.authenticateAnketi();
    }

    return this.authenticateCas(service);
  };

  private readonly getFormData = ($: cheerio.CheerioAPI) => {
    const urlSearchParams = new URLSearchParams();

    $('input[type="hidden"]').each((_i, input) => {
      const name = $(input).attr('name');
      const value = $(input).attr('value');

      if (name) {
        urlSearchParams.append(name, value ?? '');
      }
    });

    urlSearchParams.append('username', this.username);
    urlSearchParams.append('password', this.password);
    urlSearchParams.append('submit', 'LOGIN');

    return urlSearchParams;
  };

  private readonly getGitlabFormData = ($: cheerio.CheerioAPI) => {
    const urlSearchParams = new URLSearchParams();

    const ldapForm = $('form[action="/users/auth/ldapmain/callback"]').first();
    const authenticityToken = ldapForm
      .find('input[name="authenticity_token"]')
      .attr('value');

    if (ldapForm.length === 0 || !authenticityToken) {
      throw new Error('GitLab sign-in form or authenticity token is missing');
    }

    urlSearchParams.append('authenticity_token', authenticityToken);
    urlSearchParams.append('username', this.username);
    urlSearchParams.append('password', this.password);
    urlSearchParams.append('remember_me', '0');

    return urlSearchParams;
  };
}
