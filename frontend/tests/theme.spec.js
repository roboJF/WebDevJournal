import { test, expect, unsavedDialog } from './helpers/fixtures.js';

const themeButton = (page) => page.getByRole('button', { name: /^Color theme:/ });
const root = (page) => page.locator('html');

test('theme defaults to live system preference and cycles System → Light → Dark → System', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(themeButton(page)).toHaveText('System');
  await expect(root(page)).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(root(page)).toHaveAttribute('data-theme', 'light');
  await themeButton(page).click();
  await expect(themeButton(page)).toHaveText('Light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(root(page)).toHaveAttribute('data-theme', 'light');
  await themeButton(page).click();
  await expect(themeButton(page)).toHaveText('Dark');
  await expect(root(page)).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(root(page)).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(themeButton(page)).toHaveText('Dark');
  await expect(root(page)).toHaveAttribute('data-theme', 'dark');
  await themeButton(page).click();
  await expect(themeButton(page)).toHaveText('System');
  await expect(root(page)).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('muse-theme'))).toBeNull();
});

test('theme changes synchronize across tabs and preserve unsaved journal text', async ({
  page,
  context,
}) => {
  await page.goto('/entries/new');
  await page.getByLabel('Written content').fill('Keep this unsaved draft.');
  const otherTab = await context.newPage();
  await otherTab.goto('/');
  await themeButton(otherTab).click();
  await expect(themeButton(page)).toHaveText('Light');
  await expect(root(page)).toHaveAttribute('data-theme', 'light');
  await expect(page.getByLabel('Written content')).toHaveValue('Keep this unsaved draft.');
  await expect(unsavedDialog(page)).toHaveCount(0);
});

test('blocked storage still allows theme changes and retains the choice across routes', async ({
  page,
  api,
}) => {
  api.signedIn = false;
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage blocked', 'SecurityError');
      },
    });
  });
  await page.goto('/login');
  await expect(themeButton(page)).toHaveText('System');
  await themeButton(page).click();
  await expect(themeButton(page)).toHaveText('Light');
  await page.getByRole('link', { name: 'Create an account' }).click();
  await expect(page).toHaveURL('/register');
  await expect(themeButton(page)).toHaveText('Light');
  await themeButton(page).click();
  await expect(root(page)).toHaveAttribute('data-theme', 'dark');
});
