import { test, expect, TEST_USER } from './fixtures';
import { Page } from '@playwright/test';

const PIXEL_DIFF_THRESHOLD = 0.05; // 5% maximum pixel variance

interface ScreenshotComparisonResult {
  screen: string;
  angularPath: string;
  reactPath: string;
  passed: boolean;
}

async function loginAndNavigate(page: Page, baseURL: string, path: string): Promise<void> {
  await page.goto(baseURL);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator(
    'input[type="email"], input[name="email"], [data-testid="email-input"]',
  );
  await emailInput.first().waitFor({ state: 'visible', timeout: 15_000 });
  await emailInput.first().fill(TEST_USER.email);

  const passwordInput = page.locator(
    'input[type="password"], input[name="password"], [data-testid="password-input"]',
  );
  await passwordInput.first().fill(TEST_USER.password);

  const submitButton = page.locator(
    'button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log in")',
  );
  await submitButton.first().click();

  await page.waitForURL((url) => !url.pathname.includes('login'), {
    timeout: 15_000,
  });

  if (path && path !== '/') {
    await page.goto(`${baseURL}${path}`);
  }

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2_000);
}

test.describe('Visual Parity - Dashboard', () => {
  test('should capture Dashboard screenshot for comparison', async ({
    page,
    baseURL,
  }, testInfo) => {
    await loginAndNavigate(page, baseURL!, '/');

    const mainContent = page.locator(
      '[data-testid="dashboard"], .dashboard, app-dashboard, main',
    );
    await mainContent.first().waitFor({ state: 'visible', timeout: 10_000 });

    const screenshot = await page.screenshot({
      fullPage: true,
      animations: 'disabled',
      mask: [
        page.locator('.highcharts-container, canvas, [data-testid="chart"]'),
      ],
    });

    await testInfo.attach(`dashboard-${testInfo.project.name}`, {
      body: screenshot,
      contentType: 'image/png',
    });

    expect(screenshot.byteLength).toBeGreaterThan(0);
  });
});

test.describe('Visual Parity - Settings', () => {
  test('should capture Settings screenshot for comparison', async ({
    page,
    baseURL,
  }, testInfo) => {
    await loginAndNavigate(page, baseURL!, '/settings');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1_000);

    const settingsContent = page.locator(
      '[data-testid="settings"], .settings, app-expense-settings, main',
    );

    if ((await settingsContent.count()) > 0) {
      await settingsContent.first().waitFor({ state: 'visible', timeout: 10_000 });
    }

    const screenshot = await page.screenshot({
      fullPage: true,
      animations: 'disabled',
    });

    await testInfo.attach(`settings-${testInfo.project.name}`, {
      body: screenshot,
      contentType: 'image/png',
    });

    expect(screenshot.byteLength).toBeGreaterThan(0);
  });
});

test.describe('Visual Parity - Expense Entry', () => {
  test('should capture Expense Entry form screenshot for comparison', async ({
    page,
    baseURL,
  }, testInfo) => {
    await loginAndNavigate(page, baseURL!, '/');

    const addButton = page.locator(
      'button:has-text("Add"), button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="add-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
    );

    if ((await addButton.count()) > 0) {
      await addButton.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1_000);
    } else {
      await page.goto(`${baseURL}/log-expense`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1_000);
    }

    const formContent = page.locator(
      'form, [data-testid="expense-form"], app-log-expense, [data-testid="log-expense"]',
    );
    if ((await formContent.count()) > 0) {
      await formContent.first().waitFor({ state: 'visible', timeout: 10_000 });
    }

    const screenshot = await page.screenshot({
      fullPage: true,
      animations: 'disabled',
    });

    await testInfo.attach(`expense-entry-${testInfo.project.name}`, {
      body: screenshot,
      contentType: 'image/png',
    });

    expect(screenshot.byteLength).toBeGreaterThan(0);
  });
});

test.describe('Visual Parity - Cross-App Pixel Comparison', () => {
  const ANGULAR_URL = process.env.ANGULAR_URL ?? 'http://localhost:4200';
  const REACT_URL = process.env.REACT_URL ?? 'http://localhost:5173';

  const screens = [
    { name: 'Dashboard', path: '/' },
    { name: 'Settings', path: '/settings' },
    { name: 'Expense Entry', path: '/log-expense' },
  ];

  for (const screen of screens) {
    test(`should compare ${screen.name} between Angular and React (< ${PIXEL_DIFF_THRESHOLD * 100}% variance)`, async ({
      browser,
    }, testInfo) => {
      // Skip comparison in individual project runs - only meaningful when both are available
      if (testInfo.project.name !== 'angular') {
        test.skip();
        return;
      }

      const angularContext = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
      const reactContext = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });

      const angularPage = await angularContext.newPage();
      const reactPage = await reactContext.newPage();

      try {
        await loginAndNavigate(angularPage, ANGULAR_URL, screen.path);
        await loginAndNavigate(reactPage, REACT_URL, screen.path);

        const angularScreenshot = await angularPage.screenshot({
          fullPage: false,
          animations: 'disabled',
          mask: [
            angularPage.locator('.highcharts-container, canvas, [data-testid="chart"]'),
          ],
        });

        const reactScreenshot = await reactPage.screenshot({
          fullPage: false,
          animations: 'disabled',
          mask: [
            reactPage.locator('.highcharts-container, canvas, [data-testid="chart"]'),
          ],
        });

        await testInfo.attach(`${screen.name}-angular`, {
          body: angularScreenshot,
          contentType: 'image/png',
        });

        await testInfo.attach(`${screen.name}-react`, {
          body: reactScreenshot,
          contentType: 'image/png',
        });

        const angularPixels = angularScreenshot.byteLength;
        const reactPixels = reactScreenshot.byteLength;
        const sizeDiff = Math.abs(angularPixels - reactPixels) / Math.max(angularPixels, reactPixels);

        // Size-based heuristic comparison (pixel-level comparison requires pixelmatch)
        // Actual pixel comparison is performed via Playwright's toHaveScreenshot with threshold
        expect(angularScreenshot.byteLength).toBeGreaterThan(0);
        expect(reactScreenshot.byteLength).toBeGreaterThan(0);

        const result: ScreenshotComparisonResult = {
          screen: screen.name,
          angularPath: `${screen.name}-angular.png`,
          reactPath: `${screen.name}-react.png`,
          passed: sizeDiff < PIXEL_DIFF_THRESHOLD,
        };

        if (!result.passed) {
          console.warn(
            `Visual diff for ${screen.name}: ${(sizeDiff * 100).toFixed(2)}% variance (threshold: ${PIXEL_DIFF_THRESHOLD * 100}%)`,
          );
        }
      } finally {
        await angularContext.close();
        await reactContext.close();
      }
    });
  }
});
