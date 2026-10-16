import { test, expect, savedEntry, fillEntryForm } from './helpers/fixtures.js';

test('previews show a short excerpt and open full plain-text entries with local modification time', async ({
  page,
  api,
}) => {
  api.entries[0].content = `  A memory\n\n${'🌻'.repeat(170)} <b>plain text</b>`;
  await page.goto('/');
  const preview = page.getByRole('link', { name: /A quiet morning/ });
  await expect(preview.locator('time')).toHaveText('October 14, 2026');
  // Nine characters of "A memory " plus 151 complete emoji, then an ellipsis.
  await expect(preview.locator('.entry-excerpt')).toHaveText(`A memory ${'🌻'.repeat(151)}…`);
  await preview.click();
  await expect(page).toHaveURL('/entries/entry-1');
  expect(await page.locator('.entry-content').textContent()).toBe(api.entries[0].content);
  await expect(page.locator('.entry-content b')).toHaveCount(0);
  await expect(page.locator('.entry-modified')).toHaveText('Last modified: Oct 13, 2026, 9:30 PM');
});

test('an empty journal list offers the creation page', async ({ page, api }) => {
  api.entries = [];
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'No journal entries yet' })).toBeVisible();
  await page.getByRole('link', { name: 'New entry' }).click();
  await expect(page).toHaveURL('/entries/new');
  await expect(page.getByRole('heading', { name: 'New journal entry' })).toBeVisible();
});

test('journal loading and server errors offer a working retry', async ({ page, api }) => {
  const release = api.pauseNext('GET', '/api/entries');
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Loading journal entries…');
  release();
  await expect(page.getByRole('heading', { name: savedEntry.title })).toBeVisible();
  api.respondNext('GET', '/api/entries', {
    status: 500,
    body: { message: 'Unable to load entries.' },
  });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Unable to load entries.');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: savedEntry.title })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('creation validates required inputs and saves title, date, and multiline content', async ({
  page,
  api,
}) => {
  await page.goto('/entries/new');
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect(page.getByLabel('Title', { exact: true })).toBeFocused();
  expect(api.calls('POST', '/api/entries')).toHaveLength(0);
  const form = await fillEntryForm(page);
  await expect(page.getByLabel('Title', { exact: true })).toHaveAttribute('maxlength', '200');
  await expect(page.getByLabel('Written content')).toHaveAttribute('maxlength', '100000');
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect(page).toHaveURL('/entries/created-entry');
  await expect(page.getByRole('heading', { name: form.title })).toBeVisible();
  expect(await page.locator('.entry-content').textContent()).toBe(form.content);
  expect(api.calls('POST', '/api/entries')).toHaveLength(1);
  expect(api.calls('POST', '/api/entries')[0].body).toEqual(form);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a failed creation links field errors to inputs and preserves the draft for retry', async ({
  page,
  api,
}) => {
  api.respondNext('POST', '/api/entries', {
    status: 400,
    body: { errors: { title: 'Choose a different title.' } },
  });
  await page.goto('/entries/new');
  const form = await fillEntryForm(page);
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveAccessibleDescription(
    'Choose a different title.',
  );
  await expect(page.getByLabel('Title', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Written content')).toHaveValue(form.content);
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect(page).toHaveURL('/entries/created-entry');
});

for (const source of ['menu', 'entry page']) {
  test(`editing from the ${source} prefills fields and saves the updated entry`, async ({
    page,
    api,
  }) => {
    if (source === 'menu') {
      await page.goto('/');
      await page.getByRole('button', { name: `Actions for ${savedEntry.title}` }).click();
      await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    } else {
      await page.goto('/entries/entry-1');
      await page.getByRole('link', { name: 'Edit', exact: true }).click();
    }
    await expect(page).toHaveURL('/entries/entry-1/edit');
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue(savedEntry.title);
    await expect(page.getByLabel('Date', { exact: true })).toHaveValue(savedEntry.date);
    await expect(page.getByLabel('Written content')).toHaveValue(savedEntry.content);
    const form = await fillEntryForm(page, { title: 'Updated memory' });
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page).toHaveURL('/entries/entry-1');
    await expect(page.getByRole('heading', { name: form.title })).toBeVisible();
    await expect(page.locator('.entry-modified')).toHaveText(
      'Last modified: Oct 14, 2026, 2:45 PM',
    );
    expect(api.calls('PUT', '/api/entries/entry-1')).toHaveLength(1);
    expect(api.calls('PUT', '/api/entries/entry-1')[0].body).toEqual(form);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
}

test('editing failures preserve the draft and can be retried', async ({ page, api }) => {
  api.respondNext('PUT', '/api/entries/entry-1', {
    status: 500,
    body: { message: 'Could not save changes.' },
  });
  await page.goto('/entries/entry-1/edit');
  const form = await fillEntryForm(page);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Could not save changes.');
  await expect(page.getByLabel('Written content')).toHaveValue(form.content);
  expect(api.entries[0].content).toBe(savedEntry.content);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page).toHaveURL('/entries/entry-1');
});

test('missing entries show a useful error without editing or deletion controls', async ({
  page,
}) => {
  await page.goto('/entries/missing');
  await expect(page.getByRole('alert')).toHaveText('Journal entry not found.');
  await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: '← Back to entries' }).click();
  await expect(page).toHaveURL('/');
});

test('entry load failures can be retried', async ({ page, api }) => {
  api.respondNext('GET', '/api/entries/entry-1', {
    status: 500,
    body: { message: 'Could not load this entry.' },
  });
  await page.goto('/entries/entry-1');
  await expect(page.getByRole('alert')).toContainText('Could not load this entry.');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: savedEntry.title })).toBeVisible();
});

test('entry menus support keyboard navigation, Escape, and outside clicks', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: `Actions for ${savedEntry.title}` });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Delete', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('menuitem', { name: 'Delete', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await page.getByRole('heading', { name: 'Journal entries', exact: true }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
});

test('home deletion requires confirmation and acknowledges success before updating the list', async ({
  page,
  api,
}) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: `Actions for ${savedEntry.title}` });
  async function openDelete() {
    await trigger.click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  }
  const confirmation = page.getByRole('dialog', { name: 'Delete journal entry?' });
  await openDelete();
  await expect(confirmation).toContainText(savedEntry.title);
  await expect(confirmation.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(confirmation).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(api.calls('DELETE', '/api/entries/entry-1')).toHaveLength(0);
  await openDelete();
  await confirmation.getByRole('button', { name: 'Cancel' }).click();
  await expect(confirmation).toHaveCount(0);
  expect(api.calls('DELETE', '/api/entries/entry-1')).toHaveLength(0);
  await openDelete();
  await confirmation.getByRole('button', { name: 'Delete entry', exact: true }).click();
  const success = page.getByRole('dialog', { name: 'Entry deleted' });
  await expect(success).toContainText(`${savedEntry.title} has been permanently deleted.`);
  await expect(success.getByRole('button', { name: 'OK' })).toBeFocused();
  expect(api.calls('DELETE', '/api/entries/entry-1')).toHaveLength(1);
  // The list changes when the user acknowledges the success popup.
  await expect(page.getByRole('heading', { name: savedEntry.title })).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(success).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No journal entries yet' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'New entry' })).toBeFocused();
});

test('deletion errors stay in the dialog and busy requests cannot be repeated', async ({
  page,
  api,
}) => {
  api.respondNext('DELETE', '/api/entries/entry-1', {
    status: 500,
    body: { message: 'Could not delete entry.' },
  });
  await page.goto('/entries/entry-1');
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Delete journal entry?' });
  await confirmation.getByRole('button', { name: 'Delete entry', exact: true }).click();
  await expect(confirmation.getByRole('alert')).toHaveText('Could not delete entry.');
  expect(api.entries).toHaveLength(1);
  const release = api.pauseNext('DELETE', '/api/entries/entry-1');
  await confirmation.getByRole('button', { name: 'Delete entry', exact: true }).click();
  await expect(confirmation.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
  await expect(confirmation.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(confirmation).toBeVisible();
  release();
  const success = page.getByRole('dialog', { name: 'Entry deleted' });
  await expect(success).toBeVisible();
  await expect(page).toHaveURL('/entries/entry-1');
  expect(api.calls('DELETE', '/api/entries/entry-1')).toHaveLength(2);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'No journal entries yet' })).toBeVisible();
});
