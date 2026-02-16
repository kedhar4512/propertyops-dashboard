import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type Tenant = { id: number; first_name: string; last_name: string; };
type Unit = { id: number; property_name: string; unit_number: string; };

type MR = {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  tenant?: Tenant;
  unit?: Unit;
  tenant_id?: number;
  unit_id?: number;
};

export function RequestsPage() {
  const [items, setItems] = useState<MR[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({ status: "", priority: "" });

  const [form, setForm] = useState({
    tenant_id: "",
    unit_id: "",
    title: "",
    description: "",
    priority: "medium",
  });

  async function loadAll() {
    setError(null);
    try {
      const [reqs, ts, us] = await Promise.all([
        api.requests.list({
          status: filters.status || undefined,
          priority: filters.priority || undefined,
        }),
        api.tenants.list(),
        api.units.list(),
      ]);
      setItems(reqs);
      setTenants(ts);
      setUnits(us);
    } catch (e: any) { setError(e.message); }
  }

  useEffect(() => { loadAll(); }, []);

  const canSubmit = useMemo(() => form.tenant_id && form.unit_id && form.title, [form]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await api.requests.create({
        ...form,
        tenant_id: Number(form.tenant_id),
        unit_id: Number(form.unit_id),
      });
      setForm({ tenant_id: "", unit_id: "", title: "", description: "", priority: "medium" });
      await loadAll();
    } catch (e: any) { setError(e.message); }
  }

  async function setStatus(id: number, status: string) {
    try { await api.requests.update(id, { status }); await loadAll(); } catch (e: any) { setError(e.message); }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this request?")) return;
    try { await api.requests.remove(id); await loadAll(); } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="header">
          <strong>Request Queue</strong>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All status</option>
              <option value="new">new</option>
              <option value="in_progress">in_progress</option>
              <option value="resolved">resolved</option>
              <option value="closed">closed</option>
            </select>
            <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All priority</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
            <button className="secondary" onClick={loadAll}>Apply</button>
          </div>
        </div>

        {error && <div className="small" style={{ color: "#b91c1c" }}>{error}</div>}

        <table className="table">
          <thead>
            <tr>
              <th>Title</th><th>Tenant</th><th>Unit</th><th>Priority</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.tenant ? `${r.tenant.first_name} ${r.tenant.last_name}` : "-"}</td>
                <td>{r.unit ? `${r.unit.property_name} ${r.unit.unit_number}` : "-"}</td>
                <td>{r.priority || "-"}</td>
                <td>{r.status}</td>
                <td>
                  <div className="row-actions">
                    <button className="secondary" onClick={() => setStatus(r.id, "in_progress")}>In progress</button>
                    <button className="secondary" onClick={() => setStatus(r.id, "resolved")}>Resolve</button>
                    <button className="danger" onClick={() => onDelete(r.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="small">No requests found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <strong>Create Request</strong>
        <form onSubmit={onCreate} className="form-row" style={{ marginTop: 12 }}>
          <div className="form-row two">
            <div>
              <label>Tenant</label>
              <select value={form.tenant_id} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}>
                <option value="">Select…</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </div>
            <div>
              <label>Unit</label>
              <select value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
                <option value="">Select…</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.property_name} {u.unit_number}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Dishwasher leaking" />
          </div>

          <div>
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="form-row two">
            <div>
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
            </div>
            <div className="small" style={{ alignSelf: "end" }}>
              This mirrors real workflows: create → triage → resolve.
            </div>
          </div>

          <button disabled={!canSubmit}>Create</button>
        </form>
      </div>
    </div>
  );
}
