import { SERVICE_URLS } from '../constants.js';
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
