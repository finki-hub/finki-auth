import { SERVICE_LOGIN_URLS, SERVICE_URLS } from '../constants.js';
import { Service } from '../lib/Service.js';

export type LiveTestContext = {
  credentialsMissing: boolean;
  probes: Partial<Record<Service, ProbeResult>>;
};

export type ProbeResult = {
  reachable: boolean;
  reason?: string;
};

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

const getErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return String(error);
  }

  return error.cause instanceof Error
    ? `${error.message}: ${error.cause.message}`
    : error.message;
};

// ISPITI is taken offline during exam sessions; skip it when unreachable.
export const probeIspiti = async (): Promise<ProbeResult> => {
  try {
    await fetch(SERVICE_URLS[Service.ISPITI], {
      method: 'HEAD',
      signal: AbortSignal.timeout(ISPITI_PROBE_TIMEOUT_MS),
    });

    return { reachable: true };
  } catch (error: unknown) {
    return {
      reachable: false,
      reason: `Ispiti is unreachable (${getErrorMessage(error)})`,
    };
  }
};

// GitLab's front proxy rejects requests from foreign/cloud networks with a
// bare 403, which blocks the live tests on GitHub-hosted runners. Treat the
// host as unavailable there instead of failing; this only skips on a
// non-successful response or network error, so a reachable-but-broken sign-in
// flow still fails.
export const probeGitlab = async (): Promise<ProbeResult> => {
  let result: ProbeResult;

  try {
    const response = await fetch(SERVICE_LOGIN_URLS[Service.GITLAB], {
      signal: AbortSignal.timeout(GITLAB_PROBE_TIMEOUT_MS),
    });

    await response.body?.cancel();

    result = response.ok
      ? { reachable: true }
      : {
          reachable: false,
          reason: `GitLab is unreachable from this network (HTTP ${response.status})`,
        };
  } catch (error: unknown) {
    result = {
      reachable: false,
      reason: `GitLab is unreachable from this network (${getErrorMessage(error)})`,
    };
  }

  if (!result.reachable) {
    process.stderr.write(`${result.reason}\n`);
  }

  return result;
};

export const getLiveTestContext = async (): Promise<LiveTestContext> => {
  const [ispiti, gitlab] = await Promise.all([probeIspiti(), probeGitlab()]);

  return {
    credentialsMissing: !hasCredentials(),
    probes: {
      [Service.GITLAB]: gitlab,
      [Service.ISPITI]: ispiti,
    },
  };
};

export const getSkipReason = (
  { credentialsMissing, probes }: LiveTestContext,
  service: Service,
  { requireCredentials = true }: { requireCredentials?: boolean } = {},
): string | undefined => {
  if (requireCredentials && credentialsMissing) {
    return 'CAS credentials are not set';
  }

  const probe = probes[service];

  return probe && !probe.reachable ? probe.reason : undefined;
};
