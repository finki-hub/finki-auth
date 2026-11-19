import { afterEach, describe, expect, it, vi } from 'vitest';

import { probeGitlab } from './utils.js';

const stubFetch = (implementation: () => Promise<Response>): void => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(implementation));
};

describe('probeGitlab', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reports the host unreachable with the HTTP status on a 403', async () => {
    stubFetch(() => Promise.resolve(new Response('', { status: 403 })));
    const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    await expect(probeGitlab()).resolves.toStrictEqual({
      reachable: false,
      reason: 'GitLab is unreachable from this network (HTTP 403)',
    });
    expect(write).toHaveBeenCalledWith(
      'GitLab is unreachable from this network (HTTP 403)\n',
    );
  });

  it('reports the host reachable on a 200', async () => {
    stubFetch(() =>
      Promise.resolve(new Response('<html></html>', { status: 200 })),
    );
    const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    await expect(probeGitlab()).resolves.toStrictEqual({ reachable: true });
    expect(write).not.toHaveBeenCalled();
  });

  it('reports a network failure with its cause', async () => {
    stubFetch(() => {
      throw new TypeError('fetch failed', {
        cause: new Error('connect ECONNREFUSED'),
      });
    });
    const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    await expect(probeGitlab()).resolves.toStrictEqual({
      reachable: false,
      reason:
        'GitLab is unreachable from this network (fetch failed: connect ECONNREFUSED)',
    });
    expect(write).toHaveBeenCalledWith(
      'GitLab is unreachable from this network (fetch failed: connect ECONNREFUSED)\n',
    );
  });
});
