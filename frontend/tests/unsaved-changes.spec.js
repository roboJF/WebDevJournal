import { test, expect, savedEntry, fillEntryForm, unsavedDialog } from './helpers/fixtures.js';

for (const mode of ['new', 'edit']) {
  const path = mode === 'new' ? '/entries/new' : '/entries/entry-1/edit';
  const destination = mode === 'new' ? '/' : '/entries/entry-1';
  const method = mode === 'new' ? 'POST' : 'PUT';
  const endpoint = mode === 'new' ? '/api/entries' : '/api/entries/entry-1';

  test(`${mode}: unchanged forms and restored values leave without warning`, async ({
    page,
    api,
  }) => {
    await page.goto(path);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page).toHaveURL(destination);
    await expect(unsavedDialog(page)).toHaveCount(0);
    await page.goto(path);
    const title = page.getByLabel('Title', { exact: true });
    await expect(title).toHaveValue(mode === 'new' ? '' : savedEntry.title);
    const originalDate = await page.getByLabel('Date', { exact: true }).inputValue();
    await fillEntryForm(page);
    await title.fill(mode === 'new' ? '' : savedEntry.title);
    await page.getByLabel('Date', { exact: true }).fill(originalDate);
    await page.getByLabel('Written content').fill(mode === 'new' ? '' : savedEntry.content);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page).toHaveURL(destination);
    await expect(unsavedDialog(page)).toHaveCount(0);
    expect(api.calls(method, endpoint)).toHaveLength(0);
  });

  test(`${mode}: Cancel and back links offer Stay, Escape, and confirmed discard`, async ({
    page,
    api,
  }) => {
    await page.goto(path);
    const draft = await fillEntryForm(page);
    const dialog = unsavedDialog(page);
    const cancel = page.getByRole('button', { name: 'Cancel', exact: true });
    await cancel.click();
    await expect(dialog).toContainText('Your progress will be lost if you leave.');
    await expect(dialog.getByRole('button', { name: 'Stay', exact: true })).toBeFocused();
    await dialog.getByRole('button', { name: 'Stay', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(cancel).toBeFocused();
    await expect(page.getByLabel('Written content')).toHaveValue(draft.content);
    await page.getByRole('link', { name: /← Back to entr/ }).click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(path);
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue(draft.title);
    await page.getByRole('link', { name: /← Back to entr/ }).click();
    await dialog.getByRole('button', { name: 'Leave without saving', exact: true }).click();
    await expect(page).toHaveURL(destination);
    expect(api.calls(method, endpoint)).toHaveLength(0);
    expect(api.entries[0]).toEqual(savedEntry);
  });

  test(`${mode}: date-only changes are protected`, async ({ page }) => {
    await page.goto(path);
    await page.getByLabel('Date', { exact: true }).fill('2025-01-01');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(unsavedDialog(page)).toBeVisible();
    await unsavedDialog(page).getByRole('button', { name: 'Stay', exact: true }).click();
    await expect(unsavedDialog(page)).toHaveCount(0);
    await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2025-01-01');
  });

  test(`${mode}: failed saves stay protected and successful saves clear the warning`, async ({
    page,
    api,
  }) => {
    api.respondNext(method, endpoint, { status: 500, body: { message: 'Save failed.' } });
    await page.goto(path);
    const draft = await fillEntryForm(page);
    const save = page.getByRole('button', {
      name: mode === 'new' ? 'Save entry' : 'Save changes',
      exact: true,
    });
    await save.click();
    await expect(page.getByRole('alert')).toHaveText('Save failed.');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(unsavedDialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(unsavedDialog(page)).toHaveCount(0);
    await expect(page.getByLabel('Written content')).toHaveValue(draft.content);
    await save.click();
    await expect(page).toHaveURL(mode === 'new' ? '/entries/created-entry' : '/entries/entry-1');
    await expect(page.getByRole('heading', { name: draft.title })).toBeVisible();
    await expect(unsavedDialog(page)).toHaveCount(0);
  });
}

test('browser Back can be cancelled or confirmed without losing the draft prematurely', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'New entry' }).click();
  await page.getByLabel('Title', { exact: true }).fill('Browser Back draft');
  await page.evaluate(() => history.back());
  await expect(unsavedDialog(page)).toBeVisible();
  await unsavedDialog(page).getByRole('button', { name: 'Stay', exact: true }).click();
  await expect(unsavedDialog(page)).toHaveCount(0);
  await expect(page).toHaveURL('/entries/new');
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Browser Back draft');
  await page.evaluate(() => history.back());
  await unsavedDialog(page)
    .getByRole('button', { name: 'Leave without saving', exact: true })
    .click();
  await expect(page).toHaveURL('/');
});

test('refresh warns only while changes are unsaved and cancelling keeps the draft', async ({
  page,
}) => {
  await page.goto('/entries/new');
  await page.getByLabel('Title', { exact: true }).fill('Refresh draft');
  const prompt = page.waitForEvent('dialog');
  // Trigger a refresh without waiting for a load that cancelling will prevent.
  const refresh = page.evaluate(() => location.reload());
  const dialog = await prompt;
  expect(dialog.type()).toBe('beforeunload');
  await dialog.dismiss();
  await refresh;
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Refresh draft');
  await page.getByLabel('Title', { exact: true }).fill('');
  let warned = false;
  page.once('dialog', async (dialog) => {
    warned = true;
    await dialog.dismiss();
  });
  await page.reload();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('');
  expect(warned).toBe(false);
  page.removeAllListeners('dialog');
});

test('logout waits for confirmation and Stay keeps the session and draft', async ({
  page,
  api,
}) => {
  await page.goto('/entries/entry-1/edit');
  await page.getByLabel('Title', { exact: true }).fill('Logout draft');
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(unsavedDialog(page)).toBeVisible();
  expect(api.calls('POST', '/api/auth/logout')).toHaveLength(0);
  await unsavedDialog(page).getByRole('button', { name: 'Stay', exact: true }).click();
  await expect(unsavedDialog(page)).toHaveCount(0);
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Logout draft');
  expect(api.signedIn).toBe(true);
  await page.getByRole('button', { name: 'Log out' }).click();
  await unsavedDialog(page)
    .getByRole('button', { name: 'Leave without saving', exact: true })
    .click();
  await expect(page).toHaveURL('/login');
  expect(api.calls('POST', '/api/auth/logout')).toHaveLength(1);
  expect(api.calls('PUT', '/api/entries/entry-1')).toHaveLength(0);
});

test('save completion clears an open navigation warning', async ({ page, api }) => {
  await page.goto('/entries/entry-1/edit');
  await fillEntryForm(page);
  const release = api.pauseNext('PUT', '/api/entries/entry-1');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await page.getByRole('link', { name: '← Back to entry' }).click();
  await expect(unsavedDialog(page)).toBeVisible();
  release();
  await expect(page).toHaveURL('/entries/entry-1');
  await expect(page.getByRole('heading', { name: 'A new memory' })).toBeVisible();
  await expect(unsavedDialog(page)).toHaveCount(0);
});
