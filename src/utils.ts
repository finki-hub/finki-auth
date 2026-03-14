import * as cheerio from 'cheerio';
import makeFetchCookie from 'fetch-cookie';
import { type Cookie, CookieJar } from 'tough-cookie';

import type { Service } from './lib/Service.js';

import { SERVICE_SUCCESS_SELECTORS, SERVICE_URLS } from './constants.js';

export const getCookieValidity = async ({
  cookieJar,
  service,
}: {
  cookieJar: CookieJar;
  service: Service;
}) => {
  const url = SERVICE_URLS[service];
  const userElementSelector = SERVICE_SUCCESS_SELECTORS[service];

  const fetchWithCookies = makeFetchCookie(fetch, cookieJar);
  const response = await fetchWithCookies(url);

  const html = await response.text();

  const $ = cheerio.load(html);
  const userElement = $(userElementSelector).first();
  const textContent = userElement.length > 0 ? userElement.text() : undefined;

  switch (textContent) {
    case undefined:
    case 'Најава':
      return false;

    default:
      return true;
  }
};

export const isCookieValid = async ({
  cookies,
  service,
}: {
  cookies: Cookie[];
  service: Service;
}) => {
  const url = SERVICE_URLS[service];
  const jar = new CookieJar();

  for (const cookie of cookies) {
    await jar.setCookie(cookie, url);
  }

  return getCookieValidity({ cookieJar: jar, service });
};

export const isCookieHeaderValid = async ({
  cookieHeader,
  service,
}: {
  cookieHeader: string;
  service: Service;
}) => {
  const url = SERVICE_URLS[service];
  const jar = new CookieJar();

  const cookies = cookieHeader
    ? cookieHeader.split('; ').map((cookie) => {
        const [key, ...valParts] = cookie.split('=');
        const value = valParts.join('=');

        return { key, value };
      })
    : [];

  for (const { key, value } of cookies) {
    await jar.setCookie(`${key}=${value}`, url);
  }

  return getCookieValidity({ cookieJar: jar, service });
};
