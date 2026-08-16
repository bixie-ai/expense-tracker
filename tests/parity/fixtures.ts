import { test as base, expect, Page } from '@playwright/test';

export const TEST_USER = {
  email: process.env.PARITY_TEST_EMAIL ?? 'parity-test@expense-tracker.test',
  password: process.env.PARITY_TEST_PASSWORD ?? 'ParityTest2024!',
};

export interface ParityFixtures {
  authenticatedPage: Page;
}

export const test = base.extend<ParityFixtures>({
  authenticatedPage: async ({ page, baseURL }, use) => {
    await page.goto(baseURL!);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator(
      'input[type="email"], input[name="email"], [data-testid="email-input"]',
    );
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"], [data-testid="password-input"]',
    );

    await emailInput.first().waitFor({ state: 'visible', timeout: 15_000 });
    await emailInput.first().fill(TEST_USER.email);
    await passwordInput.first().fill(TEST_USER.password);

    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log in")',
    );
    await submitButton.first().click();

    await page.waitForURL((url) => !url.pathname.includes('login'), {
      timeout: 15_000,
    });

    await use(page);
  },
});

export { expect };
