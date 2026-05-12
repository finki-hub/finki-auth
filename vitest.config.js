import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    retry: 2,
    testTimeout: 120_000,
  },
});
