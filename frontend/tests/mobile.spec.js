import { test, expect, savedEntry, fillEntryForm, unsavedDialog } from './helpers/fixtures.js';

test('mobile creation, unsaved confirmation, and theme control fit the screen', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'New entry' }).click();
  const draft = await fillEntryForm(page);
  await page.getByRole('button', { name: /^Color theme:/ }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(unsavedDialog(page)).toBeVisible();
  const bounds = await unsavedDialog(page).boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  await unsavedDialog(page).getByRole('button', { name: 'Stay', exact: true }).click();
  await expect(unsavedDialog(page)).toHaveCount(0);
  await expect(page.getByLabel('Written content')).toHaveValue(draft.content);
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect(page).toHaveURL('/entries/created-entry');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('mobile entry menus open editing and deletion dialogs with working controls', async ({
  page,
  api,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: `Actions for ${savedEntry.title}` }).click();
  await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
  await expect(page.getByLabel('Written content')).toHaveValue(savedEntry.content);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page).toHaveURL('/entries/entry-1');
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Delete journal entry?' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Delete entry', exact: true }).click();
  const success = page.getByRole('dialog', { name: 'Entry deleted' });
  await expect(success).toBeVisible();
  await success.getByRole('button', { name: 'OK' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'No journal entries yet' })).toBeVisible();
  expect(api.calls('DELETE', '/api/entries/entry-1')).toHaveLength(1);
});
