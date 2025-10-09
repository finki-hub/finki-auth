import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { JSDOM } from 'jsdom';
import { type Cookie, CookieJar } from 'tough-cookie';
import z from 'zod';

import type { Service } from './lib/Service.js';

import { SERVICE_SUCCESS_SELECTORS, SERVICE_URLS } from './constants.js';

export const buildCookieHeader = (
  cookies: Array<{ key: string; value: string }>,
) => cookies.map(({ key, value }) => `${key}=${value}`).join('; ');

export const isCookieValid = async (service: Service, cookies: Cookie[]) => {
  const url = SERVICE_URLS[service];
  const userElementSelector = SERVICE_SUCCESS_SELECTORS[service];

  const jar = new CookieJar();

  for (const cookie of cookies) {
    try {
      await jar.setCookie(cookie, url);
    } catch {
      // Ignore cookies that can't be set for this domain
      // This happens when cookies from cas.finki.ukim.mk are not valid for other domains
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
