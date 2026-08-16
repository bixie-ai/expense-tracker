import { defineConfig, devices } from '@playwright/test';

const ANGULAR_BASE_URL = process.env.ANGULAR_URL ?? 'http://localhost:4200';
const REACT_BASE_URL = process.env.REACT_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'angular',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: ANGULAR_BASE_URL,
      },
    },
    {
      name: 'react',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: REACT_BASE_URL,
      },
    },
  ],
  outputDir: './test-results',
});
