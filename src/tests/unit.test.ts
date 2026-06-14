import { describe, expect, it } from 'vitest';

import { CasAuthentication } from '../authentication.js';
import { Service } from '../lib/Service.js';
import { isCookieHeaderValid, isCookieValid } from '../utils.js';
import {
  getCredentials,
  getReachableServices,
  hasCredentials,
  INVALID_CREDENTIALS,
} from './utils.js';

const skipIfNoCredentials = !hasCredentials();
const reachableServices = await getReachableServices();

describe('CasAuthentication', () => {
  describe('buildCookieHeader Method', () => {
    it('should return empty string when no cookies exist', async () => {
      const auth = new CasAuthentication(INVALID_CREDENTIALS);
      const header = await auth.buildCookieHeader(Service.CAS);

      expect(header).toBe('');
    });

    it.skipIf(skipIfNoCredentials || !reachableServices.has(Service.CAS))(
      'should format cookies correctly',
      async () => {
        const credentials = getCredentials();
        const auth = new CasAuthentication(credentials);

        await auth.authenticate(Service.CAS);

        const header = await auth.buildCookieHeader(Service.CAS);

        expect(header).toContain('=');
        expect(header).toContain('; ');
      },
    );
  });

  describe('getCookie Method', () => {
    it('should return array for all service types', async () => {
      const auth = new CasAuthentication(INVALID_CREDENTIALS);
      const services = Object.values(Service);

      for (const service of services) {
        const cookies = await auth.getCookie(service);

        expect(Array.isArray(cookies)).toBeTruthy();
      }
    });
  });

  describe('isCookieValid Method', () => {
    it('should return boolean for all services', async () => {
      const auth = new CasAuthentication(INVALID_CREDENTIALS);

      for (const service of reachableServices) {
        const isValid = await auth.isCookieValid(service);

        expect(isValid).toBeFalsy();
      }
    });
  });
});

describe('isCookieValid', () => {
  it('should return false for invalid cookies', async ({ skip }) => {
    skip(!reachableServices.has(Service.COURSES));

    const auth = new CasAuthentication(INVALID_CREDENTIALS);

    await auth.authenticate(Service.COURSES);
    const cookies = await auth.getCookie(Service.COURSES);

    const isValid = await isCookieValid({
      cookies,
      service: Service.COURSES,
    });

    expect(isValid).toBeFalsy();
  });

  it.skipIf(skipIfNoCredentials || !reachableServices.has(Service.COURSES))(
    'should return true for valid cookies',
    async () => {
      const credentials = getCredentials();
      const auth = new CasAuthentication(credentials);

      await auth.authenticate(Service.COURSES);
      const cookies = await auth.getCookie(Service.COURSES);

      const isValid = await isCookieValid({
        cookies,
        service: Service.COURSES,
      });

      expect(isValid).toBeTruthy();
    },
  );
});

describe('isCookieHeaderValid', () => {
  it('should return false for empty header', async ({ skip }) => {
    skip(!reachableServices.has(Service.COURSES));

    const isValid = await isCookieHeaderValid({
      cookieHeader: '',
      service: Service.COURSES,
    });

    expect(isValid).toBeFalsy();
  });

  it.skipIf(skipIfNoCredentials || !reachableServices.has(Service.COURSES))(
    'should return true for valid header',
    async () => {
      const credentials = getCredentials();
      const auth = new CasAuthentication(credentials);

      await auth.authenticate(Service.COURSES);
      const header = await auth.buildCookieHeader(Service.COURSES);

      const isValid = await isCookieHeaderValid({
        cookieHeader: header,
        service: Service.COURSES,
      });

      expect(isValid).toBeTruthy();
    },
  );
});
