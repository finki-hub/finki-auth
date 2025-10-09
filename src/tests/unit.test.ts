import { describe, expect, it } from 'vitest';

import { CasAuthentication } from '../authentication.js';
import { Service } from '../lib/Service.js';
import { getCredentials } from './utils.js';

describe('CasAuthentication', () => {
  describe('buildCookieHeader Method', () => {
    it('should return empty string when no cookies exist', async () => {
      const auth = new CasAuthentication('user', 'pass');
      const header = await auth.buildCookieHeader(Service.CAS);

      expect(header).toBe('');
    });

    it('should format cookies correctly', async () => {
      const credentials = getCredentials();
      const auth = new CasAuthentication(
        credentials.username,
        credentials.password,
      );

      await auth.authenticate(Service.CAS);

      const header = await auth.buildCookieHeader(Service.CAS);

      expect(header).toContain('=');
      expect(header).toContain('; ');
    });
  });

  describe('getCookie Method', () => {
    it('should return array for all service types', async () => {
      const auth = new CasAuthentication('user', 'pass');
      const services = Object.values(Service);

      for (const service of services) {
        const cookies = await auth.getCookie(service);

        expect(Array.isArray(cookies)).toBe(true);
      }
    });
  });

  describe('isCookieValid Method', () => {
    it('should return boolean for all services', async () => {
      const auth = new CasAuthentication('user', 'pass');
      const services = Object.values(Service);

      for (const service of services) {
        const isValid = await auth.isCookieValid(service);

        expect(isValid).toBe(false);
      }
    });
  });
});
