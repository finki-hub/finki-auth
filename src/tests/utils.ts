import 'dotenv/config';
import assert from 'node:assert';

export const getCredentials = () => {
  const username = process.env['CAS_USERNAME'];
  const password = process.env['CAS_PASSWORD'];

  assert(username);
  assert(password);

  return {
    password,
    username,
  };
};
