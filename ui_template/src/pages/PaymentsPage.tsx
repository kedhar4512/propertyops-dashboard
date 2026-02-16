import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type Tenant = { id: number; first_name: string; last_name: string; };
type Unit = { id: number; property_name: string; unit_number: string; };

type Payment = {
  id: number;
  amount_cents: number;
  paid_on: string;
  method?: string;
  reference?: string;
  tenant?: Tenant;
  unit?: Unit;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    tenant_id: "",
    unit_id: "",
    amount_cents: 150000,
    paid_on: new Date().toISOString().slice(0, 10),
    method: "ach",
    reference: "",
  });

  async function loadAll() {
    setError(null);
    try {
      const [ps, ts, us] = await Promise.all([api.payments.list(), api.tenants.list(), api.units.list()]);
      setItems(ps);
      setTenants(ts);
      setUnits(us);
    } catch (e: any) { setError(e.message); }
  }

  useEffect(() => { loadAll(); }, []);

  const canSubmit = useMemo(() => form.tenant_id && form.unit_id && form.amount_cents > 0 && form.paid_on, [form]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await api.payments.create({
        ...form,
        tenant_id: Number(form.tenant_id),
        unit_id: Number(form.unit_id),
      });
      setForm({ ...form, reference: "" });
      await loadAll();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="grid grid-2">
      <div className="card">
        <strong>Payment History</strong>
        {error && <div className="small" style={{ color: "#b91c1c" }}>{error}</div>}
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Date</th><th>Tenant</th><th>Unit</th><th>Amount</th><th>Method</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id}>
                <td>{p.paid_on}</td>
                <td>{p.tenant ? `${p.tenant.first_name} ${p.tenant.last_name}` : "-"}</td>
                <td>{p.unit ? `${p.unit.property_name} ${p.unit.unit_number}` : "-"}</td>
                <td>{money(p.amount_cents)}</td>
                <td>{p.method || "-"}</td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="small">No payments yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <strong>Record Payment</strong>
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

          <div className="form-row two">
            <div>
              <label>Amount (cents)</label>
              <input type="number" value={form.amount_cents} onChange={(e) => setForm({ ...form, amount_cents: Number(e.target.value) })} />
            </div>
            <div>
              <label>Paid on</label>
              <input type="date" value={form.paid_on} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} />
            </div>
          </div>

          <div className="form-row two">
            <div>
              <label>Method</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="ach">ach</option>
                <option value="card">card</option>
                <option value="cash">cash</option>
                <option value="check">check</option>
              </select>
            </div>
            <div>
              <label>Reference</label>
              <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Optional" />
            </div>
          </div>

          <button disabled={!canSubmit}>Save</button>
          <div className="small">This mirrors “record rent payment” in property software.</div>
        </form>
      </div>
    </div>
  );
}
