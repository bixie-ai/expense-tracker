import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
  email: process.env.PARITY_TEST_EMAIL || 'parity-test@expense-tracker.test',
  password: process.env.PARITY_TEST_PASSWORD || 'ParityTest123!',
};

const FIREBASE_DB_URL = 'expense-tracker-e0028.firebaseio.com';

const EXPENSE_DATA = {
  name: `Parity Test ${Date.now()}`,
  amount: '42.50',
  category: 'Food',
  type: 'Credit Card',
  comments: 'Automated parity test expense',
};

interface FlowResult {
  loggedIn: boolean;
  expenseCreated: boolean;
  expenseVisible: boolean;
  expenseUpdated: boolean;
  expenseDeleted: boolean;
  firebaseEndpoints: string[];
}

async function loginAngular(page: Page): Promise<boolean> {
  await page.goto('/login');
  await page.waitForSelector('input[name="email"]', { timeout: 15_000 });
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"], button:has-text("Login")');
  await page.waitForURL('**/dashboard', { timeout: 20_000 });
  return true;
}

async function loginReact(page: Page): Promise<boolean> {
  await page.goto('/login');
  await page.waitForSelector('#email', { timeout: 15_000 });
  await page.fill('#email', TEST_USER.email);
  await page.fill('#password', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 20_000 });
  return true;
}

async function captureFirebaseEndpoints(page: Page): Promise<string[]> {
  const endpoints: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes(FIREBASE_DB_URL)) {
      const path = new URL(url).pathname;
      endpoints.push(path);
    }
  });
  return endpoints;
}

async function runExpenseFlow(
  page: Page,
  projectName: string,
): Promise<FlowResult> {
  const firebaseEndpoints = await captureFirebaseEndpoints(page);

  const isAngular = projectName === 'angular';
  const loggedIn = isAngular
    ? await loginAngular(page)
    : await loginReact(page);

  // Navigate to new expense form
  if (isAngular) {
    await page.goto('/new-expense');
    await page.waitForSelector('input[name="name"]', { timeout: 15_000 });
  } else {
    await page.goto('/log-expense');
    await page.waitForSelector('[name="name"], #name', { timeout: 15_000 });
  }

  // Create expense
  let expenseCreated = false;
  const createResponsePromise = page.waitForResponse(
    (resp) => resp.url().includes(FIREBASE_DB_URL) && resp.status() === 200,
    { timeout: 15_000 },
  );

  if (isAngular) {
    await page.fill('input[name="name"]', EXPENSE_DATA.name);
    await page.fill('input[name="amount"]', EXPENSE_DATA.amount);
    await page.click('mat-select[name="category"]');
    await page.waitForSelector('mat-option');
    await page.click(`mat-option:first-child`);
    await page.click('mat-select[name="payment"]');
    await page.waitForSelector('mat-option');
    await page.click(`mat-option:first-child`);
    await page.fill('textarea[name="comments"]', EXPENSE_DATA.comments);
    await page.click('button[type="submit"]');
  } else {
    await page.fill('[name="name"], #name', EXPENSE_DATA.name);
    await page.fill('[name="amount"], #amount', EXPENSE_DATA.amount);
    const categorySelect = page.locator(
      'select[name="category"], [role="combobox"]:near(:text("Category"))',
    );
    if (await categorySelect.count()) {
      await categorySelect.first().click();
      await page.locator('[role="option"]:first-child').click();
    }
    const typeSelect = page.locator(
      'select[name="type"], [role="combobox"]:near(:text("Payment"))',
    );
    if (await typeSelect.count()) {
      await typeSelect.first().click();
      await page.locator('[role="option"]:first-child').click();
    }
    await page.fill(
      'textarea[name="comments"], #comments',
      EXPENSE_DATA.comments,
    );
    await page.click('button[type="submit"]');
  }

  try {
    await createResponsePromise;
    expenseCreated = true;
  } catch {
    expenseCreated = false;
  }

  // Verify expense visible on dashboard
  let expenseVisible = false;
  if (isAngular) {
    await page.goto('/dashboard');
  } else {
    await page.goto('/');
  }
  await page.waitForTimeout(2000);

  try {
    const expenseLocator = page.locator(`text=${EXPENSE_DATA.name}`);
    await expenseLocator.first().waitFor({ timeout: 10_000 });
    expenseVisible = true;
  } catch {
    expenseVisible = false;
  }

  // Update expense (mark as verified by adding comment)
  let expenseUpdated = false;
  try {
    const expenseRow = page.locator(`text=${EXPENSE_DATA.name}`).first();
    await expenseRow.click();
    await page.waitForTimeout(1000);

    const editButton = page.locator(
      'button:has-text("Edit"), [aria-label="edit"], button:has(mat-icon:text("edit"))',
    );
    if (await editButton.count()) {
      await editButton.first().click();
      await page.waitForTimeout(1000);
    }

    const commentsField = page.locator(
      'textarea[name="comments"], #comments',
    );
    if (await commentsField.count()) {
      await commentsField.first().fill('Updated by parity test');
      const saveBtn = page.locator(
        'button[type="submit"], button:has-text("Save"), button:has-text("Update")',
      );
      await saveBtn.first().click();

      const updateResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes(FIREBASE_DB_URL) && resp.status() === 200,
        { timeout: 10_000 },
      );
      await updateResponse;
      expenseUpdated = true;
    }
  } catch {
    expenseUpdated = false;
  }

  // Delete expense
  let expenseDeleted = false;
  try {
    const deleteButton = page.locator(
      'button:has-text("Delete"), [aria-label="delete"], button:has(mat-icon:text("delete"))',
    );
    if (await deleteButton.count()) {
      await deleteButton.first().click();
      await page.waitForTimeout(500);

      const confirmBtn = page.locator(
        'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")',
      );
      if (await confirmBtn.count()) {
        await confirmBtn.first().click();
      }

      const deleteResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes(FIREBASE_DB_URL) && resp.status() === 200,
        { timeout: 10_000 },
      );
      await deleteResponse;
      expenseDeleted = true;
    }
  } catch {
    expenseDeleted = false;
  }

  return {
    loggedIn,
    expenseCreated,
    expenseVisible,
    expenseUpdated,
    expenseDeleted,
    firebaseEndpoints,
  };
}

test.describe('Expense Flow Parity', () => {
  const results: Record<string, FlowResult> = {};

  test('execute expense CRUD flow', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    const result = await runExpenseFlow(page, projectName);
    results[projectName] = result;

    expect(result.loggedIn).toBe(true);
    expect(result.expenseCreated).toBe(true);
    expect(result.expenseVisible).toBe(true);
  });

  test('verify Firebase endpoint parity', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    const endpoints = await captureFirebaseEndpoints(page);

    if (projectName === 'angular') {
      await loginAngular(page);
    } else {
      await loginReact(page);
    }

    // Navigate to trigger data fetches
    await page.waitForTimeout(3000);

    const userExpensePaths = endpoints.filter(
      (ep) => ep.includes('/users/') && ep.includes('/expenses'),
    );
    expect(userExpensePaths.length).toBeGreaterThan(0);

    // Verify the path pattern matches: /users/{uid}/expenses
    for (const path of userExpensePaths) {
      expect(path).toMatch(/\/users\/[^/]+\/expenses/);
    }
  });
});

test.describe('Firebase Connectivity Validation', () => {
  test('React app uses same database paths as Angular', async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name;
    const capturedPaths: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes(FIREBASE_DB_URL)) {
        const urlObj = new URL(url);
        capturedPaths.push(urlObj.pathname.replace(/\.json$/, ''));
      }
    });

    if (projectName === 'angular') {
      await loginAngular(page);
      await page.goto('/dashboard');
    } else {
      await loginReact(page);
      await page.goto('/');
    }

    await page.waitForTimeout(5000);

    // Both apps must hit the users/{uid}/expenses path
    const expensePaths = capturedPaths.filter((p) =>
      p.match(/\/users\/[^/]+\/expenses/),
    );
    expect(
      expensePaths.length,
      `${projectName} should fetch from Firebase /users/{uid}/expenses`,
    ).toBeGreaterThan(0);

    // Validate expected data structure paths
    const expectedPathPatterns = [
      /\/users\/[^/]+\/expenses/,
      /\/users\/[^/]+/,
    ];

    for (const pattern of expectedPathPatterns) {
      const matches = capturedPaths.filter((p) => pattern.test(p));
      expect(
        matches.length,
        `${projectName} should access path matching ${pattern}`,
      ).toBeGreaterThan(0);
    }
  });
});
