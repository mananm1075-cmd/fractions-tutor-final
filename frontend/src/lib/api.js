const DEFAULT_API_BASE = "http://localhost:5000";

export function getApiBaseUrl() {
  // Vite exposes env vars prefixed with VITE_
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  const url = `${getApiBaseUrl()}${path}`;

  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    const msg = json?.error || json?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return json;
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: "POST", body }),
};

