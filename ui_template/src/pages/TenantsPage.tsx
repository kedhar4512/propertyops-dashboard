import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type Tenant = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status?: string;
};

export function TenantsPage() {
  const [items, setItems] = useState<Tenant[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", status: "active" });

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await api.tenants.list(q.trim() || undefined);
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const canSubmit = useMemo(() => form.first_name && form.last_name && form.email, [form]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await api.tenants.create(form);
      setForm({ first_name: "", last_name: "", email: "", phone: "", status: "active" });
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this tenant?")) return;
    try { await api.tenants.remove(id); await load(); } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="grid">
      <div className="grid grid-2">
        <div className="card">
          <div className="header">
            <strong>Tenant Directory</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={q} placeholder="Search name or email…" onChange={(e) => setQ(e.target.value)} />
              <button className="secondary" onClick={load}>Search</button>
            </div>
          </div>

          {error && <div className="small" style={{ color: "#b91c1c" }}>{error}</div>}
          {loading ? <div className="small">Loading…</div> : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(t => (
                  <tr key={t.id}>
                    <td>{t.first_name} {t.last_name}</td>
                    <td>{t.email}</td>
                    <td>{t.status || "-"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="danger" onClick={() => onDelete(t.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr><td colSpan={4} className="small">No tenants found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <strong>Add Tenant</strong>
          <form onSubmit={onCreate} className="form-row" style={{ marginTop: 12 }}>
            <div className="form-row two">
              <div>
                <label>First name</label>
                <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label>Last name</label>
                <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label>Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-row two">
              <div>
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="applicant">applicant</option>
                </select>
              </div>
            </div>
            <button disabled={!canSubmit}>Create</button>
            <div className="small">Tip: this mirrors real-world “tenant onboarding” forms.</div>
          </form>
        </div>
      </div>
    </div>
  );
}
