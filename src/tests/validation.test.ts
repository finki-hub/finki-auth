import { describe, expect, it } from 'vitest';

import { CasAuthentication } from '../auth.js';
import { Service } from '../lib/Service.js';
import { isCookieValid } from '../session.js';
import { getCookieHeader, getCredentials } from './utils.js';

const TEST_CASES = [
  { name: 'Courses', service: Service.COURSES },
  { name: 'Diplomas', service: Service.DIPLOMAS },
  { name: 'Old Courses', service: Service.OLD_COURSES },
  { name: 'Masters', service: Service.MASTERS },
  { name: 'Internships', service: Service.INTERNSHIPS },
  { name: 'Consultations', service: Service.CONSULTATIONS },
] as const;

describe('Validation', () => {
  it.each(TEST_CASES)('should validate $name cookies', async ({ service }) => {
    const { password, username } = getCredentials();

    const auth = new CasAuthentication(username, password);
    const cookies = await auth.authenticate(service);
    const headerCookies = getCookieHeader(cookies);

    const isValid = await isCookieValid(service, headerCookies);

    expect(isValid).toBe(true);
  });

  it.each(TEST_CASES)(
    'should invalidate $name empty cookies',
    async ({ service }) => {
      const isValid = await isCookieValid(service, '');

      expect(isValid).toBe(false);
    },
  );
});
