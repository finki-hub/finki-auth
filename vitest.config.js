import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    retry: 2,
    testTimeout: 120_000,
  },
});
