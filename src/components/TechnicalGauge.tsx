/**
 * APEX TUNING ENGINE — FH5
 * GAUGE TÉCNICO DE TELEMETRÍA (0 - 100)
 */

import React from 'react';

interface TechnicalGaugeProps {
  id?: string;
  label: string;
  value: number; // 0 to 100
  sublabel?: string;
  category?: 'GRIP' | 'ROTACION' | 'ESTABILIDAD' | 'TRACCION' | 'GENERIC';
}

export const TechnicalGauge: React.FC<TechnicalGaugeProps> = ({
  id,
  label,
  value,
  sublabel,
  category = 'GENERIC',
}) => {
  // Color palette according to engineering guidelines:
  // Titanium / Slate, Electric Blue / Cyan, Red only for critical alerts
  let accentColor = 'bg-cyan-400';
  let barBorder = 'border-cyan-500/40';
  let badgeColor = 'text-cyan-300';

  if (category === 'ROTACION') {
    accentColor = 'bg-sky-400';
    badgeColor = 'text-sky-300';
  } else if (category === 'ESTABILIDAD') {
    accentColor = 'bg-teal-400';
    badgeColor = 'text-teal-300';
  } else if (category === 'TRACCION') {
    accentColor = 'bg-emerald-400';
    badgeColor = 'text-emerald-300';
  }

  // Warning state if value is extreme
  const isExtremeLow = value < 30;
  const isExtremeHigh = value > 95;
  if (isExtremeLow || isExtremeHigh) {
    // Red indicator for extreme warnings
    accentColor = 'bg-rose-500';
    badgeColor = 'text-rose-400';
  }

  return (
    <div id={id} className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs font-bold text-slate-300 tracking-wider uppercase">
            {label}
          </span>
          {sublabel && (
            <p className="text-[11px] text-slate-500 font-sans">{sublabel}</p>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`font-mono text-xl font-black ${badgeColor}`}>
            {value}
          </span>
          <span className="font-mono text-[10px] text-slate-500">/100</span>
        </div>
      </div>

      {/* Precision Progress Bar with tick marks at 25, 50, 75 */}
      <div className="relative w-full h-3 bg-slate-950 rounded border border-slate-800 overflow-hidden">
        {/* Fill bar */}
        <div
          className={`h-full ${accentColor} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />

        {/* Tick markers */}
        <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
          <span className="w-px h-full bg-slate-700/50" style={{ left: '25%' }} />
          <span className="w-px h-full bg-slate-600" style={{ left: '50%' }} />
          <span className="w-px h-full bg-slate-700/50" style={{ left: '75%' }} />
        </div>
      </div>

      {/* Axis markers */}
      <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
        <span>0</span>
        <span>25</span>
        <span className="text-slate-400">50 (NEUTRO)</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
};
