const API_BASE = "http://localhost:3000/api";

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error ? `${payload.error}` : `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  tenants: {
    list: (q?: string) => request(`/tenants${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    create: (tenant: any) => request(`/tenants`, { method: "POST", body: JSON.stringify({ tenant }) }),
    update: (id: number, tenant: any) => request(`/tenants/${id}`, { method: "PATCH", body: JSON.stringify({ tenant }) }),
    remove: (id: number) => request(`/tenants/${id}`, { method: "DELETE" }),
  },
  units: {
    list: (q?: string) => request(`/units${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    create: (unit: any) => request(`/units`, { method: "POST", body: JSON.stringify({ unit }) }),
    update: (id: number, unit: any) => request(`/units/${id}`, { method: "PATCH", body: JSON.stringify({ unit }) }),
    remove: (id: number) => request(`/units/${id}`, { method: "DELETE" }),
  },
  requests: {
    list: (filters: { status?: string; priority?: string } = {}) => {
      const qs = new URLSearchParams(filters as any).toString();
      return request(`/maintenance_requests${qs ? `?${qs}` : ""}`);
    },
    create: (maintenance_request: any) => request(`/maintenance_requests`, { method: "POST", body: JSON.stringify({ maintenance_request }) }),
    update: (id: number, maintenance_request: any) => request(`/maintenance_requests/${id}`, { method: "PATCH", body: JSON.stringify({ maintenance_request }) }),
    remove: (id: number) => request(`/maintenance_requests/${id}`, { method: "DELETE" }),
  },
  payments: {
    list: (filters: { tenant_id?: string; unit_id?: string } = {}) => {
      const qs = new URLSearchParams(filters as any).toString();
      return request(`/payments${qs ? `?${qs}` : ""}`);
    },
    create: (payment: any) => request(`/payments`, { method: "POST", body: JSON.stringify({ payment }) }),
  },
};
