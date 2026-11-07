const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const CREATOR_EMAIL = (process.env.REACT_APP_CREATOR_EMAIL || 'ariesavy9@gmail.com').trim().toLowerCase();

export function isCreatorUser(user) {
  return String(user?.email || '').trim().toLowerCase() === CREATOR_EMAIL;
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('ethera-token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const method = (options.method || 'GET').toUpperCase();
  const maxAttempts = ['GET', 'HEAD'].includes(method) ? 3 : 1;
  let response;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      response = await fetch(`${API_URL}/api${path}`, {
        ...options,
        headers,
      });
      break;
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      if (attempt === maxAttempts - 1) {
        const apiAddress = `${API_URL || window.location.origin}/api${path}`;
        throw new Error(`Cannot reach the Ethera API at ${apiAddress}. Run "npm run start:backend" from the project root and check that port 5000 is available.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Something went wrong. Please try again.');
  }
  return payload;
}

export function getViewerId() {
  let id = localStorage.getItem('ethera-viewer-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('ethera-viewer-id', id);
  }
  return id;
}

export function mediaImage(url, fallback = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=85') {
  return url || fallback;
}
