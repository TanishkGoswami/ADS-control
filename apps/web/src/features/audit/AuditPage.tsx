import React, { useState, useEffect } from 'react';
import { History, User, Clock, Download, RefreshCw } from 'lucide-react';
import { exportToCSV } from '../../lib/export';
import { fetchAuditLogsApi, AuditLogDto } from '../../lib/api';
import { formatDateTime } from '@ads-control/shared';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditLogsApi(100);
      setLogs(data);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleExportAudit = () => {
    exportToCSV(
      logs.map((log) => ({
        Action: log.action,
        EntityType: log.entityType,
        EntityId: log.entityId,
        ActorUserId: log.actorUserId || 'SYSTEM',
        NewState: JSON.stringify(log.newState || {}),
        Timestamp: formatDateTime(log.createdAt)
      })),
      'security_audit_trail'
    );
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-[#0a1317] tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-[#0064e0]" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            Cryptographic historical event stream capturing actors, before/after diffs, and financial state changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAuditLogs}
            disabled={isLoading}
            className="meta-btn-ghost flex items-center gap-1.5"
            title="Refresh audit logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportAudit}
            disabled={logs.length === 0}
            className="meta-btn-ghost flex items-center gap-1.5"
            title="Export audit log to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export CSV</span>
          </button>

          <div className="px-2.5 py-1 rounded-none bg-white border border-[#d9e0e8] text-[11px] text-[#64748b] font-mono">
            Events: <span className="font-bold text-[#0064e0]">{logs.length}</span>
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-none border border-[#d9e0e8] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#64748b] font-mono">
            Loading audit event stream...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center space-y-1">
            <div className="text-xs font-bold text-[#0a1317]">No audit events recorded yet</div>
            <p className="text-[11px] text-[#64748b]">
              All user logins, financial transactions, and Meta account operations will be logged here in real-time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#d9e0e8]">
            {logs.map((log) => (
              <div key={log.id} className="p-3 hover:bg-[#f5f6f7] transition-colors space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-none bg-blue-50 text-[#0064e0] border border-blue-200">
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-[#0a1317]">{log.entityType}</span>
                    <span className="text-[10px] font-mono text-[#64748b]">({log.entityId})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#94a3b8] font-mono">
                    <Clock className="w-3 h-3 text-[#94a3b8]" />
                    <span>{formatDateTime(log.createdAt)}</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#334155] leading-tight break-all">
                  {log.newState ? JSON.stringify(log.newState) : 'Event state recorded'}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-[#64748b] pt-0.5 font-mono">
                  <User className="w-2.5 h-2.5 text-[#94a3b8]" />
                  <span>Actor ID: <span className="text-[#0a1317] font-semibold">{log.actorUserId || 'SYSTEM'}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
