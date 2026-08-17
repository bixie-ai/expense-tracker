import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const ANGULAR_BASE_URL = process.env.ANGULAR_URL ?? 'http://localhost:4200';
const REACT_BASE_URL = process.env.REACT_URL ?? 'http://localhost:5173';

const VISUAL_THRESHOLD = 0.001; // 0.1% pixel variance

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: path.resolve(__dirname, 'html-report') }],
    ['list'],
  ],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
      animations: 'disabled',
      caret: 'hide',
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    },
  },
  snapshotDir: path.resolve(__dirname, 'snapshots'),
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testFilePath}/{arg}{ext}',
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'angular',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: ANGULAR_BASE_URL,
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'react',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: REACT_BASE_URL,
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  outputDir: path.resolve(__dirname, 'test-results'),
});

export { VISUAL_THRESHOLD, ANGULAR_BASE_URL, REACT_BASE_URL };
