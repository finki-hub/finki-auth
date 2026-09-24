import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CasAuthentication } from '../authentication.js';
import {
  GITLAB_LDAP_CALLBACK_URL,
  GITLAB_SESSION_VALIDATION_URL,
  SERVICE_LOGIN_URLS,
  SERVICE_URLS,
} from '../constants.js';
import { Service } from '../lib/Service.js';

const casUrl = SERVICE_LOGIN_URLS[Service.CAS];
const coursesUrl = SERVICE_LOGIN_URLS[Service.COURSES];
const gitlabSignInUrl = SERVICE_LOGIN_URLS[Service.GITLAB];
const ldapForm =
  '<form action="/users/auth/ldapmain/callback"><input name="authenticity_token" value="token"></form>';

type ResponseArguments = [
  url: string,
  status: number,
  body?: string,
  cookies?: string[],
  location?: string,
];

const response = (...args: ResponseArguments): Response => {
  const [url, status, body = '', cookies = [], location] = args;
  const headers = new Headers();

  for (const cookie of cookies) {
    headers.append('set-cookie', cookie);
  }

  if (location) {
    headers.set('location', location);
  }

  const result = new Response(body, { headers, status });

  Object.defineProperty(result, 'url', { value: url });

  return result;
};

describe('CasAuthentication shared cookie state', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not validate CAS after its original login requests', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(casUrl, 200, '', ['cas_session=first; Path=/']),
      )
      .mockResolvedValueOnce(response(casUrl, 200));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await auth.authenticate(Service.CAS);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(auth.getCookie(Service.CAS)).resolves.toHaveLength(1);
  });

  it('validates a cookie clone without mutating the stored session', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(casUrl, 200, '', ['cas_session=stored; Path=/']),
      )
      .mockResolvedValueOnce(response(casUrl, 200))
      .mockResolvedValueOnce(
        response(
          SERVICE_URLS[Service.CAS],
          200,
          '<div class="success">ok</div>',
          ['cas_session=; Max-Age=0; Path=/'],
        ),
      );

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await auth.authenticate(Service.CAS);

    await expect(auth.isCookieValid(Service.CAS)).resolves.toBeTruthy();

    const storedCookies = await auth.getCookie(Service.CAS);

    expect(storedCookies[0]?.value).toBe('stored');
  });

  it('replaces repeated CAS sessions and clears a failed repeat', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(casUrl, 200, '', [
          'shared_session=first; Path=/',
          'optional_cookie=old; Path=/',
        ]),
      )
      .mockResolvedValueOnce(response(casUrl, 200))
      .mockResolvedValueOnce(
        response(casUrl, 200, '', ['shared_session=second; Path=/']),
      )
      .mockResolvedValueOnce(response(casUrl, 200))
      .mockResolvedValueOnce(response(casUrl, 200))
      .mockResolvedValueOnce(response(casUrl, 200));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await auth.authenticate(Service.CAS);
    await auth.authenticate(Service.CAS);

    const replacedCookies = await auth.getCookie(Service.CAS);

    expect(replacedCookies.map((cookie) => cookie.key)).toStrictEqual([
      'shared_session',
    ]);
    expect(replacedCookies[0]?.value).toBe('second');

    await expect(auth.authenticate(Service.CAS)).rejects.toThrow(
      'produced no cookies',
    );
    await expect(auth.getCookie(Service.CAS)).resolves.toStrictEqual([]);
  });

  it('preserves another service when GitLab validation fails', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(casUrl, 200, '', ['cas_session=authenticated; Path=/']),
      )
      .mockResolvedValueOnce(response(casUrl, 200))
      .mockResolvedValueOnce(response(gitlabSignInUrl, 200, ldapForm))
      .mockResolvedValueOnce(
        response(GITLAB_LDAP_CALLBACK_URL, 200, '', [
          '_gitlab_session=anonymous; Path=/',
          'known_sign_in=1; Path=/',
        ]),
      )
      .mockResolvedValueOnce(response(GITLAB_SESSION_VALIDATION_URL, 302));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await auth.authenticate(Service.CAS);

    await expect(auth.authenticate(Service.GITLAB)).rejects.toThrow(
      'GitLab authentication did not produce a valid session',
    );
    await expect(auth.getCookie(Service.CAS)).resolves.toHaveLength(1);
    await expect(auth.getCookie(Service.GITLAB)).resolves.toStrictEqual([]);
  });

  it('isolates same-name cookies across service jars', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(casUrl, 200, '', ['shared_session=cas; Path=/']),
      )
      .mockResolvedValueOnce(response(casUrl, 200))
      .mockResolvedValueOnce(
        response(coursesUrl, 200, '', ['shared_session=courses; Path=/']),
      )
      .mockResolvedValueOnce(response(coursesUrl, 200));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await auth.authenticate(Service.CAS);
    await auth.authenticate(Service.COURSES);

    const casCookies = await auth.getCookie(Service.CAS);
    const coursesCookies = await auth.getCookie(Service.COURSES);

    expect(casCookies[0]?.value).toBe('cas');
    expect(coursesCookies[0]?.value).toBe('courses');
  });

  it('does not publish a GitLab session deleted during validation', async () => {
    fetchMock
      .mockResolvedValueOnce(response(gitlabSignInUrl, 200, ldapForm))
      .mockResolvedValueOnce(
        response(GITLAB_LDAP_CALLBACK_URL, 200, '', [
          '_gitlab_session=authenticated; Path=/',
        ]),
      )
      .mockResolvedValueOnce(
        response(GITLAB_SESSION_VALIDATION_URL, 200, '', [
          '_gitlab_session=; Max-Age=0; Path=/',
        ]),
      );

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await expect(auth.authenticate(Service.GITLAB)).rejects.toThrow(
      'produced no cookies',
    );
    await expect(auth.getCookie(Service.GITLAB)).resolves.toStrictEqual([]);
  });
});
