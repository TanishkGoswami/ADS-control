import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TelemetryRecord {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip: string;
  userAgent?: string;
}

@Injectable()
export class TelemetryService implements NestMiddleware {
  private static records: TelemetryRecord[] = [];
  private static totalRequests = 0;
  private static startTime = Date.now();

  use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/favicon.ico' || req.path === '/api/telemetry/data') {
      return next();
    }

    const start = performance.now();
    TelemetryService.totalRequests++;

    res.on('finish', () => {
      const durationMs = Math.round((performance.now() - start) * 10) / 10;
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
      
      const record: TelemetryRecord = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs,
        ip: ip.replace(/^::ffff:/, '')
      };

      TelemetryService.records.unshift(record);
      if (TelemetryService.records.length > 50) {
        TelemetryService.records.pop();
      }
    });

    next();
  }

  getMetrics() {
    const memory = process.memoryUsage();
    const uptimeSec = Math.floor((Date.now() - TelemetryService.startTime) / 1000);
    const avgLatency = TelemetryService.records.length > 0
      ? (TelemetryService.records.reduce((acc, r) => acc + r.durationMs, 0) / TelemetryService.records.length).toFixed(1)
      : '0.0';

    return {
      status: 'OPERATIONAL',
      uptimeSec,
      totalRequests: TelemetryService.totalRequests,
      avgLatencyMs: avgLatency,
      memoryHeapMb: (memory.heapUsed / 1024 / 1024).toFixed(1),
      memoryRssMb: (memory.rss / 1024 / 1024).toFixed(1),
      nodeVersion: process.version,
      records: TelemetryService.records
    };
  }
}
