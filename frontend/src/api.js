const API_ROOT = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unexpected service error" }));
    throw new Error(typeof error.detail === "string" ? error.detail : "Request could not be completed");
  }
  return response.status === 204 ? null : response.json();
}

export const incidentApi = {
  list: () => request("/incidents"),
  stats: () => request("/incidents/stats"),
  create: (incident) => request("/incidents", { method: "POST", body: JSON.stringify(incident) }),
  update: (id, changes) => request(`/incidents/${id}`, { method: "PUT", body: JSON.stringify(changes) }),
  remove: (id) => request(`/incidents/${id}`, { method: "DELETE" }),
};
