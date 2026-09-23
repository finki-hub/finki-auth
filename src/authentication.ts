import * as cheerio from 'cheerio';
import makeFetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';

import {
  ANKETI_SIGN_IN_URL,
  GITLAB_LDAP_CALLBACK_URL,
  GITLAB_SESSION_VALIDATION_URL,
  IKNOW_CAS_SERVICE_URL,
  SERVICE_LOGIN_URLS,
} from './constants.js';
import { Service } from './lib/Service.js';
import { formatCookieHeader, getCookieValidity } from './utils.js';

export class CasAuthentication {
  private readonly cookieJar: CookieJar;

  private gitlabCookieJar: CookieJar | undefined;

  private readonly password: string;

  private readonly username: string;

  constructor({ password, username }: { password: string; username: string }) {
    this.username = username;
    this.password = password;

    this.cookieJar = new CookieJar();
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
    await this.authenticateService(service);

    const cookies = await this.getCookie(service);

    if (cookies.length === 0) {
      throw new Error(
        `Authentication for "${service}" produced no cookies; the credentials may be invalid or the service may be unavailable`,
      );
    }
  };

  public readonly buildCookieHeader = async (service: Service) => {
    const cookies = await this.getCookie(service);

    return formatCookieHeader(cookies);
  };

  public readonly getCookie = async (service: Service) => {
    if (service === Service.GITLAB) {
      return (
        this.gitlabCookieJar?.getCookies(GITLAB_SESSION_VALIDATION_URL) ?? []
      );
    }

    const serviceLoginUrl = SERVICE_LOGIN_URLS[service];

    return this.cookieJar.getCookies(serviceLoginUrl);
  };

  public readonly isCookieValid = async (service: Service) => {
    if (service === Service.GITLAB) {
      return getCookieValidity({
        cookieJar: this.gitlabCookieJar ?? new CookieJar(),
        service,
      });
    }

    const serviceLoginUrl = SERVICE_LOGIN_URLS[service];

    const cookies = await this.getCookie(service);
    const jar = new CookieJar();

    for (const cookie of cookies) {
      await jar.setCookie(cookie, serviceLoginUrl);
    }

    return getCookieValidity({ cookieJar: jar, service });
  };

  private readonly authenticateAnketi = async () => {
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

    const serviceUrl = SERVICE_LOGIN_URLS[Service.ANKETI];
    const serviceCookies = await jar.getCookies(serviceUrl);

    for (const cookie of serviceCookies) {
      await this.cookieJar.setCookie(cookie, serviceUrl);
    }
  };

  private readonly authenticateCas = async (service: Service) => {
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

    const serviceLoginUrl = SERVICE_LOGIN_URLS[service];
    const serviceCookies = await jar.getCookies(serviceLoginUrl);

    for (const cookie of serviceCookies) {
      await this.cookieJar.setCookie(cookie, serviceLoginUrl);
    }
  };

  private readonly authenticateGitlab = async () => {
    this.gitlabCookieJar = undefined;

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

    const isValid = await getCookieValidity({
      cookieJar: jar,
      service: Service.GITLAB,
    });

    if (!isValid) {
      throw new Error('GitLab authentication did not produce a valid session');
    }

    this.gitlabCookieJar = jar;
  };

  private readonly authenticateIknow = async () => {
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

    const serviceUrl = SERVICE_LOGIN_URLS[Service.IKNOW];
    const serviceCookies = await jar.getCookies(serviceUrl);

    for (const cookie of serviceCookies) {
      await this.cookieJar.setCookie(cookie, serviceUrl);
    }
  };

  private readonly authenticateService = async (service: Service) => {
    if (service === Service.GITLAB) {
      await this.authenticateGitlab();

      return;
    }

    if (service === Service.IKNOW) {
      await this.authenticateIknow();

      return;
    }

    if (service === Service.ANKETI) {
      await this.authenticateAnketi();

      return;
    }

    await this.authenticateCas(service);
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
