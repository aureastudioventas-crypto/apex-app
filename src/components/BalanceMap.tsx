/**
 * APEX TUNING ENGINE — FH5
 * MAPA DINÁMICO DE BALANCE DE CHASIS (Dynamic Balance Vector)
 */

import React from 'react';
import { VehicleBalance } from '../types';

interface BalanceMapProps {
  balance: VehicleBalance;
  comparisonBalance?: VehicleBalance;
  comparisonLabel?: string;
  size?: number;
}

export const BalanceMap: React.FC<BalanceMapProps> = ({
  balance,
  comparisonBalance,
  comparisonLabel = 'Baseline',
  size = 280,
}) => {
  const center = size / 2;
  const radius = size * 0.42;

  // Transform coordinates (-50 to +50) to SVG canvas pixels
  // Note: Y in SVG is down, so +Y (Grip) should go UP (minus in SVG)
  const currentX = center + (balance.coordinates.x / 50) * radius;
  const currentY = center - (balance.coordinates.y / 50) * radius;

  let compX = center;
  let compY = center;
  if (comparisonBalance) {
    compX = center + (comparisonBalance.coordinates.x / 50) * radius;
    compY = center - (comparisonBalance.coordinates.y / 50) * radius;
  }

  // Interpret tendency
  let tendencyText = 'Chasis Neutro Equilibrado';
  if (balance.coordinates.x < -15) {
    tendencyText = 'Tendencia Subviradora (Segura / Estable)';
  } else if (balance.coordinates.x > 15) {
    tendencyText = 'Tendencia Sobreviradora (Ágil / Rotación)';
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h4 className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
            VECTOR DE BALANCE DINÁMICO
          </h4>
          <p className="text-[11px] text-slate-400 font-sans">
            Comportamiento en régimen transitorio y sostenido
          </p>
        </div>
        <div className="font-mono text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
          X: {balance.coordinates.x > 0 ? `+${balance.coordinates.x}` : balance.coordinates.x} | Y:{' '}
          {balance.coordinates.y > 0 ? `+${balance.coordinates.y}` : balance.coordinates.y}
        </div>
      </div>

      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="bg-slate-950 rounded-lg border border-slate-800/80 shadow-inner"
        >
          {/* Concentric telemetry circles */}
          {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius * ratio}
              fill="none"
              stroke="#1e293b"
              strokeDasharray={idx === 1 ? '3 3' : undefined}
              strokeWidth="1"
            />
          ))}

          {/* Central crosshairs */}
          <line
            x1={center - radius}
            y1={center}
            x2={center + radius}
            y2={center}
            stroke="#334155"
            strokeWidth="1.2"
          />
          <line
            x1={center}
            y1={center - radius}
            x2={center}
            y2={center + radius}
            stroke="#334155"
            strokeWidth="1.2"
          />

          {/* Axis Labels */}
          <text
            x={center}
            y={center - radius + 12}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            + GRIP MECÁNICO
          </text>
          <text
            x={center}
            y={center + radius - 6}
            textAnchor="middle"
            fill="#64748b"
            fontSize="9"
            fontFamily="monospace"
          >
            - ABSORCIÓN
          </text>
          <text
            x={center - radius + 10}
            y={center - 5}
            textAnchor="start"
            fill="#94a3b8"
            fontSize="9"
            fontFamily="monospace"
          >
            SUBVIRAJE
          </text>
          <text
            x={center + radius - 10}
            y={center - 5}
            textAnchor="end"
            fill="#94a3b8"
            fontSize="9"
            fontFamily="monospace"
          >
            SOBREVIRAJE
          </text>

          {/* Evolution Vector from comparison point if available */}
          {comparisonBalance && (
            <>
              <line
                x1={compX}
                y1={compY}
                x2={currentX}
                y2={currentY}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* Ghost circle for comparison */}
              <circle
                cx={compX}
                cy={compY}
                r="4"
                fill="#475569"
                stroke="#64748b"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* Pulsing radar ring */}
          <circle
            cx={currentX}
            cy={currentY}
            r="10"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="1"
            opacity="0.6"
            className="animate-ping"
          />

          {/* Current point */}
          <circle
            cx={currentX}
            cy={currentY}
            r="6"
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="2"
            className="filter drop-shadow-md"
          />
        </svg>
      </div>

      <div className="w-full mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="font-mono text-slate-400">TENDENCIA ACTUAL:</span>
        <span className="font-mono font-bold text-cyan-300">{tendencyText}</span>
      </div>

      {comparisonBalance && (
        <div className="w-full mt-1.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />
            {comparisonLabel}
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
            Versión Actual
          </span>
        </div>
      )}
    </div>
  );
};
