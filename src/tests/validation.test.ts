import { describe, expect, it } from 'vitest';

import { CasAuthentication } from '../auth.js';
import { Service } from '../lib/Service.js';
import { isCookieValid } from '../session.js';
import { getCookieHeader, getCredentials } from './utils.js';

describe('Validation', () => {
  it('should validate Courses cookies', async () => {
    const { password, username } = getCredentials();

    const auth = new CasAuthentication(username, password);
    const cookies = await auth.authenticate(Service.COURSES);
    const headerCookies = getCookieHeader(cookies);

    const isValid = await isCookieValid(Service.COURSES, headerCookies);

    expect(isValid).toBe(true);
  });

  it('should invalidate Courses cookies', async () => {
    const headerCookies = '';

    const isValid = await isCookieValid(Service.COURSES, headerCookies);

    expect(isValid).toBe(false);
  });

  it('should validate Diplomas cookies', async () => {
    const { password, username } = getCredentials();

    const auth = new CasAuthentication(username, password);
    const cookies = await auth.authenticate(Service.DIPLOMAS);
    const headerCookies = getCookieHeader(cookies);

    const isValid = await isCookieValid(Service.DIPLOMAS, headerCookies);

    expect(isValid).toBe(true);
  });

  it('should invalidate Diplomas cookies', async () => {
    const headerCookies = '';

    const isValid = await isCookieValid(Service.DIPLOMAS, headerCookies);

    expect(isValid).toBe(false);
  });

  it('should validate Old Courses cookies', async () => {
    const { password, username } = getCredentials();

    const auth = new CasAuthentication(username, password);
    const cookies = await auth.authenticate(Service.OLD_COURSES);
    const headerCookies = getCookieHeader(cookies);

    const isValid = await isCookieValid(Service.OLD_COURSES, headerCookies);

    expect(isValid).toBe(true);
  });

  it('should invalidate Old Courses cookies', async () => {
    const headerCookies = '';

    const isValid = await isCookieValid(Service.OLD_COURSES, headerCookies);

    expect(isValid).toBe(false);
  });

  it('should validate Masters cookies', async () => {
    const { password, username } = getCredentials();

    const auth = new CasAuthentication(username, password);
    const cookies = await auth.authenticate(Service.MASTERS);
    const headerCookies = getCookieHeader(cookies);

    const isValid = await isCookieValid(Service.MASTERS, headerCookies);

    expect(isValid).toBe(true);
  });

  it('should invalidate Masters cookies', async () => {
    const headerCookies = '';

    const isValid = await isCookieValid(Service.MASTERS, headerCookies);

    expect(isValid).toBe(false);
  });
});
