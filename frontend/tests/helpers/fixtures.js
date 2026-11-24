import { test as base, expect } from '@playwright/test';

export const savedEntry = {
  id: 'entry-1',
  title: 'A quiet morning',
  date: '2026-10-14',
  content: 'First line.\n\nA second line, with a memory worth keeping.',
  createdAt: '2026-10-13T12:00:00Z',
  updatedAt: '2026-10-14T01:30:00Z',
};

export const test = base.extend({
  api: [
    async ({ context, baseURL }, use) => {
      const queued = new Map();
      const requests = [];
      const unexpected = [];
      const state = {
        signedIn: true,
        user: { id: 'test-user', username: 'journaler' },
        entries: [structuredClone(savedEntry)],
        calls: (method, path) =>
          requests.filter((request) => request.method === method && request.path === path),
        respondNext(method, path, response) {
          const key = `${method} ${path}`;
          queued.set(key, [...(queued.get(key) || []), response]);
        },
        pauseNext(method, path) {
          let release;
          const wait = new Promise((resolve) => {
            release = resolve;
          });
          this.respondNext(method, path, { wait });
          return release;
        },
      };

      // Block every external request, so a bad URL cannot reach production services.
      await context.route('**/*', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.origin !== new URL(baseURL).origin) {
          unexpected.push(request.url());
          return route.abort();
        }
        if (!url.pathname.startsWith('/api/')) return route.continue();

        const method = request.method();
        const path = url.pathname;
        const body = request.postDataJSON();
        requests.push({ method, path, body });
        const reply = (status, data) =>
          route.fulfill({
            status,
            ...(status === 204
              ? {}
              : { contentType: 'application/json', body: JSON.stringify(data) }),
          });
        const response = queued.get(`${method} ${path}`)?.shift();
        if (response?.wait) await response.wait;
        if (response?.status) return reply(response.status, response.body);

        if (method === 'GET' && path === '/api/auth/me') {
          return reply(
            state.signedIn ? 200 : 401,
            state.signedIn ? { user: state.user } : { message: 'You need to log in.' },
          );
        }
        if (method === 'POST' && path === '/api/auth/login') {
          if (body.username !== 'journaler' || body.password !== 'test-password') {
            return reply(401, { message: 'Invalid username or password.' });
          }
          state.signedIn = true;
          return reply(200, { user: state.user });
        }
        if (method === 'POST' && path === '/api/auth/register') {
          state.signedIn = true;
          state.user.username = body.username;
          return reply(201, { user: state.user });
        }
        if (method === 'POST' && path === '/api/auth/logout') {
          state.signedIn = false;
          return reply(200, {});
        }
        if (!state.signedIn) return reply(401, { message: 'You need to log in.' });
        if (method === 'GET' && path === '/api/entries') {
          return reply(200, { entries: state.entries });
        }
        if (method === 'POST' && path === '/api/entries') {
          const entry = {
            ...body,
            id: 'created-entry',
            createdAt: '2026-10-14T12:00:00Z',
            updatedAt: '2026-10-14T12:00:00Z',
          };
          state.entries.unshift(entry);
          return reply(201, { entry });
        }
        const match = path.match(/^\/api\/entries\/([^/]+)$/);
        if (match && ['GET', 'PUT', 'DELETE'].includes(method)) {
          const entry = state.entries.find((item) => item.id === decodeURIComponent(match[1]));
          if (!entry) return reply(404, { message: 'Journal entry not found.' });
          if (method === 'PUT') Object.assign(entry, body, { updatedAt: '2026-10-14T18:45:00Z' });
          if (method === 'DELETE') {
            state.entries = state.entries.filter((item) => item.id !== entry.id);
            return reply(204);
          }
          return reply(200, { entry });
        }
        unexpected.push(`${method} ${path}`);
        return reply(500, { message: 'Unexpected test request.' });
      });

      await use(state);
      expect(
        unexpected,
        'All API requests must be mocked; external requests are forbidden',
      ).toEqual([]);
    },
    { auto: true },
  ],
  browserErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use();
      expect(errors, 'The UI should not throw browser errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function fillEntryForm(
  page,
  {
    title = 'A new memory',
    date = '2026-10-15',
    content = 'The first paragraph.\n\nThe second paragraph.',
  } = {},
) {
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Date', { exact: true }).fill(date);
  await page.getByLabel('Written content').fill(content);
  return { title, date, content };
}

export function unsavedDialog(page) {
  return page.getByRole('dialog', { name: 'Leave without saving?' });
}
