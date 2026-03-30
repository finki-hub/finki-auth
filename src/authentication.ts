import * as cheerio from 'cheerio';
import makeFetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';

import { SERVICE_LOGIN_URLS } from './constants.js';
import { Service } from './lib/Service.js';
import { getCookieValidity } from './utils.js';

export class CasAuthentication {
  private readonly cookieJar: CookieJar;

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

  public readonly authenticate = async (service: Service) => {
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

  public readonly buildCookieHeader = async (service: Service) => {
    const cookies = await this.getCookie(service);

    return cookies.map(({ key, value }) => `${key}=${value}`).join('; ');
  };

  public readonly getCookie = async (service: Service) => {
    const serviceLoginUrl = SERVICE_LOGIN_URLS[service];

    return await this.cookieJar.getCookies(serviceLoginUrl);
  };

  public readonly isCookieValid = async (service: Service) => {
    const serviceLoginUrl = SERVICE_LOGIN_URLS[service];

    const cookies = await this.getCookie(service);
    const jar = new CookieJar();

    for (const cookie of cookies) {
      await jar.setCookie(cookie, serviceLoginUrl);
    }

    return await getCookieValidity({ cookieJar: jar, service });
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
}
