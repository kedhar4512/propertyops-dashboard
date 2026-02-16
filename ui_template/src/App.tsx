import React, { useMemo, useState } from "react";
import { TenantsPage } from "./pages/TenantsPage";
import { UnitsPage } from "./pages/UnitsPage";
import { RequestsPage } from "./pages/RequestsPage";
import { PaymentsPage } from "./pages/PaymentsPage";

type Tab = "tenants" | "units" | "requests" | "payments";

export default function App() {
  const [tab, setTab] = useState<Tab>("tenants");

  const title = useMemo(() => {
    switch (tab) {
      case "tenants": return "Tenants";
      case "units": return "Units";
      case "requests": return "Maintenance Requests";
      case "payments": return "Payments";
    }
  }, [tab]);

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 style={{ margin: 0 }}>PropertyOps</h1>
          <div className="small">Full‑stack demo: React UI + Rails API + SQL</div>
        </div>
        <span className="badge">API: localhost:3000</span>
      </div>

      <div className="nav" style={{ marginBottom: 16 }}>
        <button onClick={() => setTab("tenants")} className={tab === "tenants" ? "" : "secondary"}>Tenants</button>
        <button onClick={() => setTab("units")} className={tab === "units" ? "" : "secondary"}>Units</button>
        <button onClick={() => setTab("requests")} className={tab === "requests" ? "" : "secondary"}>Requests</button>
        <button onClick={() => setTab("payments")} className={tab === "payments" ? "" : "secondary"}>Payments</button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {tab === "tenants" && <TenantsPage />}
        {tab === "units" && <UnitsPage />}
        {tab === "requests" && <RequestsPage />}
        {tab === "payments" && <PaymentsPage />}
      </div>
    </div>
  );
}
