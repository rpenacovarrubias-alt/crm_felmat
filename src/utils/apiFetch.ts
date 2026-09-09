const TOKEN_KEY = 'felmat_auth_token';

let inMemoryToken: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (inMemoryToken) headers.set('Authorization', `Bearer ${inMemoryToken}`);
  return fetch(input, { ...init, headers });
}
