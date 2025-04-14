import axios, { type AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { JSDOM } from 'jsdom';
import { CookieJar } from 'tough-cookie';
import { z } from 'zod';

import { SERVICE_URLS } from './constants.js';
import { Service } from './lib/Service.js';

export class CasAuthentication {
  private readonly password: string;

  private readonly session: AxiosInstance;

  private readonly username: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;

    const cookieJar = new CookieJar();
    const client = axios.create({
      jar: cookieJar,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    this.session = wrapper(client);
  }

  public authenticate = async (service: Service) => {
    const fullUrl = `${SERVICE_URLS[Service.CAS]}?service=${encodeURIComponent(SERVICE_URLS[service])}`;
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

    return this.getCookies(service);
  };

  private readonly getCookies = async (service?: Service) => {
    const casCookies =
      (await this.session.defaults.jar?.getCookies(
        SERVICE_URLS[Service.CAS],
      )) ?? [];
    const serviceCookies = service
      ? ((await this.session.defaults.jar?.getCookies(SERVICE_URLS[service])) ??
        [])
      : [];

    return [...casCookies, ...serviceCookies];
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

export { Service } from './lib/Service.js';
