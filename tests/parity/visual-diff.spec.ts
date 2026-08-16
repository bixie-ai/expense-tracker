import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
  email: process.env.PARITY_TEST_EMAIL || 'parity-test@expense-tracker.test',
  password: process.env.PARITY_TEST_PASSWORD || 'ParityTest123!',
};

const SCREENSHOT_OPTIONS = {
  fullPage: true,
  animations: 'disabled' as const,
  mask: [] as any[],
};

const MAX_DIFF_PIXEL_RATIO = 0.05;

async function loginAngular(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForSelector('input[name="email"]', { timeout: 15_000 });
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"], button:has-text("Login")');
  await page.waitForURL('**/dashboard', { timeout: 20_000 });
}

async function loginReact(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForSelector('#email', { timeout: 15_000 });
  await page.fill('#email', TEST_USER.email);
  await page.fill('#password', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 20_000 });
}

async function login(page: Page, projectName: string): Promise<void> {
  if (projectName === 'angular') {
    await loginAngular(page);
  } else {
    await loginReact(page);
  }
}

async function waitForPageStable(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

function getMaskSelectors(page: Page) {
  return [
    page.locator('[data-testid="timestamp"]'),
    page.locator('.spinner, mat-spinner, [role="progressbar"]'),
    page.locator('[class*="loading"]'),
  ];
}

test.describe('Visual Parity - Dashboard', () => {
  test('capture dashboard screenshot', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    await login(page, projectName);

    if (projectName === 'angular') {
      await page.goto('/dashboard');
    } else {
      await page.goto('/');
    }

    await waitForPageStable(page);

    await expect(page).toHaveScreenshot(`dashboard-${projectName}.png`, {
      ...SCREENSHOT_OPTIONS,
      mask: getMaskSelectors(page),
      maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
    });
  });
});

test.describe('Visual Parity - Settings', () => {
  test('capture settings screenshot', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    await login(page, projectName);

    await page.goto('/settings');
    await waitForPageStable(page);

    await expect(page).toHaveScreenshot(`settings-${projectName}.png`, {
      ...SCREENSHOT_OPTIONS,
      mask: getMaskSelectors(page),
      maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
    });
  });
});

test.describe('Visual Parity - Expense Entry', () => {
  test('capture expense entry form screenshot', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    await login(page, projectName);

    if (projectName === 'angular') {
      await page.goto('/new-expense');
      await page.waitForSelector('input[name="name"]', { timeout: 15_000 });
    } else {
      await page.goto('/log-expense');
      await page.waitForSelector('[name="name"], #name', { timeout: 15_000 });
    }

    await waitForPageStable(page);

    await expect(page).toHaveScreenshot(
      `expense-entry-${projectName}.png`,
      {
        ...SCREENSHOT_OPTIONS,
        mask: getMaskSelectors(page),
        maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
      },
    );
  });
});

test.describe('Visual Parity - Login Page', () => {
  test('capture login page screenshot', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot(`login-${projectName}.png`, {
      ...SCREENSHOT_OPTIONS,
      mask: getMaskSelectors(page),
      maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
    });
  });
});

test.describe('Cross-App Visual Comparison', () => {
  test.skip(
    ({ }, testInfo) => testInfo.project.name !== 'react',
    'Cross-app comparison only runs in the react project',
  );

  test('compare angular vs react screenshots exist', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const snapshotDir = path.join(__dirname, 'visual-diff.spec.ts-snapshots');

    const screens = ['dashboard', 'settings', 'expense-entry', 'login'];
    const missingSnapshots: string[] = [];

    for (const screen of screens) {
      const angularSnapshot = path.join(
        snapshotDir,
        `${screen}-angular-${process.platform}.png`,
      );
      const reactSnapshot = path.join(
        snapshotDir,
        `${screen}-react-${process.platform}.png`,
      );

      if (!fs.existsSync(angularSnapshot)) {
        missingSnapshots.push(`${screen}-angular`);
      }
      if (!fs.existsSync(reactSnapshot)) {
        missingSnapshots.push(`${screen}-react`);
      }
    }

    if (missingSnapshots.length > 0) {
      test.info().annotations.push({
        type: 'info',
        description: `Run with --update-snapshots to generate baseline: ${missingSnapshots.join(', ')}`,
      });
    }
  });
});
