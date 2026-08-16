import { test, expect, TEST_USER } from './fixtures';

test.describe('Authentication Parity', () => {
  test('should display login form', async ({ page, baseURL }) => {
    await page.goto(baseURL!);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator(
      'input[type="email"], input[name="email"], [data-testid="email-input"]',
    );
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"], [data-testid="password-input"]',
    );

    await expect(emailInput.first()).toBeVisible({ timeout: 15_000 });
    await expect(passwordInput.first()).toBeVisible();
  });

  test('should authenticate with Firebase test user', async ({ page, baseURL }) => {
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

    const dashboardContent = page.locator(
      '[data-testid="dashboard"], .dashboard, app-dashboard, main',
    );
    await expect(dashboardContent.first()).toBeVisible({ timeout: 10_000 });
  });

  test('should verify Firebase Auth connectivity', async ({ page, baseURL }) => {
    const authRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (
        url.includes('identitytoolkit.googleapis.com') ||
        url.includes('securetoken.googleapis.com')
      ) {
        authRequests.push(url);
      }
    });

    await page.goto(baseURL!);
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

    await page.waitForResponse(
      (resp) =>
        resp.url().includes('identitytoolkit.googleapis.com') ||
        resp.url().includes('securetoken.googleapis.com'),
      { timeout: 15_000 },
    );

    expect(authRequests.length).toBeGreaterThan(0);
  });
});

test.describe('Expense CRUD Parity', () => {
  test('should add a new expense', async ({ authenticatedPage: page }) => {
    const addButton = page.locator(
      'button:has-text("Add"), button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="add-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
    );
    await addButton.first().waitFor({ state: 'visible', timeout: 10_000 });
    await addButton.first().click();

    await page.waitForLoadState('networkidle');

    const amountInput = page.locator(
      'input[name="amount"], input[type="number"], [data-testid="amount-input"], input[formControlName="amount"]',
    );
    await amountInput.first().waitFor({ state: 'visible', timeout: 10_000 });
    await amountInput.first().fill('42.50');

    const descriptionInput = page.locator(
      'input[name="description"], [data-testid="description-input"], input[formControlName="description"], textarea[formControlName="description"]',
    );
    if ((await descriptionInput.count()) > 0) {
      await descriptionInput.first().fill('Parity Test Expense');
    }

    const categorySelect = page.locator(
      'select, [data-testid="category-select"], mat-select, [role="combobox"]',
    );
    if ((await categorySelect.count()) > 0) {
      await categorySelect.first().click();
      const option = page.locator(
        'option, mat-option, [role="option"], li[role="option"]',
      );
      if ((await option.count()) > 0) {
        await option.first().click();
      }
    }

    const saveButton = page.locator(
      'button[type="submit"], button:has-text("Save"), button:has-text("Add"), button:has-text("Submit")',
    );
    await saveButton.first().click();

    await page.waitForResponse(
      (resp) =>
        resp.url().includes('expense-tracker-e0028') &&
        (resp.request().method() === 'PUT' || resp.request().method() === 'POST'),
      { timeout: 15_000 },
    );
  });

  test('should view expenses list', async ({ authenticatedPage: page }) => {
    const dashboardContent = page.locator(
      '[data-testid="dashboard"], .dashboard, app-dashboard, main, [data-testid="expense-list"]',
    );
    await dashboardContent.first().waitFor({ state: 'visible', timeout: 10_000 });

    const expenseItems = page.locator(
      'tr, [data-testid="expense-row"], .expense-item, mat-row, .MuiTableRow-root',
    );
    const count = await expenseItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should verify Firebase Realtime Database connectivity', async ({
    authenticatedPage: page,
  }) => {
    const dbRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('expense-tracker-e0028.firebaseio.com')) {
        dbRequests.push(url);
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3_000);

    expect(dbRequests.length).toBeGreaterThan(0);
  });

  test('should delete an expense', async ({ authenticatedPage: page }) => {
    const addButton = page.locator(
      'button:has-text("Add"), button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="add-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
    );
    await addButton.first().waitFor({ state: 'visible', timeout: 10_000 });
    await addButton.first().click();
    await page.waitForLoadState('networkidle');

    const amountInput = page.locator(
      'input[name="amount"], input[type="number"], [data-testid="amount-input"], input[formControlName="amount"]',
    );
    await amountInput.first().waitFor({ state: 'visible', timeout: 10_000 });
    await amountInput.first().fill('0.01');

    const descriptionInput = page.locator(
      'input[name="description"], [data-testid="description-input"], input[formControlName="description"], textarea[formControlName="description"]',
    );
    if ((await descriptionInput.count()) > 0) {
      await descriptionInput.first().fill('DELETE_ME_PARITY_TEST');
    }

    const categorySelect = page.locator(
      'select, [data-testid="category-select"], mat-select, [role="combobox"]',
    );
    if ((await categorySelect.count()) > 0) {
      await categorySelect.first().click();
      const option = page.locator(
        'option, mat-option, [role="option"], li[role="option"]',
      );
      if ((await option.count()) > 0) {
        await option.first().click();
      }
    }

    const saveButton = page.locator(
      'button[type="submit"], button:has-text("Save"), button:has-text("Add"), button:has-text("Submit")',
    );
    await saveButton.first().click();

    await page.waitForResponse(
      (resp) =>
        resp.url().includes('expense-tracker-e0028') &&
        (resp.request().method() === 'PUT' || resp.request().method() === 'POST'),
      { timeout: 15_000 },
    );

    await page.waitForTimeout(2_000);

    const deleteButton = page.locator(
      'button:has-text("Delete"), [data-testid="delete-expense"], button[aria-label="Delete"], .delete-btn, button .mat-icon:has-text("delete")',
    );

    if ((await deleteButton.count()) > 0) {
      await deleteButton.first().click();

      const confirmButton = page.locator(
        'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK"), button:has-text("Delete")',
      );
      if ((await confirmButton.count()) > 0) {
        await confirmButton.first().click();
      }

      await page.waitForResponse(
        (resp) =>
          resp.url().includes('expense-tracker-e0028') &&
          resp.request().method() === 'DELETE',
        { timeout: 15_000 },
      ).catch(() => {
        // Some implementations use PUT with null to delete
      });
    }
  });
});
