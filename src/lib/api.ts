const isProd = typeof window !== 'undefined' && window.location.hostname === 'omnisync-pd01.onrender.com';
const API_BASE = (import.meta as any).env.VITE_API_URL || (isProd ? 'https://omnisyncb.onrender.com/api' : '/api');

function getToken(): string | null {
  return localStorage.getItem('omnisync_token');
}

export function setToken(token: string) {
  localStorage.setItem('omnisync_token', token);
}

export function clearToken() {
  localStorage.removeItem('omnisync_token');
}

async function request(method: string, path: string, body?: any) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body: any) => request('POST', path, body),
  put: (path: string, body: any) => request('PUT', path, body),
  delete: (path: string) => request('DELETE', path),
};
