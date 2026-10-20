import { defineConfig, defaultExclude } from 'vitest/config';
import { fileURLToPath } from 'url';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 15000,
    pool: 'forks',
    fileParallelism: true,
    maxWorkers: 2,
    exclude: [...defaultExclude, "tests/e2e/**"],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
