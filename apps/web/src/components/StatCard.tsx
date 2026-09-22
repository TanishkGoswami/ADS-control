import React from 'react';
import { cn } from '../lib/utils';
import { InfoTooltip } from './InfoTooltip';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendPositive?: boolean;
  glow?: 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo';
  statusBadge?: string;
  statusColor?: string;
  infoTooltip?: string;
  hinglishHelp?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  glow = 'blue',
  statusBadge,
  statusColor,
  infoTooltip,
  hinglishHelp
}) => {
  const iconBgClasses = {
    blue: 'bg-blue-50 text-[#0064e0]',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    indigo: 'bg-blue-50 text-[#0064e0]'
  };

  return (
    <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-sm p-3.5 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1">
            <p className="text-[10px] font-bold text-[#64748b] tracking-wider uppercase font-mono">{title}</p>
            {infoTooltip && (
              <InfoTooltip
                title={title}
                text={infoTooltip}
                hinglishHelp={hinglishHelp}
                side="top"
              />
            )}
          </div>
          <h3 className="text-lg font-bold text-[#0a1317] mt-1 font-mono">{value}</h3>
        </div>
        <div className={cn('p-1.5 rounded-[5px]', iconBgClasses[glow])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {(subtitle || trend || statusBadge) && (
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] pt-2">
          {subtitle && <span className="text-[#64748b] truncate">{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                'font-mono font-bold text-[10px]',
                trendPositive ? 'text-emerald-700' : 'text-rose-700'
              )}
            >
              {trend}
            </span>
          )}
          {statusBadge && (
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-[5px] text-[9px] font-semibold',
                statusColor || 'bg-[#f1f4f7] text-[#475569]'
              )}
            >
              {statusBadge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
