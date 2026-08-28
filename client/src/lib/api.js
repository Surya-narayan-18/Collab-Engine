const API_BASE = "http://localhost:5000/api";

/**
 * Centralized fetch wrapper for the CollabEngine API.
 * Automatically attaches JWT from localStorage and handles JSON.
 */
export async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || "Request failed");
    err.status = res.status;
    err.details = data.details;
    throw err;
  }

  return data;
}

export function get(path) {
  return api(path);
}

export function post(path, body) {
  return api(path, { method: "POST", body: JSON.stringify(body) });
}

export function del(path) {
  return api(path, { method: "DELETE" });
}
