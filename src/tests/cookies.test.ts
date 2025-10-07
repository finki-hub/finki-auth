import { describe, expect, it } from 'vitest';

import { CasAuthentication } from '../index.js';
import { Service } from '../lib/Service.js';
import { getCredentials } from './utils.js';

const TEST_CASES = [
  {
    expectedCookieCount: 2,
    expectedCookies: ['JSESSIONID'],
    name: 'CAS',
    service: Service.CAS,
  },
  {
    expectedCookieCount: 4,
    expectedCookies: ['MoodleSession', 'SRVNAME'],
    name: 'Courses',
    service: Service.COURSES,
  },
  {
    expectedCookieCount: 4,
    expectedCookies: [
      '.AspNet.ApplicationCookie',
      '__RequestVerificationToken',
    ],
    name: 'Diplomas',
    service: Service.DIPLOMAS,
  },
  {
    expectedCookieCount: 4,
    expectedCookies: ['MoodleSession', 'SRVNAME'],
    name: 'Old Courses',
    service: Service.OLD_COURSES,
  },
  {
    expectedCookieCount: 3,
    expectedCookies: ['JSESSIONID', 'CASTGC'],
    name: 'Masters',
    service: Service.MASTERS,
  },
  {
    expectedCookieCount: 3,
    expectedCookies: ['JSESSIONID', 'CASTGC'],
    name: 'Internships',
    service: Service.INTERNSHIPS,
  },
] as const;

const checkCookiesContainKeys = (
  cookies: Array<{ key: string }>,
  expectedKeys: readonly string[],
): boolean[] => {
  const cookieKeys = new Set(cookies.map((cookie) => cookie.key));
  return expectedKeys.map((key) => cookieKeys.has(key));
};

describe('Sessions', () => {
  describe.each(TEST_CASES)(
    '$name service',
    ({ expectedCookieCount, expectedCookies, name, service }) => {
      it(`should fetch session for ${name}`, async () => {
        const { password, username } = getCredentials();

        const auth = new CasAuthentication(username, password);
        const cookies = await auth.authenticate(service);

        expect(cookies).toHaveLength(expectedCookieCount);

        const cookieChecks = checkCookiesContainKeys(cookies, expectedCookies);

        for (const hasExpectedCookie of cookieChecks) {
          expect(hasExpectedCookie).toBe(true);
        }
      });
    },
  );
});
