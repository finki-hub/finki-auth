import { describe, expect, it } from 'vitest';

import { CasAuthentication } from '../index.js';
import { Service } from '../lib/Service.js';
import { getCredentials } from './utils.js';

describe('Sessions', () => {
  it('should fetch 2 cookies for CAS', async () => {
    const { password, username } = getCredentials();

    const auth = new CasAuthentication(username, password);
    const cookies = await auth.authenticate(Service.CAS);

    const hasCookie = cookies.some((cookie) => cookie.key === 'JSESSIONID');

    // the same cookie gets set twice
    expect(cookies).toHaveLength(2);
    expect(hasCookie).toBe(true);
  });

  it('should fetch 4 cookies for Courses', async () => {
    const { password, username } = getCredentials();

    const auth = new CasAuthentication(username, password);
    const cookies = await auth.authenticate(Service.COURSES);

    const hasCookie1 = cookies.some((cookie) => cookie.key === 'MoodleSession');
    const hasCookie2 = cookies.some((cookie) => cookie.key === 'SRVNAME');

    expect(cookies).toHaveLength(4);
    expect(hasCookie1).toBe(true);
    expect(hasCookie2).toBe(true);
  });

  it('should fetch 4 cookies for Diplomas', async () => {
    const { password, username } = getCredentials();

    const auth = new CasAuthentication(username, password);
    const cookies = await auth.authenticate(Service.DIPLOMAS);

    const hasCookie1 = cookies.some(
      (cookie) => cookie.key === '.AspNet.ApplicationCookie',
    );
    const hasCookie2 = cookies.some(
      (cookie) => cookie.key === '__RequestVerificationToken',
    );

    expect(cookies).toHaveLength(4);
    expect(hasCookie1).toBe(true);
    expect(hasCookie2).toBe(true);
  });
});
