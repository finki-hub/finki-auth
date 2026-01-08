import 'dotenv/config';

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
