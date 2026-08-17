import { test, expect, Page } from '@playwright/test';
import mockData from './utils/mock-data.json';

const ANGULAR_URL = process.env.ANGULAR_URL ?? 'http://localhost:4200';
const REACT_URL = process.env.REACT_URL ?? 'http://localhost:5173';

const TEST_USER = {
  email: process.env.PARITY_TEST_EMAIL ?? mockData.user.email,
  password: process.env.PARITY_TEST_PASSWORD ?? 'ParityTest2024!',
};

interface DOMTreeMetrics {
  maxDepth: number;
  totalNodes: number;
  ids: string[];
  classes: string[];
  ariaAttributes: Record<string, string[]>;
  landmarks: string[];
  headingHierarchy: string[];
}

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

async function extractDOMMetrics(page: Page): Promise<DOMTreeMetrics> {
  return page.evaluate(() => {
    function getMaxDepth(element: Element, currentDepth: number): number {
      if (!element.children || element.children.length === 0) return currentDepth;
      let max = currentDepth;
      for (const child of Array.from(element.children)) {
        const childDepth = getMaxDepth(child, currentDepth + 1);
        if (childDepth > max) max = childDepth;
      }
      return max;
    }

    function countNodes(element: Element): number {
      let count = 1;
      for (const child of Array.from(element.children)) {
        count += countNodes(child);
      }
      return count;
    }

    const body = document.body;
    const allElements = body.querySelectorAll('*');

    const ids: string[] = [];
    const classSet = new Set<string>();
    const ariaAttributes: Record<string, string[]> = {};
    const landmarks: string[] = [];
    const headingHierarchy: string[] = [];

    const landmarkRoles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'search', 'form', 'region'];

    allElements.forEach((el) => {
      if (el.id) ids.push(el.id);

      el.classList.forEach((cls) => classSet.add(cls));

      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('aria-')) {
          if (!ariaAttributes[attr.name]) ariaAttributes[attr.name] = [];
          ariaAttributes[attr.name].push(attr.value);
        }
      }

      const role = el.getAttribute('role');
      if (role && landmarkRoles.includes(role)) {
        landmarks.push(role);
      }

      const tagName = el.tagName.toLowerCase();
      if (tagName === 'nav') landmarks.push('navigation');
      if (tagName === 'main') landmarks.push('main');
      if (tagName === 'header') landmarks.push('banner');
      if (tagName === 'footer') landmarks.push('contentinfo');
      if (tagName === 'aside') landmarks.push('complementary');

      if (/^h[1-6]$/.test(tagName)) {
        headingHierarchy.push(`${tagName}:${el.textContent?.trim().substring(0, 50) ?? ''}`);
      }
    });

    return {
      maxDepth: getMaxDepth(body, 0),
      totalNodes: countNodes(body),
      ids: ids.sort(),
      classes: Array.from(classSet).sort(),
      ariaAttributes,
      landmarks: landmarks.sort(),
      headingHierarchy,
    };
  });
}

const MAX_DEPTH_VARIANCE = 5;
const MAX_NODE_COUNT_RATIO = 0.3; // 30% tolerance for total node count difference

test.describe('Structural DOM Parity', () => {
  const testRoutes = mockData.routes.filter((r) => r.path !== '/login');

  for (const route of testRoutes) {
    test(`${route.name} (${route.path}) DOM structure parity`, async ({
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

        await angularPage.goto(`${ANGULAR_URL}${route.path}`);
        await angularPage.waitForLoadState('networkidle');
        await angularPage.waitForTimeout(1_500);

        await reactPage.goto(`${REACT_URL}${route.path}`);
        await reactPage.waitForLoadState('networkidle');
        await reactPage.waitForTimeout(1_500);

        const angularMetrics = await extractDOMMetrics(angularPage);
        const reactMetrics = await extractDOMMetrics(reactPage);

        await testInfo.attach(`${route.name}-angular-dom`, {
          body: JSON.stringify(angularMetrics, null, 2),
          contentType: 'application/json',
        });

        await testInfo.attach(`${route.name}-react-dom`, {
          body: JSON.stringify(reactMetrics, null, 2),
          contentType: 'application/json',
        });

        const depthDiff = Math.abs(angularMetrics.maxDepth - reactMetrics.maxDepth);
        expect(
          depthDiff,
          `DOM depth variance: Angular=${angularMetrics.maxDepth}, React=${reactMetrics.maxDepth}`,
        ).toBeLessThanOrEqual(MAX_DEPTH_VARIANCE);

        const nodeRatio =
          Math.abs(angularMetrics.totalNodes - reactMetrics.totalNodes) /
          Math.max(angularMetrics.totalNodes, reactMetrics.totalNodes);
        expect(
          nodeRatio,
          `Node count variance: Angular=${angularMetrics.totalNodes}, React=${reactMetrics.totalNodes} (${(nodeRatio * 100).toFixed(1)}%)`,
        ).toBeLessThanOrEqual(MAX_NODE_COUNT_RATIO);

        const angularLandmarks = angularMetrics.landmarks;
        const reactLandmarks = reactMetrics.landmarks;
        expect(
          reactLandmarks.length,
          `Landmark count: Angular=${angularLandmarks.length}, React=${reactLandmarks.length}`,
        ).toBeGreaterThanOrEqual(Math.max(1, angularLandmarks.length - 1));

        const angularHeadingLevels = angularMetrics.headingHierarchy.map((h) => h.split(':')[0]);
        const reactHeadingLevels = reactMetrics.headingHierarchy.map((h) => h.split(':')[0]);
        expect(
          reactHeadingLevels.length,
          `Heading count: Angular=${angularHeadingLevels.length}, React=${reactHeadingLevels.length}`,
        ).toBeGreaterThanOrEqual(Math.max(0, angularHeadingLevels.length - 1));
      } finally {
        await angularContext.close();
        await reactContext.close();
      }
    });
  }

  test('Login page DOM structure parity', async ({ browser }, testInfo) => {
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

      const angularMetrics = await extractDOMMetrics(angularPage);
      const reactMetrics = await extractDOMMetrics(reactPage);

      await testInfo.attach('login-angular-dom', {
        body: JSON.stringify(angularMetrics, null, 2),
        contentType: 'application/json',
      });

      await testInfo.attach('login-react-dom', {
        body: JSON.stringify(reactMetrics, null, 2),
        contentType: 'application/json',
      });

      const depthDiff = Math.abs(angularMetrics.maxDepth - reactMetrics.maxDepth);
      expect(
        depthDiff,
        `Login DOM depth variance: Angular=${angularMetrics.maxDepth}, React=${reactMetrics.maxDepth}`,
      ).toBeLessThanOrEqual(MAX_DEPTH_VARIANCE);

      const angularHasEmailField = angularMetrics.ids.some(
        (id) => id.includes('email') || id.includes('username'),
      ) || angularMetrics.ariaAttributes['aria-label']?.some((l) => l.toLowerCase().includes('email'));
      const reactHasEmailField = reactMetrics.ids.some(
        (id) => id.includes('email') || id.includes('username'),
      ) || reactMetrics.ariaAttributes['aria-label']?.some((l) => l.toLowerCase().includes('email'));

      expect(angularHasEmailField || reactHasEmailField).toBe(true);
    } finally {
      await angularContext.close();
      await reactContext.close();
    }
  });

  test('Aria attributes parity across all routes', async ({ browser }, testInfo) => {
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

      const results: Array<{
        route: string;
        angularAriaCount: number;
        reactAriaCount: number;
        parity: boolean;
      }> = [];

      for (const route of testRoutes) {
        await angularPage.goto(`${ANGULAR_URL}${route.path}`);
        await angularPage.waitForLoadState('networkidle');
        await angularPage.waitForTimeout(1_000);

        await reactPage.goto(`${REACT_URL}${route.path}`);
        await reactPage.waitForLoadState('networkidle');
        await reactPage.waitForTimeout(1_000);

        const angularMetrics = await extractDOMMetrics(angularPage);
        const reactMetrics = await extractDOMMetrics(reactPage);

        const angularAriaCount = Object.values(angularMetrics.ariaAttributes).flat().length;
        const reactAriaCount = Object.values(reactMetrics.ariaAttributes).flat().length;

        const minExpected = Math.max(1, Math.floor(angularAriaCount * 0.5));
        results.push({
          route: route.path,
          angularAriaCount,
          reactAriaCount,
          parity: reactAriaCount >= minExpected,
        });
      }

      await testInfo.attach('aria-parity-report', {
        body: JSON.stringify(results, null, 2),
        contentType: 'application/json',
      });

      for (const result of results) {
        expect(
          result.parity,
          `${result.route}: Angular has ${result.angularAriaCount} aria attrs, React has ${result.reactAriaCount}`,
        ).toBe(true);
      }
    } finally {
      await angularContext.close();
      await reactContext.close();
    }
  });
});
