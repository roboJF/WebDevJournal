import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, afterEach, beforeEach, mock, test } from 'node:test';
import { Entry } from '../src/models/Entry.js';
import { User } from '../src/models/User.js';

// Exercise the HTTP routes without connecting to or changing a real database.
Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/muse_test',
  JWT_SECRET: 'test-only-secret-for-journal-entry-route-checks',
  CLIENT_ORIGIN: 'http://localhost:5173',
  COOKIE_NAME: 'muse_test_token',
  TRUST_PROXY: '0',
  BCRYPT_ROUNDS: '4',
});

const { default: app } = await import('../src/app.js');
const { signToken } = await import('../src/utils/token.js');
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}/api/entries`;
const owner = '111111111111111111111111';
const otherUser = '222222222222222222222222';
const validEntry = {
  title: 'A good day',
  date: '2026-10-13',
  content: 'Some thoughts.\nAnother line.',
};
let stored;

beforeEach(() => {
  stored = [];
  mock.method(User, 'findById', async (id) => ({ id }));
  mock.method(Entry, 'create', async (data) => {
    const entry = new Entry({ ...data, createdAt: new Date() });
    await entry.validate();
    stored.push(entry);
    return entry;
  });
  mock.method(Entry, 'find', (query) => ({
    sort: async (order) => {
      assert.deepEqual(order, { date: -1, createdAt: -1 });
      return stored
        .filter((entry) => entry.user.toString() === query.user)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    },
  }));
  mock.method(
    Entry,
    'findOne',
    async (query) =>
      stored.find((entry) => entry.id === query._id && entry.user.toString() === query.user) ||
      null,
  );
  mock.method(Entry, 'findOneAndUpdate', async (query, update, options) => {
    assert.deepEqual(options, { new: true, runValidators: true });
    const index = stored.findIndex(
      (entry) => entry.id === query._id && entry.user.toString() === query.user,
    );
    if (index === -1) return null;
    const updated = new Entry({ ...stored[index].toObject(), ...update.$set });
    await updated.validate();
    updated.updatedAt = new Date();
    stored[index] = updated;
    return updated;
  });
});

afterEach(() => mock.restoreAll());
after(() => new Promise((resolve) => server.close(resolve)));

function request({ method = 'GET', body, user = owner, path = '' } = {}) {
  return fetch(`${base}${path}`, {
    method,
    headers: {
      ...(user ? { Cookie: `muse_test_token=${signToken(user)}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test('listing, reading, creating, and updating entries require login', async () => {
  assert.equal((await request({ user: null })).status, 401);
  assert.equal((await request({ user: null, path: `/${owner}` })).status, 401);
  assert.equal((await request({ method: 'POST', user: null, body: validEntry })).status, 401);
  assert.equal(
    (await request({ method: 'PUT', user: null, path: `/${owner}`, body: validEntry })).status,
    401,
  );
  assert.equal(stored.length, 0);
});

test('reads a saved entry by ID with its complete content', async () => {
  const content = '  A long journal entry.\n\n'.repeat(30);
  const created = await request({ method: 'POST', body: { ...validEntry, content } });
  const saved = (await created.json()).entry;
  const response = await request({ path: `/${saved.id}` });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).entry, saved);
});

test('another user’s entry and a missing entry return the same 404 response', async () => {
  const created = await request({ method: 'POST', body: validEntry });
  const saved = (await created.json()).entry;
  const otherResponse = await request({ user: otherUser, path: `/${saved.id}` });
  const missingResponse = await request({ path: '/333333333333333333333333' });
  assert.equal(otherResponse.status, 404);
  assert.equal(missingResponse.status, 404);
  assert.deepEqual(await otherResponse.json(), await missingResponse.json());
});

test('malformed entry IDs return 404 without querying MongoDB', async () => {
  const response = await request({ path: '/not-an-entry-id' });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).message, 'Journal entry not found.');
  assert.equal(Entry.findOne.mock.callCount(), 0);
});

test('creates an entry for the authenticated user and preserves the date and content', async () => {
  const content = '  First line.\n\nSecond line.  ';
  const response = await request({
    method: 'POST',
    body: { ...validEntry, title: '  A good day  ', content, user: otherUser },
  });
  assert.equal(response.status, 201);
  const { entry } = await response.json();
  assert.equal(entry.title, validEntry.title);
  assert.equal(entry.date, validEntry.date);
  assert.equal(entry.content, content);
  assert.ok(entry.id);
  assert.ok(entry.createdAt);
  assert.equal(stored[0].user.toString(), owner);
  assert.equal(entry.user, undefined);
  assert.equal(entry.__v, undefined);
});

test('listing returns only the current user’s entries, newest journal date first', async () => {
  await request({ method: 'POST', body: { ...validEntry, date: '2026-10-10' } });
  await request({
    method: 'POST',
    user: otherUser,
    body: { ...validEntry, title: 'Private to another user' },
  });
  await request({ method: 'POST', body: validEntry });
  const response = await request();
  assert.equal(response.status, 200);
  const { entries } = await response.json();
  assert.deepEqual(
    entries.map((entry) => entry.date),
    ['2026-10-13', '2026-10-10'],
  );
  const otherResponse = await request({ user: otherUser });
  const otherEntries = (await otherResponse.json()).entries;
  assert.equal(otherEntries.length, 1);
  assert.equal(otherEntries[0].title, 'Private to another user');
});

test('invalid fields produce validation errors without saving anything', async () => {
  for (const [field, value] of [
    ['title', '   '],
    ['title', 'x'.repeat(201)],
    ['title', '🌻'.repeat(101)],
    ['title', {}],
    ['date', '2026-02-30'],
    ['date', '2026-13-01'],
    ['date', '0000-01-01'],
    ['date', '2026-10-13T12:00:00Z'],
    ['date', ''],
    ['content', ' \n '],
    ['content', []],
    ['content', 'x'.repeat(100001)],
    ['content', '🌻'.repeat(50001)],
  ]) {
    const response = await request({ method: 'POST', body: { ...validEntry, [field]: value } });
    assert.equal(response.status, 400, `${field}: ${String(value).slice(0, 30)}`);
    assert.ok((await response.json()).errors[field]);
  }
  const missingFields = await request({ method: 'POST', body: {} });
  assert.equal(missingFields.status, 400);
  assert.deepEqual(Object.keys((await missingFields.json()).errors).sort(), [
    'content',
    'date',
    'title',
  ]);
  assert.equal(stored.length, 0);
});

test('accepts leap days and Unicode content larger than the authentication body limit', async () => {
  const content = '🌻'.repeat(15000);
  const response = await request({
    method: 'POST',
    body: { ...validEntry, date: '2028-02-29', content },
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).entry.content, content);
});

test('oversized requests receive a readable 413 response', async () => {
  const response = await request({
    method: 'POST',
    body: { ...validEntry, content: 'x'.repeat(1100000) },
  });
  assert.equal(response.status, 413);
  assert.match((await response.json()).message, /too large/i);
  assert.equal(stored.length, 0);
});

test('updates the owner’s entry while preserving its ID, owner, and creation date', async () => {
  const created = await request({ method: 'POST', body: validEntry });
  const original = (await created.json()).entry;
  const content = '  Updated thoughts.\n\nAnother paragraph.  ';
  const response = await request({
    method: 'PUT',
    path: `/${original.id}`,
    body: {
      title: '  An updated day  ',
      date: '2026-10-14',
      content,
      user: otherUser,
      _id: otherUser,
      createdAt: '2000-01-01T00:00:00.000Z',
    },
  });
  assert.equal(response.status, 200);
  const { entry } = await response.json();
  assert.equal(entry.id, original.id);
  assert.equal(entry.createdAt, original.createdAt);
  assert.equal(entry.title, 'An updated day');
  assert.equal(entry.date, '2026-10-14');
  assert.equal(entry.content, content);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].user.toString(), owner);
  assert.deepEqual((await (await request({ path: `/${original.id}` })).json()).entry, entry);
});

test('updating another user’s entry or a missing entry returns 404 without changing data', async () => {
  const created = await request({ method: 'POST', body: validEntry });
  const original = (await created.json()).entry;
  const body = { ...validEntry, title: 'Unauthorized change', user: otherUser };
  const otherResponse = await request({
    method: 'PUT',
    user: otherUser,
    path: `/${original.id}`,
    body,
  });
  const missingResponse = await request({ method: 'PUT', path: '/333333333333333333333333', body });
  assert.equal(otherResponse.status, 404);
  assert.equal(missingResponse.status, 404);
  assert.deepEqual(await otherResponse.json(), await missingResponse.json());
  assert.equal(stored[0].title, original.title);
  assert.equal(stored.length, 1);
});

test('invalid edits produce field errors and leave the saved entry untouched', async () => {
  const created = await request({ method: 'POST', body: validEntry });
  const original = (await created.json()).entry;
  for (const [field, value] of [
    ['title', '   '],
    ['title', 'x'.repeat(201)],
    ['title', '🌻'.repeat(101)],
    ['date', '2026-02-30'],
    ['date', '0000-01-01'],
    ['date', '2026-10-13T12:00:00Z'],
    ['content', ' \n '],
    ['content', {}],
    ['content', '🌻'.repeat(50001)],
  ]) {
    const response = await request({
      method: 'PUT',
      path: `/${original.id}`,
      body: { ...validEntry, [field]: value },
    });
    assert.equal(response.status, 400);
    assert.ok((await response.json()).errors[field]);
  }
  const incomplete = await request({
    method: 'PUT',
    path: `/${original.id}`,
    body: { title: 'Missing fields' },
  });
  assert.equal(incomplete.status, 400);
  assert.deepEqual((await (await request({ path: `/${original.id}` })).json()).entry, original);
  assert.equal(Entry.findOneAndUpdate.mock.callCount(), 0);
});

test('malformed IDs cannot update entries', async () => {
  const response = await request({ method: 'PUT', path: '/not-an-entry-id', body: validEntry });
  assert.equal(response.status, 404);
  assert.equal(Entry.findOneAndUpdate.mock.callCount(), 0);
});

test('the entry list reflects an edited title, preview content, and journal date order', async () => {
  const first = await request({ method: 'POST', body: { ...validEntry, date: '2026-10-10' } });
  const original = (await first.json()).entry;
  await request({ method: 'POST', body: validEntry });
  const updated = { title: 'New title', date: '2026-10-15', content: 'New preview content' };
  const response = await request({ method: 'PUT', path: `/${original.id}`, body: updated });
  assert.equal(response.status, 200);
  const { entries } = await (await request()).json();
  assert.equal(entries[0].id, original.id);
  for (const field of ['title', 'date', 'content']) assert.equal(entries[0][field], updated[field]);
});

test('partial updates and deleting endpoints are not available', async () => {
  const created = await request({ method: 'POST', body: validEntry });
  const { entry } = await created.json();
  for (const method of ['PATCH', 'DELETE']) {
    const response = await request({ method, path: `/${entry.id}`, body: { title: 'Changed' } });
    assert.equal(response.status, 404);
  }
  assert.equal(stored.length, 1);
  assert.equal(stored[0].title, validEntry.title);
});
