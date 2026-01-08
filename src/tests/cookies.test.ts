import { describe, expect, it } from 'vitest';

import { CasAuthentication } from '../index.js';
import { Service } from '../lib/Service.js';
import { getCredentials, hasCredentials } from './utils.js';

const skipIfNoCredentials = !hasCredentials();

const TEST_CASES = [
  {
    expectedCookieCount: 2,
    expectedCookies: ['JSESSIONID'],
    name: 'CAS',
    service: Service.CAS,
  },
  {
    expectedCookieCount: 2,
    expectedCookies: ['MoodleSession', 'SRVNAME'],
    name: 'Courses',
    service: Service.COURSES,
  },
  {
    expectedCookieCount: 2,
    expectedCookies: [
      '.AspNet.ApplicationCookie',
      '__RequestVerificationToken',
    ],
    name: 'Diplomas',
    service: Service.DIPLOMAS,
  },
  {
    expectedCookieCount: 2,
    expectedCookies: ['MoodleSession', 'SRVNAME'],
    name: 'Old Courses',
    service: Service.OLD_COURSES,
  },
  {
    expectedCookieCount: 1,
    expectedCookies: ['JSESSIONID'],
    name: 'Masters',
    service: Service.MASTERS,
  },
  {
    expectedCookieCount: 1,
    expectedCookies: ['JSESSIONID'],
    name: 'Internships',
    service: Service.INTERNSHIPS,
  },
  {
    expectedCookieCount: 1,
    expectedCookies: ['JSESSIONID'],
    name: 'Consultations',
    service: Service.CONSULTATIONS,
  },
] as const;

const checkCookiesContainKeys = (
  cookies: Array<{ key: string }>,
  expectedKeys: readonly string[],
): boolean[] => {
  const cookieKeys = new Set(cookies.map((cookie) => cookie.key));
  return expectedKeys.map((key) => cookieKeys.has(key));
};

describe('Cookies', () => {
  it.skipIf(skipIfNoCredentials).each(TEST_CASES)(
    'should fetch cookie for $name',
    async ({ expectedCookieCount, expectedCookies, service }) => {
      const credentials = getCredentials();

      const auth = new CasAuthentication(credentials);
      await auth.authenticate(service);

      const cookies = await auth.getCookie(service);

      expect(cookies).toHaveLength(expectedCookieCount);

      const cookieChecks = checkCookiesContainKeys(cookies, expectedCookies);

      for (const hasExpectedCookie of cookieChecks) {
        expect(hasExpectedCookie).toBe(true);
      }
    },
  );
});
