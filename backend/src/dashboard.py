"""
dashboard.py — Farm & Field Human Escalation Dashboard (Step 5)

Run standalone:
    python -m src.dashboard          (from backend/)
    # or
    uvicorn src.dashboard:app --reload --port 8001

Open in browser: http://localhost:8001
"""

import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

try:
    from escalation import init_escalation_table, list_escalations, resolve_escalation
except ImportError:
    from src.escalation import init_escalation_table, list_escalations, resolve_escalation

app = FastAPI(title="Farm & Field — Escalation Dashboard")

# Ensure the table exists when the app starts
init_escalation_table()

# --------------------------------------------------------------------------- #
# API endpoints                                                                #
# --------------------------------------------------------------------------- #

@app.get("/api/escalations")
def api_list(status: str = ""):
    """Return all escalations as JSON (optional ?status=open|resolved)."""
    return list_escalations(status=status or None)


@app.post("/api/escalations/{ref_id}/resolve")
def api_resolve(ref_id: str):
    """Mark a single escalation as resolved."""
    ok = resolve_escalation(ref_id)
    if ok:
        return {"status": "resolved", "ref_id": ref_id}
    return JSONResponse(status_code=404, content={"error": "ref_id not found"})


# --------------------------------------------------------------------------- #
# Dashboard HTML (Step 5 — local page that shows open requests)               #
# --------------------------------------------------------------------------- #

@app.get("/", response_class=HTMLResponse)
def dashboard():
    return HTMLResponse(_render_html())


def _render_html() -> str:
    """Return the full dashboard page as an HTML string."""
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Farm &amp; Field — Escalation Dashboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --surface2: #1e2530;
    --border: #30363d;
    --accent: #3fb950;
    --accent2: #58a6ff;
    --warn: #e3b341;
    --danger: #f85149;
    --text: #c9d1d9;
    --muted: #8b949e;
    --radius: 10px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    padding: 0 0 60px;
  }

  /* ── Header ── */
  header {
    background: linear-gradient(135deg, #0f4c1e 0%, #1a2f0d 50%, #0d1a2e 100%);
    padding: 24px 36px;
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 10;
  }
  header .logo { font-size: 1.8rem; }
  header h1 { font-size: 1.25rem; font-weight: 700; color: #fff; }
  header p  { font-size: 0.82rem; color: var(--muted); margin-top: 2px; }
  .badge {
    margin-left: auto;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.78rem;
    color: var(--muted);
  }
  .badge span { color: var(--accent2); font-weight: 600; }

  /* ── Toolbar ── */
  .toolbar {
    max-width: 1100px; margin: 24px auto 0; padding: 0 24px;
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  }
  .filter-btn {
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); padding: 7px 16px; border-radius: 20px;
    cursor: pointer; font-size: 0.84rem; font-family: inherit;
    transition: all .2s;
  }
  .filter-btn.active, .filter-btn:hover {
    background: var(--accent); color: #000; border-color: var(--accent);
    font-weight: 600;
  }
  .refresh-btn {
    margin-left: auto; background: var(--surface2);
    border: 1px solid var(--border); color: var(--accent2);
    padding: 7px 16px; border-radius: 20px; cursor: pointer;
    font-size: 0.84rem; font-family: inherit; transition: all .2s;
  }
  .refresh-btn:hover { background: var(--accent2); color: #000; font-weight: 600; }

  /* ── Stats bar ── */
  .stats {
    max-width: 1100px; margin: 20px auto 0; padding: 0 24px;
    display: flex; gap: 14px; flex-wrap: wrap;
  }
  .stat-card {
    flex: 1; min-width: 140px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 16px 20px;
  }
  .stat-card .label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
  .stat-card .value { font-size: 2rem; font-weight: 700; margin-top: 4px; }
  .stat-card.open   .value { color: var(--warn); }
  .stat-card.high   .value { color: var(--danger); }
  .stat-card.res    .value { color: var(--accent); }
  .stat-card.total  .value { color: var(--accent2); }

  /* ── Table ── */
  .table-wrap {
    max-width: 1100px; margin: 24px auto 0; padding: 0 24px;
    overflow-x: auto;
  }
  table {
    width: 100%; border-collapse: collapse;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden;
  }
  th {
    background: var(--surface2); color: var(--muted);
    font-size: 0.75rem; text-transform: uppercase; letter-spacing: .06em;
    padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border);
  }
  td { padding: 13px 16px; border-bottom: 1px solid var(--border); font-size: 0.88rem; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255,255,255,.02); }

  /* ── Reason pill ── */
  .pill {
    display: inline-block; padding: 3px 10px; border-radius: 20px;
    font-size: 0.75rem; font-weight: 600; white-space: nowrap;
  }
  .pill.missing { background: rgba(227,179,65,.15); color: var(--warn); border: 1px solid rgba(227,179,65,.35); }
  .pill.crop    { background: rgba(248,81,73,.15); color: var(--danger); border: 1px solid rgba(248,81,73,.35); }

  /* ── Urgency ── */
  .urg { display: inline-block; font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
  .urg.high   { background: rgba(248,81,73,.18); color: var(--danger); }
  .urg.medium { background: rgba(227,179,65,.18); color: var(--warn); }
  .urg.low    { background: rgba(63,185,80,.18);  color: var(--accent); }

  /* ── Status ── */
  .status { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; }
  .status::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .status.open     { color: var(--warn); }
  .status.resolved { color: var(--accent); }

  /* ── Resolve button ── */
  .resolve-btn {
    background: transparent; border: 1px solid var(--accent);
    color: var(--accent); padding: 5px 12px; border-radius: 6px;
    cursor: pointer; font-size: 0.78rem; font-family: inherit;
    transition: all .2s;
  }
  .resolve-btn:hover { background: var(--accent); color: #000; font-weight: 600; }
  .resolve-btn:disabled { opacity: .4; cursor: default; }

  /* ── Empty state ── */
  .empty {
    text-align: center; padding: 60px 20px; color: var(--muted);
    font-size: 0.95rem;
  }
  .empty .icon { font-size: 3rem; margin-bottom: 12px; }

  /* ── Toast ── */
  #toast {
    position: fixed; bottom: 28px; right: 28px;
    background: var(--surface2); border: 1px solid var(--accent);
    color: var(--accent); padding: 12px 20px; border-radius: 8px;
    font-size: 0.85rem; opacity: 0; transition: opacity .3s;
    pointer-events: none; z-index: 100;
  }
  #toast.show { opacity: 1; }

  .ref-id { font-family: monospace; font-size: 0.85rem; color: var(--accent2); }
  .small   { font-size: 0.78rem; color: var(--muted); }
</style>
</head>
<body>

<header>
  <div class="logo">🌾</div>
  <div>
    <h1>Farm &amp; Field — Escalation Dashboard</h1>
    <p>Human-in-the-loop requests raised by the AI agent</p>
  </div>
  <div class="badge">Auto-refreshes every <span>30s</span></div>
</header>

<div class="toolbar">
  <button class="filter-btn active" onclick="setFilter('all',this)">All</button>
  <button class="filter-btn" onclick="setFilter('open',this)">Open</button>
  <button class="filter-btn" onclick="setFilter('resolved',this)">Resolved</button>
  <button class="refresh-btn" onclick="load()">↻ Refresh</button>
</div>

<div class="stats">
  <div class="stat-card total">
    <div class="label">Total</div>
    <div class="value" id="s-total">—</div>
  </div>
  <div class="stat-card open">
    <div class="label">Open</div>
    <div class="value" id="s-open">—</div>
  </div>
  <div class="stat-card high">
    <div class="label">High Urgency</div>
    <div class="value" id="s-high">—</div>
  </div>
  <div class="stat-card res">
    <div class="label">Resolved</div>
    <div class="value" id="s-res">—</div>
  </div>
</div>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Ref ID</th>
        <th>Reason</th>
        <th>Caller</th>
        <th>Crop / District</th>
        <th>What Happened</th>
        <th>Already Checked</th>
        <th>Urgency</th>
        <th>Lang / Follow-up</th>
        <th>Status</th>
        <th>Created</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody id="tbody">
      <tr><td colspan="11" class="empty"><div class="icon">⏳</div>Loading…</td></tr>
    </tbody>
  </table>
</div>

<div id="toast"></div>

<script>
  let currentFilter = 'all';
  let allData = [];

  function setFilter(f, btn) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(allData);
  }

  async function load() {
    try {
      const r = await fetch('/api/escalations');
      allData = await r.json();
      render(allData);
      updateStats(allData);
    } catch(e) {
      console.error(e);
    }
  }

  function updateStats(data) {
    document.getElementById('s-total').textContent = data.length;
    document.getElementById('s-open').textContent  = data.filter(d=>d.status==='open').length;
    document.getElementById('s-high').textContent  = data.filter(d=>d.urgency==='high').length;
    document.getElementById('s-res').textContent   = data.filter(d=>d.status==='resolved').length;
  }

  function render(data) {
    const filtered = currentFilter === 'all' ? data : data.filter(d=>d.status===currentFilter);
    const tbody = document.getElementById('tbody');
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="11" class="empty"><div class="icon">✅</div>No escalations found.</td></tr>`;
      return;
    }
    tbody.innerHTML = filtered.map(row => {
      const reasonClass = row.reason === 'missing_market_data' ? 'missing' : 'crop';
      const reasonLabel = row.reason === 'missing_market_data'
        ? '📊 Missing Market Data' : '🚨 Serious Crop Problem';
      const ts = row.created_at ? new Date(row.created_at).toLocaleString() : '—';
      const resolved = row.status === 'resolved';
      return `<tr>
        <td><span class="ref-id">${row.ref_id}</span></td>
        <td><span class="pill ${reasonClass}">${reasonLabel}</span></td>
        <td>${row.caller_name || '—'}</td>
        <td>${row.crop || '—'}<br><span class="small">${row.district || ''}</span></td>
        <td>${truncate(row.what_happened, 90)}</td>
        <td class="small">${truncate(row.already_checked, 70) || '—'}</td>
        <td><span class="urg ${row.urgency}">${row.urgency}</span></td>
        <td>${row.caller_lang || '—'}<br><span class="small">${row.follow_up_pref || '—'}</span></td>
        <td><span class="status ${row.status}">${row.status}</span></td>
        <td class="small">${ts}</td>
        <td>
          <button class="resolve-btn" ${resolved ? 'disabled' : ''}
            onclick="resolve('${row.ref_id}', this)">
            ${resolved ? 'Done' : 'Resolve'}
          </button>
        </td>
      </tr>`;
    }).join('');
  }

  function truncate(str, n) {
    if (!str) return '';
    return str.length > n ? str.slice(0,n) + '…' : str;
  }

  async function resolve(refId, btn) {
    btn.disabled = true;
    btn.textContent = 'Resolving…';
    const r = await fetch(`/api/escalations/${refId}/resolve`, {method:'POST'});
    if (r.ok) {
      showToast(`✅ ${refId} marked as resolved`);
      await load();
    } else {
      btn.disabled = false;
      btn.textContent = 'Resolve';
      showToast(`❌ Failed to resolve ${refId}`);
    }
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // Initial load + auto-refresh every 30s
  load();
  setInterval(load, 30000);
</script>
</body>
</html>"""


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("DASHBOARD_PORT", "8001"))
    print(f"\n🌾  Farm & Field Escalation Dashboard → http://localhost:{port}\n")
    uvicorn.run("src.dashboard:app", host="0.0.0.0", port=port, reload=True)
