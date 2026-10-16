import {
  base,
  node,
  perfectionist,
  prettier,
  typescript,
  vitest,
} from 'eslint-config-imperium';

const config = [
  { ignores: ['dist'] },
  ...base,
  node,
  perfectionist,
  prettier,
  typescript,
  vitest,
  {
    files: ['src/index.ts'],
    rules: {
      'no-barrel-files/no-barrel-files': 'off',
    },
  },
  {
    files: ['src/constants.ts'],
    rules: {
      'sonarjs/no-clear-text-protocols': 'off',
      'unicorn/prefer-https': 'off',
    },
  },
  {
    files: ['src/tests/**/*.ts'],
    rules: {
      'vitest/prefer-strict-boolean-matchers': 'off',
    },
  },
  {
    files: ['vitest.config.js'],
    rules: {
      'unicorn/no-top-level-side-effects': 'off',
    },
  },
];

export default config;
