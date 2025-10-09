import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { JSDOM } from 'jsdom';
import { CookieJar } from 'tough-cookie';
import { z } from 'zod';

import type { Service } from './lib/Service.js';

import { SERVICE_URLS, SERVICE_USER_ELEMENT_SELECTORS } from './constants.js';

export const isCookieValid = async (service: Service, cookies: string) => {
  const url = SERVICE_URLS[service];
  const userElementSelector = SERVICE_USER_ELEMENT_SELECTORS[service];

  const jar = new CookieJar();

  if (cookies) {
    const cookiePairs = cookies.split('; ');

    for (const pair of cookiePairs) {
      await jar.setCookie(pair, url);
    }
  }

  const client = wrapper(axios.create({ jar }));
  const response = await client.get(url);

  const html = z.string().parse(response.data);

  const { window } = new JSDOM(html);

  const userElement = window.document.querySelector(userElementSelector);

  switch (userElement?.textContent) {
    case undefined:
    case 'Најава':
      return false;

    default:
      return true;
  }
};
