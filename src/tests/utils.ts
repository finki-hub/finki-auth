import type { Service } from '../lib/Service.js';

import { SERVICE_URLS } from '../constants.js';

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

const SERVICE_PROBE_TIMEOUT_MS = 5_000;

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

// Lightweight liveness probe. Only ISPITI is expected to ever be down (it is
// taken offline during exam sessions), so this is used to skip ISPITI alone;
// every other service is expected to respond and its tests fail if it does not.
export const isServiceReachable = async (
  service: Service,
): Promise<boolean> => {
  try {
    await fetch(SERVICE_URLS[service], {
      method: 'HEAD',
      signal: AbortSignal.timeout(SERVICE_PROBE_TIMEOUT_MS),
    });

    return true;
  } catch {
    return false;
  }
};
