import { describe, expect, it } from 'vitest';

import { CasAuthentication } from '../auth.js';
import { Service } from '../lib/Service.js';
import { isCookieValid } from '../session.js';
import { getCookieHeader, getCredentials } from './utils.js';

const testServices = [
  { name: 'Courses', service: Service.COURSES },
  { name: 'Diplomas', service: Service.DIPLOMAS },
  { name: 'Old Courses', service: Service.OLD_COURSES },
  { name: 'Masters', service: Service.MASTERS },
  { name: 'Internships', service: Service.INTERNSHIPS },
];

describe('Validation', () => {
  describe.each(testServices)('$name cookies', ({ service }) => {
    it('should validate cookies', async () => {
      const { password, username } = getCredentials();

      const auth = new CasAuthentication(username, password);
      const cookies = await auth.authenticate(service);
      const headerCookies = getCookieHeader(cookies);

      const isValid = await isCookieValid(service, headerCookies);

      expect(isValid).toBe(true);
    });

    it('should invalidate empty cookies', async () => {
      const isValid = await isCookieValid(service, '');

      expect(isValid).toBe(false);
    });
  });
});
