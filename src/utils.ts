import * as cheerio from 'cheerio';
import makeFetchCookie from 'fetch-cookie';
import { type Cookie, CookieJar } from 'tough-cookie';

import {
  GITLAB_SESSION_VALIDATION_URL,
  SERVICE_SUCCESS_SELECTORS,
  SERVICE_URLS,
} from './constants.js';
import { type Service, Service as ServiceEnum } from './lib/Service.js';

export const parseCookieHeader = (
  cookieHeader: string,
): Array<{ key: string; value: string }> => {
  if (!cookieHeader) {
    return [];
  }

  return cookieHeader.split('; ').map((cookie) => {
    const [key = '', ...valueParts] = cookie.split('=');

    return { key, value: valueParts.join('=') };
  });
};

export const formatCookieHeader = (
  cookies: ReadonlyArray<{ key: string; value: string }>,
): string => cookies.map(({ key, value }) => `${key}=${value}`).join('; ');

export const getCookieValidity = async ({
  cookieJar,
  service,
}: {
  cookieJar: CookieJar;
  service: Service;
}) => {
  if (service === ServiceEnum.GITLAB) {
    const gitlabFetchWithCookies = makeFetchCookie(fetch, cookieJar);
    const gitlabResponse = await gitlabFetchWithCookies(
      GITLAB_SESSION_VALIDATION_URL,
      {
        redirect: 'manual',
      },
    );

    const isValid = gitlabResponse.status === 200;

    await gitlabResponse.body?.cancel();

    return isValid;
  }

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

  const cookies = parseCookieHeader(cookieHeader);

  for (const { key, value } of cookies) {
    await jar.setCookie(`${key}=${value}`, url);
  }

  return getCookieValidity({ cookieJar: jar, service });
};
