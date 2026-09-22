import React from 'react';
import { cn } from '../lib/utils';
import { InfoTooltip } from './InfoTooltip';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  glow?: 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo';
  infoTooltip?: string;
  hinglishHelp?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  glow = 'blue',
  infoTooltip,
  hinglishHelp
}) => {
  const iconBgClasses = {
    blue: 'bg-blue-50 text-[#0064e0] border border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    indigo: 'bg-blue-50 text-[#0064e0] border border-blue-200'
  };

  return (
    <div className="meta-card p-3.5 flex items-center justify-between transition-colors shadow-xs">
      <div>
        <div className="flex items-center gap-1">
          <p className="text-[10px] font-bold text-[#5d6c7b] tracking-wider uppercase font-mono">{title}</p>
          {infoTooltip && (
            <InfoTooltip
              title={title}
              text={infoTooltip}
              hinglishHelp={hinglishHelp}
              side="top"
            />
          )}
        </div>
        <h3 className="text-xl font-bold text-[#1c1e21] mt-1 font-mono tracking-tight">{value}</h3>
      </div>
      <div className={cn('p-2 rounded-[5px]', iconBgClasses[glow])}>
        <Icon className="w-4.5 h-4.5" />
      </div>
    </div>
  );
};
