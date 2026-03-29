function getApiBaseUrl() {
  // If running locally → use localhost backend
  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }

  // If deployed → use same origin (Render)
  return "";
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  const url = `${getApiBaseUrl()}/api${path}`;

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