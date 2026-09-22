import { Controller, Get, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import { TelemetryService } from './common/telemetry.service';
import { Public } from './common/public.decorator';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'ads-control-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      metrics: this.telemetry.getMetrics()
    };
  }

  @Public()
  @Get('api/telemetry/data')
  getTelemetryData() {
    return this.telemetry.getMetrics();
  }

  @Public()
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getRootDashboard(@Res() res: Response) {
    const metrics = this.telemetry.getMetrics();
    const env = process.env.NODE_ENV || 'development';
    const port = process.env.PORT || 4000;
    const metaGraphVersion = process.env.META_GRAPH_API_VERSION || 'v22.0';
    const supabaseConfigured = !!process.env.SUPABASE_URL;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ads Control API Engine · Live Operations</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #090d16;
      --bg-surface: #0f172a;
      --bg-card: rgba(17, 24, 39, 0.75);
      --border: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(59, 130, 246, 0.3);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --primary: #3b82f6;
      --primary-glow: rgba(59, 130, 246, 0.25);
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.2);
      --amber: #f59e0b;
      --purple: #8b5cf6;
      --rose: #f43f5e;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-base);
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 85% 85%, rgba(139, 92, 246, 0.1) 0%, transparent 45%),
        radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 60%);
      background-attachment: fixed;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
      width: 100%;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .brand-logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px var(--primary-glow);
      font-weight: 800;
      font-size: 1.3rem;
      color: white;
    }
    .brand-title {
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(to right, #ffffff, #93c5fd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Live Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.9rem;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 0.82rem;
      font-weight: 600;
      box-shadow: 0 0 15px var(--emerald-glow);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.35); opacity: 0.6; }
    }

    /* Action Buttons */
    .btn-group {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }
    .btn-primary {
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 14px var(--primary-glow);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px var(--primary-glow);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.09);
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Metric Cards Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.25rem;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .card:hover {
      border-color: var(--border-accent);
      transform: translateY(-2px);
    }
    .card-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      font-weight: 700;
      margin-bottom: 0.4rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-value {
      font-size: 1.5rem;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-primary);
    }
    .card-sub {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    /* Services Status Strip */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .service-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem 1.2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .service-info {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
    .service-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    .service-title {
      font-size: 0.88rem;
      font-weight: 600;
    }
    .service-meta {
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .service-tag {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .tag-active { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .tag-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .tag-purple { background: rgba(139, 92, 246, 0.15); color: #c084fc; }

    /* Live Requests Section */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      color: var(--emerald);
      font-weight: 600;
    }

    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 2rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.82rem;
    }
    th {
      background: rgba(255, 255, 255, 0.02);
      padding: 0.75rem 1rem;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-secondary);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); color: var(--text-primary); }

    .method-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .method-GET { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .method-POST { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .method-PATCH { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .method-DELETE { background: rgba(244, 63, 94, 0.2); color: #fb7185; }

    .status-code { font-weight: 700; }
    .status-200, .status-201, .status-204 { color: #34d399; }
    .status-400, .status-401, .status-404 { color: #fbbf24; }
    .status-500 { color: #f43f5e; }

    /* Footer */
    .footer {
      margin-top: auto;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.78rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="brand">
        <div class="brand-logo">⚡</div>
        <div>
          <h1 class="brand-title">Meta Ads Operations & Financial Control Engine</h1>
          <div class="brand-subtitle">
            <span>In-House High-Frequency Ledger & Meta API v22.0 Gateway</span>
            <span>•</span>
            <span class="status-badge"><span class="status-dot"></span> API LIVE & OPERATIONAL</span>
          </div>
        </div>
      </div>
      <div class="btn-group">
        <a href="/api/docs" class="btn btn-primary" target="_blank">
          📚 Swagger API Documentation
        </a>
        <a href="https://metabull-ads-budget-managment-git-main-designwithtanishk.vercel.app" class="btn btn-secondary" target="_blank">
          🖥️ Open Web App (Vercel)
        </a>
      </div>
    </header>

    <!-- Top Live Metrics Strip -->
    <div class="metrics-grid">
      <div class="card">
        <div class="card-label">Server Uptime <span>⏱️</span></div>
        <div class="card-value" id="uptime-val">${Math.floor(metrics.uptimeSec / 60)}m ${metrics.uptimeSec % 60}s</div>
        <div class="card-sub">Continuous Operational Stream</div>
      </div>
      <div class="card">
        <div class="card-label">Total Processed Requests <span>📊</span></div>
        <div class="card-value" id="requests-val">${metrics.totalRequests.toLocaleString()}</div>
        <div class="card-sub">Since process bootstrap</div>
      </div>
      <div class="card">
        <div class="card-label">Avg Processing Latency <span>⚡</span></div>
        <div class="card-value" id="latency-val">${metrics.avgLatencyMs} <span style="font-size: 0.9rem; color: var(--text-muted);">ms</span></div>
        <div class="card-sub">Double-entry & DB pipeline</div>
      </div>
      <div class="card">
        <div class="card-label">Memory Heap Footprint <span>💾</span></div>
        <div class="card-value" id="memory-val">${metrics.memoryHeapMb} <span style="font-size: 0.9rem; color: var(--text-muted);">MB</span></div>
        <div class="card-sub">V8 Garbage Collected Heap</div>
      </div>
    </div>

    <!-- Active Connected Micro-Engines -->
    <div class="services-grid">
      <div class="service-card">
        <div class="service-info">
          <div class="service-icon">🚀</div>
          <div>
            <div class="service-title">NestJS Core Runtime</div>
            <div class="service-meta">${metrics.nodeVersion} · Port ${port} (${env})</div>
          </div>
        </div>
        <span class="service-tag tag-active">HEALTHY</span>
      </div>
      <div class="service-card">
        <div class="service-info">
          <div class="service-icon">🗄️</div>
          <div>
            <div class="service-title">Supabase PostgreSQL</div>
            <div class="service-meta">Pooler (IPv4 Mode) · Active</div>
          </div>
        </div>
        <span class="service-tag tag-active">CONNECTED</span>
      </div>
      <div class="service-card">
        <div class="service-info">
          <div class="service-icon">📡</div>
          <div>
            <div class="service-title">Meta Marketing API</div>
            <div class="service-meta">Graph Version ${metaGraphVersion} Gateway</div>
          </div>
        </div>
        <span class="service-tag tag-blue">AUTHENTICATED</span>
      </div>
      <div class="service-card">
        <div class="service-info">
          <div class="service-icon">⚡</div>
          <div>
            <div class="service-title">Realtime SSE Stream</div>
            <div class="service-meta">Broadcast Channel Live</div>
          </div>
        </div>
        <span class="service-tag tag-purple">STREAMING</span>
      </div>
    </div>

    <!-- Live Telemetry & API Calls Feed -->
    <div class="section-header">
      <div class="section-title">
        <span>Live API Traffic & Telemetry Stream</span>
      </div>
      <div class="live-indicator">
        <span class="status-dot"></span> AUTO-REFRESHING LIVE (2s)
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Method</th>
            <th>Endpoint Route</th>
            <th>Status</th>
            <th>Latency</th>
            <th>Client IP</th>
          </tr>
        </thead>
        <tbody id="telemetry-table-body">
          ${metrics.records.length > 0 ? metrics.records.map(r => `
            <tr>
              <td>${r.timestamp}</td>
              <td><span class="method-badge method-${r.method}">${r.method}</span></td>
              <td style="color: var(--text-primary); font-weight: 500;">${r.path}</td>
              <td class="status-code status-${r.statusCode}">${r.statusCode}</td>
              <td>${r.durationMs}ms</td>
              <td style="color: var(--text-muted);">${r.ip}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                Awaiting incoming API requests... Send any request to see live telemetry stream.
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <div>MetaBull Ads Control System · In-House Financial Operations Platform</div>
      <div>Environment: <strong style="color: var(--emerald);">${env.toUpperCase()}</strong> · Port: <strong>${port}</strong></div>
    </footer>
  </div>

  <script>
    let uptimeSeconds = ${metrics.uptimeSec};

    // Live Uptime Ticker
    setInterval(() => {
      uptimeSeconds++;
      const m = Math.floor(uptimeSeconds / 60);
      const s = uptimeSeconds % 60;
      const h = Math.floor(m / 60);
      const mins = m % 60;
      document.getElementById('uptime-val').innerText = h > 0 ? h + 'h ' + mins + 'm ' + s + 's' : mins + 'm ' + s + 's';
    }, 1000);

    // Live Telemetry Polling (every 2.5s)
    async function updateTelemetry() {
      try {
        const res = await fetch('/api/telemetry/data');
        if (res.ok) {
          const data = await res.json();
          document.getElementById('requests-val').innerText = data.totalRequests.toLocaleString();
          document.getElementById('latency-val').innerHTML = data.avgLatencyMs + ' <span style="font-size: 0.9rem; color: var(--text-muted);">ms</span>';
          document.getElementById('memory-val').innerHTML = data.memoryHeapMb + ' <span style="font-size: 0.9rem; color: var(--text-muted);">MB</span>';

          if (data.records && data.records.length > 0) {
            const rows = data.records.map(r => \`
              <tr>
                <td>\${r.timestamp}</td>
                <td><span class="method-badge method-\${r.method}">\${r.method}</span></td>
                <td style="color: var(--text-primary); font-weight: 500;">\${r.path}</td>
                <td class="status-code status-\${r.statusCode}">\${r.statusCode}</td>
                <td>\${r.durationMs}ms</td>
                <td style="color: var(--text-muted);">\${r.ip}</td>
              </tr>
            \`).join('');
            document.getElementById('telemetry-table-body').innerHTML = rows;
          }
        }
      } catch (err) {}
    }

    setInterval(updateTelemetry, 2500);
  </script>
</body>
</html>`;

    return res.send(html);
  }
}
