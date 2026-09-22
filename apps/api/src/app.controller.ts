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
  getRootTerminal(@Res() res: Response) {
    const metrics = this.telemetry.getMetrics();
    const env = process.env.NODE_ENV || 'development';
    const port = process.env.PORT || 4000;
    const metaGraphVersion = process.env.META_GRAPH_API_VERSION || 'v22.0';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ads-control-api ~ console</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background-color: #07090e;
      color: #cbd5e1;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13.5px;
      line-height: 1.6;
      min-height: 100vh;
      width: 100%;
      padding: 1.5rem 2rem;
    }

    .ascii-banner {
      color: #58a6ff;
      font-size: 11px;
      line-height: 1.15;
      margin-bottom: 1.25rem;
      white-space: pre;
      font-weight: 700;
    }

    .line {
      margin-bottom: 0.3rem;
      word-break: break-all;
    }
    .text-green { color: #3fb950; }
    .text-blue { color: #58a6ff; }
    .text-purple { color: #bc8cff; }
    .text-yellow { color: #d29922; }
    .text-red { color: #f85149; }
    .text-muted { color: #6e7681; }
    .text-white { color: #f0f6fc; font-weight: 600; }
    
    .divider {
      height: 1px;
      background: #21262d;
      margin: 1rem 0;
      max-width: 1000px;
    }

    .prompt {
      color: #3fb950;
      font-weight: 700;
    }
    .path {
      color: #58a6ff;
    }

    /* Interactive links */
    a.term-link {
      color: #58a6ff;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    a.term-link:hover {
      color: #79c0ff;
    }

    /* Logs stream */
    .log-stream {
      max-width: 1000px;
      margin-top: 0.5rem;
    }
    .log-row {
      display: flex;
      gap: 14px;
      padding: 2px 0;
      font-size: 12.5px;
    }
    .log-time { color: #6e7681; flex-shrink: 0; }
    .log-method { font-weight: 700; width: 55px; flex-shrink: 0; }
    .method-get { color: #58a6ff; }
    .method-post { color: #3fb950; }
    .method-patch { color: #d29922; }
    .method-delete { color: #f85149; }
    .log-path { color: #f0f6fc; flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .log-status { font-weight: 700; flex-shrink: 0; }
    .status-2xx { color: #3fb950; }
    .status-4xx { color: #d29922; }
    .status-5xx { color: #f85149; }
    .log-lat { color: #8b949e; flex-shrink: 0; width: 70px; text-align: right; }

    /* Cursor animation */
    .cursor {
      display: inline-block;
      width: 8px;
      height: 15px;
      background-color: #58a6ff;
      vertical-align: middle;
      margin-left: 4px;
      animation: blink 1s step-end infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="ascii-banner">
  ___ ___  ___   ___ ___  _  _ _____ ___  ___  _     
 /   \\   \\/ __| / __/ _ \\| \\| |_   _| _ \\/ _ \\| |    
| - | |) \\__ \\| (_| (_) | .\` | | | |   / (_) | |__  
|_|_/___/|___/ \\___\\___/|_|\\_| |_| |_|_\\\\___/|____| 
                                                     </div>

  <div class="line">
    <span class="prompt">server@ads-control</span>:<span class="path">~</span>$ ./api-daemon --status
  </div>

  <div class="line text-green" style="margin-top: 0.5rem;">
    [OK] System operational. Daemon listening on 0.0.0.0:${port} (${env})
  </div>

  <div class="divider"></div>

  <!-- System Info -->
  <div class="line"><span class="text-muted">&bull; runtime:</span> <span class="text-white">${metrics.nodeVersion} (NestJS Core)</span></div>
  <div class="line"><span class="text-muted">&bull; uptime:</span> <span class="text-white" id="uptime-val">${Math.floor(metrics.uptimeSec / 60)}m ${metrics.uptimeSec % 60}s</span> &nbsp;|&nbsp; <span class="text-muted">memory:</span> <span class="text-white" id="memory-val">${metrics.memoryHeapMb} MB</span></div>
  <div class="line"><span class="text-muted">&bull; database:</span> <span class="text-green">connected</span> (Supabase PostgreSQL Pooler)</div>
  <div class="line"><span class="text-muted">&bull; meta_api:</span> <span class="text-blue">authenticated</span> (Graph API ${metaGraphVersion} Gateway)</div>
  <div class="line"><span class="text-muted">&bull; realtime:</span> <span class="text-purple">active</span> (/api/v1/realtime/stream)</div>

  <div class="divider"></div>

  <!-- Endpoints & Quick Links -->
  <div class="line"><span class="text-muted">&bull; swagger_docs:</span> <a href="/api/docs" target="_blank" class="term-link">/api/docs</a></div>
  <div class="line"><span class="text-muted">&bull; web_frontend:</span> <a href="https://metabull-ads-budget-managment-git-main-designwithtanishk.vercel.app" target="_blank" class="term-link">https://metabull-ads-budget-managment...vercel.app</a></div>
  <div class="line"><span class="text-muted">&bull; total_requests:</span> <span class="text-white" id="requests-val">${metrics.totalRequests}</span> &nbsp;|&nbsp; <span class="text-muted">avg_latency:</span> <span class="text-white" id="latency-val">${metrics.avgLatencyMs}ms</span></div>

  <div class="divider"></div>

  <div class="line text-muted" style="margin-bottom: 0.5rem;">
    # Live HTTP Telemetry Stream (tail -f access.log)
  </div>

  <!-- Telemetry Stream Rows -->
  <div id="logs-container" class="log-stream">
    ${metrics.records.length > 0 ? metrics.records.map(r => `
      <div class="log-row">
        <span class="log-time">[${r.timestamp}]</span>
        <span class="log-method method-${r.method.toLowerCase()}">${r.method}</span>
        <span class="log-path">${r.path}</span>
        <span class="log-status status-${r.statusCode < 300 ? '2xx' : r.statusCode < 500 ? '4xx' : '5xx'}">${r.statusCode}</span>
        <span class="log-lat">${r.durationMs}ms</span>
      </div>
    `).join('') : `
      <div class="log-row text-muted">
        <span>[--:--:--]</span>
        <span style="font-style: italic;">Awaiting incoming HTTP requests...</span>
      </div>
    `}
  </div>

  <div class="line" style="margin-top: 1.25rem;">
    <span class="prompt">server@ads-control</span>:<span class="path">~</span>$ <span class="cursor"></span>
  </div>

  <script>
    let uptimeSeconds = ${metrics.uptimeSec};

    // Live Uptime Clock
    setInterval(() => {
      uptimeSeconds++;
      const m = Math.floor(uptimeSeconds / 60);
      const s = uptimeSeconds % 60;
      const h = Math.floor(m / 60);
      const mins = m % 60;
      const el = document.getElementById('uptime-val');
      if (el) {
        el.innerText = h > 0 ? h + 'h ' + mins + 'm ' + s + 's' : mins + 'm ' + s + 's';
      }
    }, 1000);

    // Live Log Stream Polling (every 2s)
    async function updateStream() {
      try {
        const res = await fetch('/api/telemetry/data');
        if (res.ok) {
          const data = await res.json();
          const reqEl = document.getElementById('requests-val');
          const latEl = document.getElementById('latency-val');
          const memEl = document.getElementById('memory-val');
          const logEl = document.getElementById('logs-container');

          if (reqEl) reqEl.innerText = data.totalRequests;
          if (latEl) latEl.innerText = data.avgLatencyMs + 'ms';
          if (memEl) memEl.innerText = data.memoryHeapMb + ' MB';

          if (logEl && data.records && data.records.length > 0) {
            logEl.innerHTML = data.records.map(function(r) {
              var statusClass = r.statusCode < 300 ? 'status-2xx' : (r.statusCode < 500 ? 'status-4xx' : 'status-5xx');
              return '<div class="log-row">' +
                '<span class="log-time">[' + r.timestamp + ']</span>' +
                '<span class="log-method method-' + r.method.toLowerCase() + '">' + r.method + '</span>' +
                '<span class="log-path">' + r.path + '</span>' +
                '<span class="log-status ' + statusClass + '">' + r.statusCode + '</span>' +
                '<span class="log-lat">' + r.durationMs + 'ms</span>' +
              '</div>';
            }).join('');
          }
        }
      } catch (err) {}
    }

    setInterval(updateStream, 2000);
  </script>
</body>
</html>`;

    return res.send(html);
  }
}
