import { SERVICE_LOGIN_URLS, SERVICE_URLS } from '../constants.js';
import { Service } from '../lib/Service.js';

try {
  process.loadEnvFile();
} catch (error: unknown) {
  if (
    !(error instanceof Error) ||
    !('code' in error) ||
    error.code !== 'ENOENT'
  ) {
    throw error;
  }
}

const ISPITI_PROBE_TIMEOUT_MS = 5_000;
const GITLAB_PROBE_TIMEOUT_MS = 5_000;

export const hasCredentials = () => {
  const username = process.env['CAS_USERNAME'];
  const password = process.env['CAS_PASSWORD'];

  return Boolean(username && password);
};

export const getCredentials = () => {
  const username = process.env['CAS_USERNAME'];
  const password = process.env['CAS_PASSWORD'];

  if (!username || !password) {
    throw new Error(
      'CAS_USERNAME and CAS_PASSWORD environment variables must be set',
    );
  }

  return {
    password,
    username,
  };
};

export const INVALID_CREDENTIALS = {
  password: 'invalid',
  username: 'invalid',
} as const;

// ISPITI is taken offline during exam sessions — the only service we skip.
export const isIspitiReachable = async (): Promise<boolean> => {
  try {
    await fetch(SERVICE_URLS[Service.ISPITI], {
      method: 'HEAD',
      signal: AbortSignal.timeout(ISPITI_PROBE_TIMEOUT_MS),
    });

    return true;
  } catch {
    return false;
  }
};

// GitLab's front proxy rejects requests from foreign/cloud networks with a
// bare 403, which blocks the live tests on GitHub-hosted runners. Treat the
// host as unavailable there instead of failing; this only skips on a
// non-successful response, so a reachable-but-broken sign-in flow still fails.
export const probeGitlab = async (): Promise<{
  reachable: boolean;
  reason?: string;
}> => {
  try {
    const response = await fetch(SERVICE_LOGIN_URLS[Service.GITLAB], {
      signal: AbortSignal.timeout(GITLAB_PROBE_TIMEOUT_MS),
    });

    await response.body?.cancel();

    return response.ok
      ? { reachable: true }
      : {
          reachable: false,
          reason: `GitLab is unreachable from this network (HTTP ${response.status})`,
        };
  } catch (error: unknown) {
    return {
      reachable: false,
      reason: `GitLab is unreachable from this network (${error instanceof Error ? error.message : String(error)})`,
    };
  }
};
