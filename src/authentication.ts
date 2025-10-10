import axios, { type AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { JSDOM } from 'jsdom';
import { CookieJar } from 'tough-cookie';
import { z } from 'zod';

import { SERVICE_LOGIN_URLS, SERVICE_URLS } from './constants.js';
import { Service } from './lib/Service.js';
import { getCookieValidity } from './utils.js';

export class CasAuthentication {
  private readonly password: string;

  private readonly session: AxiosInstance;

  private readonly username: string;

  constructor({ password, username }: { password: string; username: string }) {
    this.username = username;
    this.password = password;

    const cookieJar = new CookieJar();
    const client = axios.create({
      jar: cookieJar,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    this.session = wrapper(client);
  }

  private static readonly getFullLoginUrl = (service: Service) => {
    if (service === Service.CAS) {
      return SERVICE_LOGIN_URLS[Service.CAS];
    }

    return `${SERVICE_LOGIN_URLS[Service.CAS]}?service=${encodeURIComponent(SERVICE_LOGIN_URLS[service])}`;
  };

  public readonly authenticate = async (service: Service) => {
    const fullUrl = CasAuthentication.getFullLoginUrl(service);
    const initialRequest = await this.session.get(fullUrl);

    const { data } = z.string().safeParse(initialRequest.data);

    if (!data) {
      throw new Error('Failed to parse initial request data');
    }

    const { window } = new JSDOM(data);
    const hiddenInputs = window.document.querySelectorAll(
      'input[type="hidden"]',
    );

    const urlSearchParams = this.getFormData(hiddenInputs);

    await this.session.post(fullUrl, urlSearchParams);
  };

  public readonly buildCookieHeader = async (service: Service) => {
    const cookies = await this.getCookie(service);

    return cookies.map(({ key, value }) => `${key}=${value}`).join('; ');
  };

  public readonly getCookie = async (service: Service) => {
    const serviceLoginUrl = SERVICE_LOGIN_URLS[service];

    const serviceCookies =
      await this.session.defaults.jar?.getCookies(serviceLoginUrl);

    return serviceCookies ?? [];
  };

  public readonly isCookieValid = async (service: Service) => {
    const url = SERVICE_URLS[service];

    const cookies = await this.getCookie(service);
    const jar = new CookieJar();

    for (const cookie of cookies) {
      await jar.setCookie(cookie, url);
    }

    return await getCookieValidity({ cookieJar: jar, service });
  };

  private readonly getFormData = (inputs: NodeListOf<Element>) => {
    const urlSearchParams = new URLSearchParams();

    for (const input of inputs) {
      const name = input.getAttribute('name');
      const value = input.getAttribute('value');

      if (name) {
        urlSearchParams.append(name, value ?? '');
      }
    }

    urlSearchParams.append('username', this.username);
    urlSearchParams.append('password', this.password);
    urlSearchParams.append('submit', 'LOGIN');

    return urlSearchParams;
  };
}
