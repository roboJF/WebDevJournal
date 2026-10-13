// In dev we default to the local API. In a production build an empty
// VITE_API_URL means "same origin", for setups with a reverse proxy.
const BASE = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      credentials: 'include', // send/receive the httpOnly auth cookie
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.message || 'Something went wrong.', data?.errors || {});
  }
  return data;
}

export const api = {
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: { username, password } }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  entries: () => request('/entries'),
  entry: (id) => request(`/entries/${encodeURIComponent(id)}`),
  createEntry: (entry) => request('/entries', { method: 'POST', body: entry }),
};
