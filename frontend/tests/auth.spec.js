import { test, expect } from './helpers/fixtures.js';

test('protected direct links return to the entry after login and support refresh/logout', async ({
  page,
  api,
}) => {
  api.signedIn = false;
  await page.goto('/entries/entry-1');
  await expect(page).toHaveURL('/login');
  await page.getByLabel('Username').fill('  journaler  ');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL('/entries/entry-1');
  await expect(page.getByRole('heading', { name: 'A quiet morning' })).toBeVisible();
  expect(api.calls('POST', '/api/auth/login')[0].body).toEqual({
    username: 'journaler',
    password: 'test-password',
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A quiet morning' })).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/login');
  expect(api.calls('POST', '/api/auth/logout')).toHaveLength(1);
});

test('failed login preserves inputs, shows errors, and allows retry', async ({ page, api }) => {
  api.signedIn = false;
  await page.goto('/login');
  await page.getByLabel('Username').fill('journaler');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid username or password.');
  await expect(page.getByLabel('Username')).toHaveValue('journaler');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Journal entries', exact: true })).toBeVisible();
});

test('registration checks confirmation, displays server field errors, and creates an account', async ({
  page,
  api,
}) => {
  api.signedIn = false;
  await page.goto('/register');
  await page.getByLabel('Username').fill('  new_user  ');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByLabel('Confirm password').fill('different-password');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByLabel('Confirm password')).toHaveAccessibleDescription(
    'Passwords do not match.',
  );
  expect(api.calls('POST', '/api/auth/register')).toHaveLength(0);
  api.respondNext('POST', '/api/auth/register', {
    status: 409,
    body: { errors: { username: 'Username already taken.' } },
  });
  await page.getByLabel('Confirm password').fill('test-password');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByLabel('Username')).toHaveAccessibleDescription('Username already taken.');
  await expect(page.getByLabel('Username')).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByText('Signed in as new_user.')).toBeVisible();
  expect(api.calls('POST', '/api/auth/register').at(-1).body).toEqual({
    username: 'new_user',
    password: 'test-password',
  });
});

for (const path of ['/login', '/register']) {
  test(`signed-in users visiting ${path} return to their journals`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Journal entries', exact: true })).toBeVisible();
  });
}
