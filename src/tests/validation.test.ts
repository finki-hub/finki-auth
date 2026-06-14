import { describe, expect, it } from 'vitest';

import { CasAuthentication } from '../authentication.js';
import { Service } from '../lib/Service.js';
import {
  getCredentials,
  hasCredentials,
  INVALID_CREDENTIALS,
  isIspitiReachable,
} from './utils.js';

const skipIfNoCredentials = !hasCredentials();
const ispitiDown = !(await isIspitiReachable());

const TEST_CASES = [
  { name: 'Anketi', service: Service.ANKETI },
  { name: 'CAS', service: Service.CAS },
  { name: 'Courses', service: Service.COURSES },
  { name: 'Diplomas', service: Service.DIPLOMAS },
  { name: 'Old Courses', service: Service.OLD_COURSES },
  { name: 'Masters', service: Service.MASTERS },
  { name: 'Internships', service: Service.INTERNSHIPS },
  { name: 'Consultations', service: Service.CONSULTATIONS },
  { name: 'GitLab', service: Service.GITLAB },
  { name: 'iKnow', service: Service.IKNOW },
  { name: 'Ispiti', service: Service.ISPITI },
] as const;

describe('Validation', () => {
  it.for(TEST_CASES)(
    'should validate $name cookies',
    async ({ service }, { skip }) => {
      skip(skipIfNoCredentials || (service === Service.ISPITI && ispitiDown));

      const credentials = getCredentials();

      const auth = new CasAuthentication(credentials);
      await auth.authenticate(service);

      const isValid = await auth.isCookieValid(service);

      expect(isValid).toBeTruthy();
    },
  );

  it.for(TEST_CASES)(
    "shouldn't validate $name invalid cookies",
    async ({ service }, { skip }) => {
      skip(service === Service.ISPITI && ispitiDown);

      const auth = new CasAuthentication(INVALID_CREDENTIALS);

      let valid = false;

      try {
        await auth.authenticate(service);
        valid = await auth.isCookieValid(service);
      } catch {
        // authenticate throws when it yields no cookies — not a valid session
      }

      expect(valid).toBeFalsy();
    },
  );
});
