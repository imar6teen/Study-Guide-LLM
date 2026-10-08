export const AUTH_TOKEN_KEY = "study_guide_auth_token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (err) {
    console.error("Could not store auth token", err);
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (err) {
    console.error("Could not remove auth token", err);
  }
}

/**
 * Returns Authorization header if an auth token is stored.
 * This guarantees session persistence even when third-party cookies
 * are blocked across different domains (e.g. Cloud Run frontend and App Engine backend).
 */
export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
