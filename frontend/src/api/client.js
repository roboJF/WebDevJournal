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

async function multipartRequest(path, { method = 'POST', fields = {}, files = [] }) {
  const formData = new FormData();

  for (const [name, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      if (name === 'images') {
        formData.append(name, JSON.stringify(value));
      }
    } else {
      formData.append(name, value);
    }
  }

  for (const file of files) {
    formData.append('images', file);
  }

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      credentials: 'include',
      body: formData,
    });
  } catch {
    throw new ApiError(
      0,
      'Could not reach the server. Check your connection and try again.',
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.message || 'Something went wrong.',
      data?.errors || {},
    );
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
  createEntry: (entry, files) =>
  multipartRequest('/entries', {
    method: 'POST',
    fields: entry,
    files,
  }),
updateEntry: (id, entry, files) =>
  multipartRequest(`/entries/${encodeURIComponent(id)}`, {
    method: 'PUT',
    fields: entry,
    files,
  }),
  deleteEntry: (id) => request(`/entries/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
