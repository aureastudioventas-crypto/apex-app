/**
 * APEX TUNING ENGINE — FH5
 * TARJETA DE PARÁMETRO DE REGLAJE (Parameter Card)
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, AlertTriangle, Lock } from 'lucide-react';
import { TuneParameter } from '../types';

interface ParameterCardProps {
  param: TuneParameter;
  onChangeValue: (key: string, newValue: number) => void;
  isModified?: boolean;
}

export const ParameterCard: React.FC<ParameterCardProps> = ({
  param,
  onChangeValue,
  isModified = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleStep = (direction: 'up' | 'down') => {
    if (!param.isAvailable) return;
    const delta = direction === 'up' ? param.step : -param.step;
    let nextVal = Number((param.value + delta).toFixed(2));
    if (nextVal > param.max) nextVal = param.max;
    if (nextVal < param.min) nextVal = param.min;
    onChangeValue(param.key, nextVal);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!param.isAvailable) return;
    const val = Number(parseFloat(e.target.value).toFixed(2));
    onChangeValue(param.key, val);
  };

  // If part is not installed, render locked state
  if (!param.isAvailable) {
    return (
      <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3.5 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span className="font-mono text-xs font-semibold text-slate-400">
              {param.name}
            </span>
          </div>
          <span className="font-mono text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
            NO INSTALADO / BLOQUEADO
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 font-sans">
          Esta pieza no es ajustable en FH5 con la configuración actual del vehículo. Instala el componente de competición correspondiente en el menú de mejoras para desbloquear este ajuste.
        </p>
      </div>
    );
  }

  // Calculate percentage for progress bar
  const range = param.max - param.min;
  const pct = range > 0 ? Math.min(100, Math.max(0, ((param.value - param.min) / range) * 100)) : 50;

  return (
    <div
      id={`param-card-${param.key}`}
      className={`bg-slate-900/90 border rounded-lg p-3.5 transition-all ${
        isModified ? 'border-cyan-500/80 shadow-sm shadow-cyan-950' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-200">
              {param.name}
            </span>
            {isModified && (
              <span className="font-mono text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded font-semibold">
                MODIFICADO
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5 line-clamp-1">
            {param.target}
          </p>
        </div>

        {/* Readout Value */}
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className="font-mono text-lg font-black text-cyan-300">
              {param.value}
            </span>
            <span className="font-mono text-xs text-slate-400 font-semibold">
              {param.unit}
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            [{param.min} - {param.max}]
          </span>
        </div>
      </div>

      {/* Slider and Step Controls */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => handleStep('down')}
          disabled={param.value <= param.min}
          className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white font-mono font-bold text-sm flex items-center justify-center border border-slate-700 transition-colors"
          title={`Reducir ${param.step}`}
        >
          -
        </button>

        <div className="flex-1 relative">
          <input
            type="range"
            min={param.min}
            max={param.max}
            step={param.step}
            value={param.value}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
          />
          <div
            className="h-1 bg-cyan-500/40 rounded-full pointer-events-none absolute top-0.5 left-0"
            style={{ width: `${pct}%` }}
          />
        </div>

        <button
          onClick={() => handleStep('up')}
          disabled={param.value >= param.max}
          className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white font-mono font-bold text-sm flex items-center justify-center border border-slate-700 transition-colors"
          title={`Aumentar ${param.step}`}
        >
          +
        </button>
      </div>

      {/* Accordion Toggle for Engineering Rationale */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 w-full pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>INGENIERÍA & POR QUÉ</span>
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>

      {/* Detailed Technical Explanation */}
      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-2 text-xs font-sans">
          <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800/80">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              POR QUÉ DE ESTE VALOR BASELINE:
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {param.why}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="font-mono text-[10px] text-cyan-400 font-bold block mb-0.5">
                AL AUMENTAR (+):
              </span>
              <p className="text-slate-400 leading-tight">{param.effectIncrease}</p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="font-mono text-[10px] text-slate-400 font-bold block mb-0.5">
                AL REDUCIR (-):
              </span>
              <p className="text-slate-400 leading-tight">{param.effectDecrease}</p>
            </div>
          </div>

          {param.nextAction && (
            <div className="bg-cyan-950/40 p-2 rounded border border-cyan-800/50 flex items-start gap-1.5 text-[11px]">
              <span className="font-mono text-cyan-400 font-bold whitespace-nowrap">
                ACCIÓN DE PISTA:
              </span>
              <span className="text-slate-300">{param.nextAction}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
