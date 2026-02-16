import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type Unit = {
  id: number;
  property_name: string;
  unit_number: string;
  beds?: number;
  baths?: number;
  rent_cents?: number;
  status?: string;
};

function money(cents?: number) {
  if (!cents && cents !== 0) return "-";
  return `$${(cents / 100).toFixed(2)}`;
}

export function UnitsPage() {
  const [items, setItems] = useState<Unit[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    property_name: "",
    unit_number: "",
    beds: 1,
    baths: 1,
    rent_cents: 150000,
    status: "vacant",
  });

  async function load() {
    setError(null);
    try {
      const data = await api.units.list(q.trim() || undefined);
      setItems(data);
    } catch (e: any) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  const canSubmit = useMemo(() => form.property_name && form.unit_number, [form]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await api.units.create(form);
      setForm({ property_name: "", unit_number: "", beds: 1, baths: 1, rent_cents: 150000, status: "vacant" });
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this unit?")) return;
    try { await api.units.remove(id); await load(); } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="header">
          <strong>Units</strong>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={q} placeholder="Search property/unit…" onChange={(e) => setQ(e.target.value)} />
            <button className="secondary" onClick={load}>Search</button>
          </div>
        </div>

        {error && <div className="small" style={{ color: "#b91c1c" }}>{error}</div>}

        <table className="table">
          <thead>
            <tr>
              <th>Property</th><th>Unit</th><th>Rent</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(u => (
              <tr key={u.id}>
                <td>{u.property_name}</td>
                <td>{u.unit_number}</td>
                <td>{money(u.rent_cents)}</td>
                <td>{u.status || "-"}</td>
                <td><button className="danger" onClick={() => onDelete(u.id)}>Delete</button></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="small">No units found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <strong>Add Unit</strong>
        <form onSubmit={onCreate} className="form-row" style={{ marginTop: 12 }}>
          <div className="form-row two">
            <div>
              <label>Property name</label>
              <input value={form.property_name} onChange={(e) => setForm({ ...form, property_name: e.target.value })} />
            </div>
            <div>
              <label>Unit number</label>
              <input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} />
            </div>
          </div>
          <div className="form-row two">
            <div>
              <label>Beds</label>
              <input type="number" value={form.beds} onChange={(e) => setForm({ ...form, beds: Number(e.target.value) })} />
            </div>
            <div>
              <label>Baths</label>
              <input type="number" step="0.5" value={form.baths} onChange={(e) => setForm({ ...form, baths: Number(e.target.value) })} />
            </div>
          </div>
          <div className="form-row two">
            <div>
              <label>Rent (cents)</label>
              <input type="number" value={form.rent_cents} onChange={(e) => setForm({ ...form, rent_cents: Number(e.target.value) })} />
            </div>
            <div>
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="vacant">vacant</option>
                <option value="occupied">occupied</option>
                <option value="maintenance">maintenance</option>
              </select>
            </div>
          </div>
          <button disabled={!canSubmit}>Create</button>
          <div className="small">Tip: In real teams, status drives reporting and workflow.</div>
        </form>
      </div>
    </div>
  );
}
