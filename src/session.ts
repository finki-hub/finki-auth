import axios from 'axios';
import { JSDOM } from 'jsdom';
import { z } from 'zod';

import type { Service } from './lib/Service.js';

import { SERVICE_URLS, SERVICE_USER_ELEMENT_SELECTORS } from './constants.js';

export const isCookieValid = async (service: Service, cookies: string) => {
  const url = SERVICE_URLS[service];
  const userElementSelector = SERVICE_USER_ELEMENT_SELECTORS[service];

  const response = await axios.get(url, {
    headers: {
      Cookie: cookies,
    },
  });

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
