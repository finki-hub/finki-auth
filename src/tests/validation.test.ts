import { describe, expect, it } from 'vitest';

import { CasAuthentication } from '../authentication.js';
import { Service } from '../lib/Service.js';
import { getCredentials } from './utils.js';

const TEST_CASES = [
  { name: 'CAS', service: Service.CAS },
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
    await auth.authenticate(service);

    const isValid = await auth.isCookieValid(service);

    expect(isValid).toBe(true);
  });

  it.each(TEST_CASES)(
    "shouldn't validate $name invalid cookies",
    async ({ service }) => {
      const auth = new CasAuthentication('invalid', 'invalid');
      await auth.authenticate(service);

      const isValid = await auth.isCookieValid(service);

      expect(isValid).toBe(false);
    },
  );
});
