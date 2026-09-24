import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CasAuthentication } from '../authentication.js';
import {
  GITLAB_LDAP_CALLBACK_URL,
  GITLAB_SESSION_VALIDATION_URL,
  SERVICE_LOGIN_URLS,
} from '../constants.js';
import { Service } from '../lib/Service.js';
import { isCookieValid } from '../utils.js';

const signInUrl = SERVICE_LOGIN_URLS[Service.GITLAB];
const formHtml = `
  <form action="/users/auth/ldapmain/callback">
    <input type="hidden" name="authenticity_token" value="test-token">
  </form>
`;

type ResponseOptions = {
  body?: string;
  cookies?: string[];
  location?: string;
  status: number;
  url: string;
};

const responseAt = ({
  body = '',
  cookies = [],
  location,
  status,
  url,
}: ResponseOptions): Response => {
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

const response = (
  status: number,
  body = '',
  cookies: string[] = [],
): Response => responseAt({ body, cookies, status, url: signInUrl });

const getCookieHeader = (requestInit: Parameters<typeof fetch>[1]) =>
  new Headers(requestInit?.headers).get('cookie');

const responseWithLocation = (status: number, location: string): Response =>
  responseAt({ location, status, url: signInUrl });

const getErrorMessage = async (promise: Promise<unknown>) => {
  try {
    await promise;

    return '';
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

describe('GitLab authentication', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.for([
    ['_gitlab_session=session-1'],
    ['_gitlab_session=session-2', 'remember_user_token=remembered'],
    [
      '_gitlab_session=session-3',
      'remember_user_token=remembered',
      'preferred_language=en',
    ],
  ])('accepts a valid session with $length cookie(s)', async (cookies) => {
    fetchMock
      .mockResolvedValueOnce(response(200, formHtml))
      .mockResolvedValueOnce(
        response(
          200,
          '',
          cookies.map((cookie) => `${cookie}; Path=/`),
        ),
      )
      .mockResolvedValueOnce(response(200));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await auth.authenticate(Service.GITLAB);

    const storedCookies = await auth.getCookie(Service.GITLAB);

    expect(storedCookies.map((cookie) => cookie.key)).toStrictEqual(
      cookies.map((cookie) => cookie.split('=', 1)[0]),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(signInUrl);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(GITLAB_LDAP_CALLBACK_URL);
    expect(fetchMock.mock.calls[2]?.[0]).toBe(GITLAB_SESSION_VALIDATION_URL);

    const postInit = fetchMock.mock.calls[1]?.[1];

    expect(postInit?.method).toBe('POST');
    expect(postInit?.body).toBeInstanceOf(URLSearchParams);
    expect((postInit?.body as URLSearchParams).get('remember_me')).toBe('0');

    const validationInit = fetchMock.mock.calls[2]?.[1];

    expect(validationInit?.redirect).toBe('manual');
    expect(getCookieHeader(validationInit)).toContain('_gitlab_session=');
  });

  it('rejects an unsuccessful callback and does not publish anonymous cookies', async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, formHtml))
      .mockResolvedValueOnce(
        response(200, '', [
          '_gitlab_session=anonymous; Path=/',
          'known_sign_in=1; Path=/',
        ]),
      )
      .mockResolvedValueOnce(response(302));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await expect(auth.authenticate(Service.GITLAB)).rejects.toThrow(
      'GitLab authentication did not produce a valid session (status 302)',
    );
    await expect(auth.getCookie(Service.GITLAB)).resolves.toStrictEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[0]).toBe(GITLAB_SESSION_VALIDATION_URL);
    expect(fetchMock.mock.calls[2]?.[1]?.redirect).toBe('manual');
    expect(getCookieHeader(fetchMock.mock.calls[2]?.[1])).toContain(
      '_gitlab_session=anonymous',
    );
  });

  it('replaces all cookies after a repeated successful attempt', async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, formHtml))
      .mockResolvedValueOnce(
        response(200, '', [
          '_gitlab_session=first; Path=/',
          'remember_user_token=old; Path=/',
        ]),
      )
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(200, formHtml))
      .mockResolvedValueOnce(
        response(200, '', ['_gitlab_session=second; Path=/']),
      )
      .mockResolvedValueOnce(response(200));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await auth.authenticate(Service.GITLAB);
    await auth.authenticate(Service.GITLAB);

    const cookies = await auth.getCookie(Service.GITLAB);

    expect(cookies.map((cookie) => cookie.key)).toStrictEqual([
      '_gitlab_session',
    ]);
    expect(cookies[0]?.value).toBe('second');
  });

  it('clears the previous session after a failed repeated attempt', async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, formHtml))
      .mockResolvedValueOnce(
        response(200, '', ['_gitlab_session=first; Path=/']),
      )
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(200, formHtml))
      .mockResolvedValueOnce(
        response(200, '', [
          '_gitlab_session=anonymous; Path=/',
          'known_sign_in=1; Path=/',
        ]),
      )
      .mockResolvedValueOnce(response(302));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await auth.authenticate(Service.GITLAB);

    await expect(auth.authenticate(Service.GITLAB)).rejects.toThrow(
      'GitLab authentication did not produce a valid session',
    );
    await expect(auth.getCookie(Service.GITLAB)).resolves.toStrictEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(fetchMock.mock.calls[5]?.[0]).toBe(GITLAB_SESSION_VALIDATION_URL);
    expect(fetchMock.mock.calls[5]?.[1]?.redirect).toBe('manual');
    expect(getCookieHeader(fetchMock.mock.calls[5]?.[1])).toContain(
      '_gitlab_session=anonymous',
    );
  });

  it.for([
    '<html><body>No LDAP form</body></html>',
    '<form action="/users/auth/ldapmain/callback"><input name="authenticity_token"></form>',
  ])('rejects a missing LDAP form or token before POST', async (html) => {
    fetchMock.mockResolvedValueOnce(response(200, html));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await expect(auth.authenticate(Service.GITLAB)).rejects.toThrow(
      'GitLab sign-in form or authenticity token is missing',
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    await expect(auth.getCookie(Service.GITLAB)).resolves.toStrictEqual([]);
  });

  it('rejects an unsuccessful sign-in response', async () => {
    fetchMock.mockResolvedValueOnce(response(500));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await expect(auth.authenticate(Service.GITLAB)).rejects.toThrow(
      'GitLab sign-in request failed',
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe('GitLab authentication edge cases', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retains a refreshed session across a callback redirect', async () => {
    fetchMock
      .mockResolvedValueOnce(
        responseAt({ body: formHtml, status: 200, url: signInUrl }),
      )
      .mockResolvedValueOnce(
        responseAt({
          cookies: ['_gitlab_session=redirected; Path=/'],
          location: '/',
          status: 302,
          url: GITLAB_LDAP_CALLBACK_URL,
        }),
      )
      .mockResolvedValueOnce(
        responseAt({
          cookies: ['_gitlab_session=refreshed; Path=/'],
          status: 200,
          url: 'https://gitlab.finki.ukim.mk/',
        }),
      )
      .mockResolvedValueOnce(
        responseAt({ status: 200, url: GITLAB_SESSION_VALIDATION_URL }),
      );

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await auth.authenticate(Service.GITLAB);

    const cookies = await auth.getCookie(Service.GITLAB);
    const validationInit = fetchMock.mock.calls[3]?.[1];

    expect(cookies[0]?.value).toBe('refreshed');
    expect(fetchMock.mock.calls[2]?.[0]).toBe('https://gitlab.finki.ukim.mk/');
    expect(getCookieHeader(validationInit)).toContain(
      '_gitlab_session=refreshed',
    );
  });

  it('does not publish a session when transport fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('transport failure'));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await expect(auth.authenticate(Service.GITLAB)).rejects.toThrow(
      'transport failure',
    );
    await expect(auth.getCookie(Service.GITLAB)).resolves.toStrictEqual([]);
  });

  it('clears a prior session after a repeated transport failure', async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, formHtml))
      .mockResolvedValueOnce(
        response(200, '', ['_gitlab_session=first; Path=/']),
      )
      .mockResolvedValueOnce(response(200))
      .mockRejectedValueOnce(new Error('transport failure'));

    const auth = new CasAuthentication({
      password: 'password',
      username: 'username',
    });

    await auth.authenticate(Service.GITLAB);

    await expect(auth.authenticate(Service.GITLAB)).rejects.toThrow(
      'transport failure',
    );
    await expect(auth.getCookie(Service.GITLAB)).resolves.toStrictEqual([]);
  });
});

describe('GitLab validation diagnostics', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.for([
    {
      expected:
        'GitLab authentication did not produce a valid session (status 429; redirect https://gitlab.finki.ukim.mk/users/sign_in)',
      location:
        'https://user:password@gitlab.finki.ukim.mk/users/sign_in?username=secret#hash',
      status: 429,
    },
    {
      expected:
        'GitLab authentication did not produce a valid session (status 503)',
      location: 'https://[invalid',
      status: 503,
    },
    {
      expected:
        'GitLab authentication did not produce a valid session (status 502)',
      location:
        'https://user:password@external.example:8443/users/sign_in?username=secret#hash',
      status: 502,
    },
  ])(
    'reports safe GitLab validation diagnostics for status $status',
    async ({ expected, location, status }) => {
      fetchMock
        .mockResolvedValueOnce(response(200, formHtml))
        .mockResolvedValueOnce(
          response(200, '', ['_gitlab_session=session; Path=/']),
        )
        .mockResolvedValueOnce(responseWithLocation(status, location));

      const auth = new CasAuthentication({
        password: 'password',
        username: 'username',
      });

      const message = await getErrorMessage(auth.authenticate(Service.GITLAB));

      expect(message).toBe(expected);
      expect(message).not.toContain('password');
      expect(message).not.toContain('secret');
      expect(message).not.toContain('username');
      await expect(auth.getCookie(Service.GITLAB)).resolves.toStrictEqual([]);
    },
  );
});

describe('GitLab cookie validity', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false for a redirect without following the sign-in page', async () => {
    fetchMock.mockResolvedValueOnce(response(302, '', []));

    const valid = await isCookieValid({
      cookies: [],
      service: Service.GITLAB,
    });

    expect(valid).toBeFalsy();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(GITLAB_SESSION_VALIDATION_URL);
  });

  it('returns true for a successful validation response', async () => {
    fetchMock.mockResolvedValueOnce(response(200));

    const valid = await isCookieValid({
      cookies: [],
      service: Service.GITLAB,
    });

    expect(valid).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
