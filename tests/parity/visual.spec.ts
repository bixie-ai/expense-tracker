import { test, expect, Page } from '@playwright/test';
import mockData from './utils/mock-data.json';

const ANGULAR_URL = process.env.ANGULAR_URL ?? 'http://localhost:4200';
const REACT_URL = process.env.REACT_URL ?? 'http://localhost:5173';

const TEST_USER = {
  email: process.env.PARITY_TEST_EMAIL ?? mockData.user.email,
  password: process.env.PARITY_TEST_PASSWORD ?? 'ParityTest2024!',
};

async function authenticate(page: Page, baseURL: string): Promise<void> {
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
  await page.waitForLoadState('networkidle');
}

async function navigateAndWait(page: Page, baseURL: string, path: string): Promise<void> {
  await page.goto(`${baseURL}${path}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1_500);
}

test.describe('Visual Regression - Per-App Baselines', () => {
  for (const route of mockData.routes) {
    test(`${route.name} (${route.path}) matches visual baseline`, async ({
      page,
      baseURL,
    }, testInfo) => {
      if (route.path === '/login') {
        await page.goto(baseURL!);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1_000);
      } else {
        await authenticate(page, baseURL!);
        await navigateAndWait(page, baseURL!, route.path);
      }

      await expect(page).toHaveScreenshot(`${route.name.toLowerCase().replace(/\s+/g, '-')}.png`, {
        fullPage: true,
        animations: 'disabled',
        mask: [
          page.locator('.highcharts-container, canvas, [data-testid="chart"]'),
          page.locator('[data-testid="timestamp"], .timestamp, time'),
        ],
      });
    });
  }
});

test.describe('Visual Regression - Cross-App Parity', () => {
  const testRoutes = mockData.routes.filter((r) => r.path !== '/login');

  for (const route of testRoutes) {
    test(`${route.name} visual parity between Angular and React`, async ({
      browser,
    }, testInfo) => {
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
        await authenticate(angularPage, ANGULAR_URL);
        await authenticate(reactPage, REACT_URL);

        await navigateAndWait(angularPage, ANGULAR_URL, route.path);
        await navigateAndWait(reactPage, REACT_URL, route.path);

        const maskSelectors = '.highcharts-container, canvas, [data-testid="chart"], [data-testid="timestamp"], .timestamp, time';

        const angularScreenshot = await angularPage.screenshot({
          fullPage: true,
          animations: 'disabled',
          mask: [angularPage.locator(maskSelectors)],
        });

        const reactScreenshot = await reactPage.screenshot({
          fullPage: true,
          animations: 'disabled',
          mask: [reactPage.locator(maskSelectors)],
        });

        await testInfo.attach(`${route.name}-angular`, {
          body: angularScreenshot,
          contentType: 'image/png',
        });

        await testInfo.attach(`${route.name}-react`, {
          body: reactScreenshot,
          contentType: 'image/png',
        });

        await expect(angularPage).toHaveScreenshot(
          `cross-app-${route.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          {
            fullPage: true,
            animations: 'disabled',
            mask: [angularPage.locator(maskSelectors)],
          },
        );

        await expect(reactPage).toHaveScreenshot(
          `cross-app-${route.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          {
            fullPage: true,
            animations: 'disabled',
            mask: [reactPage.locator(maskSelectors)],
          },
        );
      } finally {
        await angularContext.close();
        await reactContext.close();
      }
    });
  }

  test('Login page visual parity between Angular and React', async ({
    browser,
  }, testInfo) => {
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
      await angularPage.goto(ANGULAR_URL);
      await angularPage.waitForLoadState('networkidle');
      await angularPage.waitForTimeout(1_000);

      await reactPage.goto(REACT_URL);
      await reactPage.waitForLoadState('networkidle');
      await reactPage.waitForTimeout(1_000);

      const angularScreenshot = await angularPage.screenshot({
        fullPage: true,
        animations: 'disabled',
      });

      const reactScreenshot = await reactPage.screenshot({
        fullPage: true,
        animations: 'disabled',
      });

      await testInfo.attach('login-angular', {
        body: angularScreenshot,
        contentType: 'image/png',
      });

      await testInfo.attach('login-react', {
        body: reactScreenshot,
        contentType: 'image/png',
      });

      await expect(angularPage).toHaveScreenshot('cross-app-login.png', {
        fullPage: true,
        animations: 'disabled',
      });

      await expect(reactPage).toHaveScreenshot('cross-app-login.png', {
        fullPage: true,
        animations: 'disabled',
      });
    } finally {
      await angularContext.close();
      await reactContext.close();
    }
  });
});
