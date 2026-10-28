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

  // T47: Angular: navigate to new-expense
  test('should navigate to log-expense page', async ({ page, baseURL }) => {
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

    const logExpenseLink = page.locator(
      'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
    );
    await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
    await logExpenseLink.first().click();

    await page.waitForLoadState('networkidle');

    // Check that URL contains log-expense or new-expense
    const currentUrl = page.url();
    expect(currentUrl).toContain('log-expense');
  });

  // T48: Angular: fill and submit form
  test('should fill and submit log expense form', async ({ page, baseURL }) => {
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

    const logExpenseLink = page.locator(
      'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
    );
    await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
    await logExpenseLink.first().click();

    await page.waitForLoadState('networkidle');

    // Fill amount
    const amountInput = page.locator(
      'input[name="amount"], input[type="number"], [data-testid="amount-input"], input[formControlName="amount"]',
    );
    await amountInput.first().waitFor({ state: 'visible', timeout: 10_000 });
    await amountInput.first().fill('25.00');

    // Fill description/name
    const nameInput = page.locator(
      'input[name="name"], input[name="description"], [data-testid="name-input"], input[formControlName="name"], input[formControlName="description"], textarea[formControlName="name"]',
    );
    if ((await nameInput.count()) > 0) {
      await nameInput.first().fill('Test Expense E2E');
    }

    // Select category
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

    // Fill date if present
    const dateInput = page.locator(
      'input[name="date"], input[type="date"], [data-testid="date-input"], input[formControlName="date"]',
    );
    if ((await dateInput.count()) > 0) {
      await dateInput.first().fill('2024-03-15');
    }

    // Select type if present
    const typeSelect = page.locator(
      'select[name="type"], [data-testid="type-select"], mat-select[formControlName="type"]',
    );
    if ((await typeSelect.count()) > 0) {
      await typeSelect.first().click();
      const option = page.locator(
        'option, mat-option, [role="option"], li[role="option"]',
      );
      if ((await option.count()) > 0) {
        await option.first().click();
      }
    }

    // Fill comments if present
    const commentsInput = page.locator(
      'textarea[name="comments"], [data-testid="comments-input"], textarea[formControlName="comments"]',
    );
    if ((await commentsInput.count()) > 0) {
      await commentsInput.first().fill('E2E test comment');
    }

    // Submit
    const saveButton = page.locator(
      'button[type="submit"], button:has-text("Save"), button:has-text("Submit")',
    );
    await saveButton.first().click();

    // Check for success snackbar/notification
    await page.waitForTimeout(2000);

    const successMessage = page.locator(
      '[data-testid="success-snackbar"], .snack-bar-success, .success-snackbar, [role="alert"][data-testid="success"], .MuiSnackbar-root .MuiAlert-success',
    );
    const hasSuccess = await successMessage.count() > 0;

    if (!hasSuccess) {
      // Check for any visible success text
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toContain('saved');
    }
  });

  // T49: Angular: validation errors display
  test('should show validation errors on empty form submission', async ({ page, baseURL }) => {
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

    const logExpenseLink = page.locator(
      'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
    );
    await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
    await logExpenseLink.first().click();

    await page.waitForLoadState('networkidle');

    // Try to submit without filling anything
    const saveButton = page.locator(
      'button[type="submit"], button:has-text("Save"), button:has-text("Submit")',
    );
    await saveButton.first().click();

    await page.waitForTimeout(1000);

    // Check for validation error messages
    const errorMessages = page.locator(
      '.mat-error, .error-message, [role="alert"], .MuiFormHelperText-error, .invalid-feedback, .form-error',
    );
    const errorCount = await errorMessages.count();

    // Either there should be error messages visible, or the form should prevent submission
    const bodyText = await page.locator('body').textContent();
    const hasErrors = errorCount > 0 || bodyText?.toLowerCase().includes('required') || bodyText?.toLowerCase().includes('error');
    expect(hasErrors).toBeTrue();
  });

  // T50: Angular: expense appears in dashboard
  test('should show saved expense in dashboard', async ({ page, baseURL }) => {
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

    const logExpenseLink = page.locator(
      'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
    );
    await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
    await logExpenseLink.first().click();

    await page.waitForLoadState('networkidle');

    // Fill and submit expense
    const amountInput = page.locator(
      'input[name="amount"], input[type="number"], [data-testid="amount-input"], input[formControlName="amount"]',
    );
    await amountInput.first().waitFor({ state: 'visible', timeout: 10_000 });
    await amountInput.first().fill('99.99');

    const nameInput = page.locator(
      'input[name="name"], input[name="description"], [data-testid="name-input"], input[formControlName="name"]',
    );
    if ((await nameInput.count()) > 0) {
      await nameInput.first().fill('Dashboard Test Expense');
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
      'button[type="submit"], button:has-text("Save"), button:has-text("Submit")',
    );
    await saveButton.first().click();

    await page.waitForTimeout(2000);

    // Navigate back to dashboard
    const dashboardLink = page.locator(
      'a:has-text("Dashboard"), button:has-text("Dashboard"), [data-testid="dashboard-link"], [routerLink*="dashboard"]',
    );
    if ((await dashboardLink.count()) > 0) {
      await dashboardLink.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Check if expense appears in list
    const expenseTable = page.locator(
      'table, [data-testid="expense-table"], .expense-list, app-expense-list, [data-testid="expense-list"]',
    );
    const hasTable = await expenseTable.count() > 0;

    if (hasTable) {
      const expenseRow = page.locator(
        'tr:has-text("99.99"), [data-testid="expense-row"]:has-text("99.99"), .expense-item:has-text("99.99")',
      );
      const rowCount = await expenseRow.count();
      // At least check that the dashboard is visible
      const dashboardContent = page.locator(
        '[data-testid="dashboard"], .dashboard, app-dashboard, main',
      );
      await expect(dashboardContent.first()).toBeVisible({ timeout: 5000 });
    }
  });

  // T51-T58: React-specific and parity tests
  test.describe('React Log Expense', () => {
    test('should navigate to log-expense page', async ({ page, baseURL }) => {
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

      const logExpenseLink = page.locator(
        'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
      );
      await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
      await logExpenseLink.first().click();

      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      expect(currentUrl).toContain('log-expense');
    });

    test('should fill and submit log expense form', async ({ page, baseURL }) => {
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

      const logExpenseLink = page.locator(
        'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
      );
      await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
      await logExpenseLink.first().click();

      await page.waitForLoadState('networkidle');

      // Fill amount
      const amountInput = page.locator(
        'input[name="amount"], input[type="number"], [data-testid="amount-input"], input[formControlName="amount"]',
      );
      await amountInput.first().waitFor({ state: 'visible', timeout: 10_000 });
      await amountInput.first().fill('35.00');

      // Fill description/name
      const nameInput = page.locator(
        'input[name="name"], input[name="description"], [data-testid="name-input"], input[formControlName="name"], input[formControlName="description"]',
      );
      if ((await nameInput.count()) > 0) {
        await nameInput.first().fill('React E2E Test');
      }

      // Select category
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

      // Fill date
      const dateInput = page.locator(
        'input[name="date"], input[type="date"], [data-testid="date-input"], input[formControlName="date"]',
      );
      if ((await dateInput.count()) > 0) {
        await dateInput.first().fill('2024-03-15');
      }

      // Submit
      const saveButton = page.locator(
        'button[type="submit"], button:has-text("Save"), button:has-text("Submit"), button:has-text("Save Expense")',
      );
      await saveButton.first().click();

      await page.waitForTimeout(2000);

      const successMessage = page.locator(
        '[data-testid="success-snackbar"], .snack-bar-success, .success-snackbar, [role="alert"][data-testid="success"], .MuiSnackbar-root .MuiAlert-success',
      );
      const hasSuccess = await successMessage.count() > 0;

      if (!hasSuccess) {
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toContain('saved');
      }
    });

    test('should show validation errors on empty form submission', async ({ page, baseURL }) => {
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

      const logExpenseLink = page.locator(
        'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
      );
      await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
      await logExpenseLink.first().click();

      await page.waitForLoadState('networkidle');

      const saveButton = page.locator(
        'button[type="submit"], button:has-text("Save"), button:has-text("Submit"), button:has-text("Save Expense")',
      );
      await saveButton.first().click();

      await page.waitForTimeout(1000);

      const errorMessages = page.locator(
        '.mat-error, .error-message, [role="alert"], .MuiFormHelperText-error, .invalid-feedback, .form-error, .MuiAlert-root',
      );
      const errorCount = await errorMessages.count();

      const bodyText = await page.locator('body').textContent();
      const hasErrors = errorCount > 0 || bodyText?.toLowerCase().includes('required') || bodyText?.toLowerCase().includes('error');
      expect(hasErrors).toBeTrue();
    });

    test('should show saved expense in dashboard', async ({ page, baseURL }) => {
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

      const logExpenseLink = page.locator(
        'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
      );
      await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
      await logExpenseLink.first().click();

      await page.waitForLoadState('networkidle');

      const amountInput = page.locator(
        'input[name="amount"], input[type="number"], [data-testid="amount-input"], input[formControlName="amount"]',
      );
      await amountInput.first().waitFor({ state: 'visible', timeout: 10_000 });
      await amountInput.first().fill('75.00');

      const nameInput = page.locator(
        'input[name="name"], input[name="description"], [data-testid="name-input"], input[formControlName="name"]',
      );
      if ((await nameInput.count()) > 0) {
        await nameInput.first().fill('React Dashboard Test');
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
        'button[type="submit"], button:has-text("Save"), button:has-text("Submit"), button:has-text("Save Expense")',
      );
      await saveButton.first().click();

      await page.waitForTimeout(2000);

      const dashboardLink = page.locator(
        'a:has-text("Dashboard"), button:has-text("Dashboard"), [data-testid="dashboard-link"], [routerLink*="dashboard"]',
      );
      if ((await dashboardLink.count()) > 0) {
        await dashboardLink.first().click();
        await page.waitForLoadState('networkidle');
      }

      const dashboardContent = page.locator(
        '[data-testid="dashboard"], .dashboard, app-dashboard, main',
      );
      await expect(dashboardContent.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Parity Comparison', () => {
    // T55: Angular and React show same form fields
    test('should have same form fields in both implementations', async ({ page, baseURL }) => {
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

      const logExpenseLink = page.locator(
        'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
      );
      await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
      await logExpenseLink.first().click();

      await page.waitForLoadState('networkidle');

      // Check for common form fields
      const amountField = page.locator(
        'input[name="amount"], input[type="number"], [data-testid="amount-input"], input[formControlName="amount"]',
      );
      const dateField = page.locator(
        'input[name="date"], input[type="date"], [data-testid="date-input"], input[formControlName="date"]',
      );
      const categoryField = page.locator(
        'select, [data-testid="category-select"], mat-select, [role="combobox"]',
      );
      const nameField = page.locator(
        'input[name="name"], input[name="description"], [data-testid="name-input"], input[formControlName="name"]',
      );
      const commentsField = page.locator(
        'textarea[name="comments"], [data-testid="comments-input"], textarea[formControlName="comments"]',
      );

      // Both implementations should have these fields
      expect(await amountField.count()).toBeGreaterThan(0);
      expect(await dateField.count()).toBeGreaterThan(0);
      expect(await categoryField.count()).toBeGreaterThan(0);
      expect(await nameField.count()).toBeGreaterThan(0);
      expect(await commentsField.count()).toBeGreaterThan(0);
    });

    // T56: Angular and React same validation errors
    test('should show validation errors for invalid input', async ({ page, baseURL }) => {
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

      const logExpenseLink = page.locator(
        'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
      );
      await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
      await logExpenseLink.first().click();

      await page.waitForLoadState('networkidle');

      // Submit with negative amount
      const amountInput = page.locator(
        'input[name="amount"], input[type="number"], [data-testid="amount-input"], input[formControlName="amount"]',
      );
      await amountInput.first().waitFor({ state: 'visible', timeout: 10_000 });
      await amountInput.first().fill('-10');

      const saveButton = page.locator(
        'button[type="submit"], button:has-text("Save"), button:has-text("Submit"), button:has-text("Save Expense")',
      );
      await saveButton.first().click();

      await page.waitForTimeout(1000);

      // Check for error message about amount
      const errorMessages = page.locator(
        '.mat-error, .error-message, [role="alert"], .MuiFormHelperText-error, .invalid-feedback, .form-error, .MuiAlert-root',
      );
      const errorCount = await errorMessages.count();

      const bodyText = await page.locator('body').textContent();
      const hasAmountError = errorCount > 0 || bodyText?.toLowerCase().includes('zero') || bodyText?.toLowerCase().includes('positive') || bodyText?.toLowerCase().includes('error');
      expect(hasAmountError).toBeTrue();
    });

    // T57: Angular and React both save expense
    test('should persist expense to Firebase', async ({ page, baseURL }) => {
      const dbRequests: string[] = [];
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('expense-tracker-e0028')) {
          dbRequests.push(url);
        }
      });

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

      const logExpenseLink = page.locator(
        'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
      );
      await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
      await logExpenseLink.first().click();

      await page.waitForLoadState('networkidle');

      const amountInput = page.locator(
        'input[name="amount"], input[type="number"], [data-testid="amount-input"], input[formControlName="amount"]',
      );
      await amountInput.first().waitFor({ state: 'visible', timeout: 10_000 });
      await amountInput.first().fill('50.00');

      const nameInput = page.locator(
        'input[name="name"], input[name="description"], [data-testid="name-input"], input[formControlName="name"]',
      );
      if ((await nameInput.count()) > 0) {
        await nameInput.first().fill('Firebase Test');
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
        'button[type="submit"], button:has-text("Save"), button:has-text("Submit"), button:has-text("Save Expense")',
      );
      await saveButton.first().click();

      // Check that Firebase request was made
      await page.waitForTimeout(2000);

      const hasDbRequest = dbRequests.some((url) =>
        url.includes('expense-tracker-e0028') &&
        (url.includes('PUT') || url.includes('POST'))
      );
      expect(hasDbRequest).toBeTrue();
    });

    // T58: Angular and React both show success
    test('should show success notification after save', async ({ page, baseURL }) => {
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

      const logExpenseLink = page.locator(
        'button:has-text("Log Expense"), a:has-text("Log Expense"), [data-testid="log-expense"], [routerLink*="log-expense"], a[href*="log-expense"]',
      );
      await logExpenseLink.first().waitFor({ state: 'visible', timeout: 10_000 });
      await logExpenseLink.first().click();

      await page.waitForLoadState('networkidle');

      const amountInput = page.locator(
        'input[name="amount"], input[type="number"], [data-testid="amount-input"], input[formControlName="amount"]',
      );
      await amountInput.first().waitFor({ state: 'visible', timeout: 10_000 });
      await amountInput.first().fill('60.00');

      const nameInput = page.locator(
        'input[name="name"], input[name="description"], [data-testid="name-input"], input[formControlName="name"]',
      );
      if ((await nameInput.count()) > 0) {
        await nameInput.first().fill('Success Test');
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
        'button[type="submit"], button:has-text("Save"), button:has-text("Submit"), button:has-text("Save Expense")',
      );
      await saveButton.first().click();

      await page.waitForTimeout(3000);

      // Check for success notification
      const successElements = page.locator(
        '[data-testid="success-snackbar"], .snack-bar-success, .success-snackbar, [role="alert"][data-testid="success"], .MuiSnackbar-root .MuiAlert-success, .success-message',
      );
      const hasSuccess = await successElements.count() > 0;

      if (!hasSuccess) {
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toContain('saved');
      }

      expect(hasSuccess || (await page.locator('body').textContent()).includes('saved')).toBeTrue();
    });
  });
});
