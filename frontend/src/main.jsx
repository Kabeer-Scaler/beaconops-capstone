import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { incidentApi } from "./api";
import "./styles.css";

const EMPTY_STATS = { total: 0, active: 0, critical: 0, resolved: 0, mean_time_to_resolve_minutes: 0 };
const STATUS_ORDER = ["DETECTED", "INVESTIGATING", "MONITORING", "RESOLVED"];

function Icon({ name, size = 18 }) {
  const paths = {
    beacon: <><path d="M12 3v2"/><path d="m5.6 5.6 1.4 1.4"/><path d="M3 12h2"/><path d="m5.6 18.4 1.4-1.4"/><path d="M19 12h2"/><path d="m17 7 1.4-1.4"/><circle cx="12" cy="12" r="4"/><path d="M9 21h6"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    alert: <><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.5 17.5A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z"/></>,
    service: <><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    close: <><path d="M18 6 6 18M6 6l12 12"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    pulse: <path d="M3 12h4l2-6 4 12 2-6h6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function App() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [filter, setFilter] = useState("ACTIVE");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      setError("");
      const [incidentRows, incidentStats] = await Promise.all([incidentApi.list(), incidentApi.stats()]);
      setIncidents(incidentRows);
      setStats(incidentStats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => incidents.filter((incident) => {
    const matchesFilter = filter === "ALL" || (filter === "ACTIVE" ? incident.status !== "RESOLVED" : incident.status === filter);
    const haystack = `${incident.title} ${incident.service} ${incident.commander}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  }), [incidents, filter, query]);

  const mutate = async (id, action, successMessage) => {
    setBusyId(id);
    try {
      await action();
      setNotice(successMessage);
      await load();
      window.setTimeout(() => setNotice(""), 2800);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const advance = (incident) => {
    const next = STATUS_ORDER[Math.min(STATUS_ORDER.indexOf(incident.status) + 1, STATUS_ORDER.length - 1)];
    if (next !== incident.status) mutate(incident.id, () => incidentApi.update(incident.id, { status: next }), `Incident moved to ${pretty(next)}.`);
  };

  const createIncident = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await incidentApi.create({ ...data, status: "DETECTED" });
      setModalOpen(false);
      setNotice("Incident declared. Response timeline started.");
      await load();
      window.setTimeout(() => setNotice(""), 2800);
    } catch (err) {
      setError(err.message);
    }
  };

  return <div className="shell">
    <Sidebar />
    <main className="workspace">
      <header className="topbar">
        <div>
          <p className="eyebrow"><span className="live-dot" /> PRODUCTION OPERATIONS</p>
          <h1>Incident command</h1>
          <p className="subtitle">A live view of service health and active response.</p>
        </div>
        <button className="primary" onClick={() => setModalOpen(true)}><Icon name="plus" size={16}/> Declare incident</button>
      </header>

      {error && <div className="banner error"><Icon name="alert" size={17}/><span><strong>Service connection failed.</strong> {error}</span><button onClick={() => { setError(""); load(); }}>Retry</button></div>}
      {notice && <div className="toast"><Icon name="check" size={17}/>{notice}</div>}

      <section className="metric-grid" aria-label="Incident metrics">
        <Metric label="Active incidents" value={stats.active} trend="Requiring attention" tone="amber" icon="pulse" />
        <Metric label="Critical severity" value={stats.critical} trend={stats.critical ? "Immediate action" : "No SEV1 incidents"} tone="red" icon="alert" />
        <Metric label="Resolved" value={stats.resolved} trend="All time" tone="green" icon="check" />
        <Metric label="Mean time to resolve" value={`${stats.mean_time_to_resolve_minutes}m`} trend="Resolved incidents" tone="blue" icon="chart" />
      </section>

      <div className="operations-grid">
      <section className="board" id="queue">
        <div className="board-head">
          <div>
            <h2>Response queue <span>{visible.length}</span></h2>
            <p>Prioritized incidents across every production service.</p>
          </div>
          <div className="controls">
            <label className="search"><Icon name="search" size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search incidents" aria-label="Search incidents" /></label>
            <div className="segmented">
              {["ACTIVE", "RESOLVED", "ALL"].map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{pretty(item)}</button>)}
            </div>
          </div>
        </div>

        {loading ? <LoadingRows /> : visible.length ? <div className="incident-list">
          {visible.map((incident) => <IncidentRow key={incident.id} incident={incident} busy={busyId === incident.id} onAdvance={() => advance(incident)} onDelete={() => mutate(incident.id, () => incidentApi.remove(incident.id), "Incident removed from the response log.")} />)}
        </div> : <div className="empty-state"><div><Icon name="check" size={23}/></div><h3>Queue is clear</h3><p>No incidents match the current view.</p></div>}
      </section>
      <aside className="activity-rail">
        <section className="rail-card">
          <div className="rail-head"><div><p className="eyebrow">RESPONSE LOG</p><h2>Live activity</h2></div><span className="live-pill"><i/> Live</span></div>
          <div className="timeline">
            {incidents.slice(0, 4).map((incident) => <div className="timeline-row" key={incident.id}><span className={`timeline-icon ${incident.severity.toLowerCase()}`}><Icon name={incident.status === "RESOLVED" ? "check" : "pulse"} size={13}/></span><div><strong>{incident.status === "RESOLVED" ? "Incident resolved" : `${pretty(incident.status)} response`}</strong><p>{incident.title}</p><small>{timeAgo(incident.updated_at)}</small></div></div>)}
            {!incidents.length && <div className="timeline-empty">Activity will appear when an incident is declared.</div>}
          </div>
        </section>
        <section className="rail-card delivery-card">
          <div className="rail-head"><div><p className="eyebrow">DELIVERY</p><h2>Production pipeline</h2></div><span className="run-id">SHA</span></div>
          <div className="pipeline-step done"><i><Icon name="check" size={11}/></i><span><strong>Test</strong><small>pytest + Vite</small></span></div>
          <div className="pipeline-line"/>
          <div className="pipeline-step done"><i><Icon name="check" size={11}/></i><span><strong>Build & scan</strong><small>Docker + Trivy</small></span></div>
          <div className="pipeline-line"/>
          <div className="pipeline-step current"><i><Icon name="pulse" size={11}/></i><span><strong>Deploy</strong><small>Amazon EKS</small></span></div>
        </section>
      </aside>
      </div>
      <footer><span>BeaconOps control plane</span><span><i /> API operational</span><span>Region: ap-south-1</span></footer>
    </main>
    {modalOpen && <IncidentModal onClose={() => setModalOpen(false)} onSubmit={createIncident} />}
  </div>;
}

function Sidebar() {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><Icon name="beacon" size={21}/></div><div><strong>BeaconOps</strong><span>INCIDENT COMMAND</span></div></div>
    <div className="nav-label">COMMAND CENTER</div>
    <nav>
      <a className="active" href="#"><Icon name="grid"/><span>Overview</span></a>
      <a href="#queue"><Icon name="alert"/><span>Incidents</span><em>Live</em></a>
      <a href="#services"><Icon name="service"/><span>Services</span></a>
      <a href="#runbooks"><Icon name="book"/><span>Runbooks</span></a>
      <a href="#analytics"><Icon name="chart"/><span>Analytics</span></a>
    </nav>
    <div className="sidebar-bottom">
      <div className="on-call"><p>PRIMARY ON-CALL</p><div><span className="avatar">AS</span><span><strong>Aarav Sharma</strong><small>Platform engineering</small></span><i /></div></div>
      <div className="system-status"><span><i/> All systems connected</span><small>Last sync just now</small></div>
    </div>
  </aside>;
}

function Metric({ label, value, trend, tone, icon }) {
  return <article className={`metric ${tone}`}><div className="metric-top"><span>{label}</span><div><Icon name={icon} size={17}/></div></div><strong>{value}</strong><p>{trend}</p></article>;
}

function IncidentRow({ incident, busy, onAdvance, onDelete }) {
  return <article className={`incident ${busy ? "busy" : ""}`}>
    <div className={`severity ${incident.severity.toLowerCase()}`}>{incident.severity}</div>
    <div className="incident-main"><div className="incident-title"><h3>{incident.title}</h3><span className={`status ${incident.status.toLowerCase()}`}>{pretty(incident.status)}</span></div><p>{incident.summary || "No incident summary supplied."}</p><div className="incident-meta"><span><Icon name="service" size={13}/>{incident.service}</span><span className="commander"><b>{initials(incident.commander)}</b>{incident.commander}</span><span>#{String(incident.id).padStart(4, "0")}</span><span>{timeAgo(incident.created_at)}</span></div></div>
    <div className="row-actions">{incident.status !== "RESOLVED" && <button className="advance" onClick={onAdvance} disabled={busy}>Advance <Icon name="chevron" size={14}/></button>}<button className="delete" onClick={onDelete} disabled={busy} title="Delete incident"><Icon name="trash" size={15}/></button></div>
  </article>;
}

function IncidentModal({ onClose, onSubmit }) {
  useEffect(() => { const handler = (event) => event.key === "Escape" && onClose(); window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal" onSubmit={onSubmit}>
      <div className="modal-head"><div><p className="eyebrow">NEW RESPONSE</p><h2>Declare an incident</h2><p>Start a coordinated response and make impact visible.</p></div><button type="button" onClick={onClose} aria-label="Close"><Icon name="close" size={18}/></button></div>
      <label>Incident title<input name="title" minLength="3" maxLength="200" required autoFocus placeholder="e.g. Checkout requests timing out" /></label>
      <label>Impact summary<textarea name="summary" maxLength="4000" placeholder="What is affected and what are users experiencing?" /></label>
      <div className="form-grid"><label>Severity<select name="severity" defaultValue="SEV2"><option value="SEV1">SEV1 — Critical</option><option value="SEV2">SEV2 — High</option><option value="SEV3">SEV3 — Moderate</option><option value="SEV4">SEV4 — Low</option></select></label><label>Affected service<input name="service" minLength="2" maxLength="120" required placeholder="checkout-api" /></label></div>
      <label>Incident commander<input name="commander" minLength="2" maxLength="120" required defaultValue="Aarav Sharma" /></label>
      <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button type="submit" className="primary"><Icon name="alert" size={15}/> Declare incident</button></div>
    </form>
  </div>;
}

function LoadingRows() { return <div className="loading-list">{[1,2,3].map((item) => <div className="skeleton" key={item}><i/><span/><b/></div>)}</div>; }
function pretty(value) { return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " "); }
function initials(name) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function timeAgo(value) { const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000)); return minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`; }

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
