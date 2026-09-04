/**
 * APEX TUNING ENGINE — FH5
 * PÁGINA DE HISTORIAL DE VERSIONES & COMPARADOR DE EVOLUCIÓN
 */

import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  GitCompare,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Vehicle, Tune, TuneVersionHistoryItem } from '../types';
import { BalanceMap } from '../components/BalanceMap';

interface HistoryPageProps {
  vehicle: Vehicle;
  currentTune: Tune;
  historyItems: TuneVersionHistoryItem[];
  onRevertToVersion: (historyItem: TuneVersionHistoryItem) => void;
  onNavigateTab: (tab: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  vehicle,
  currentTune,
  historyItems,
  onRevertToVersion,
  onNavigateTab,
}) => {
  const [selectedVersionAId, setSelectedVersionAId] = useState<string>(
    historyItems[0]?.id || ''
  );
  const [selectedVersionBId, setSelectedVersionBId] = useState<string>(
    historyItems[1]?.id || historyItems[0]?.id || ''
  );

  const versionA = historyItems.find((h) => h.id === selectedVersionAId) || historyItems[0];
  const versionB = historyItems.find((h) => h.id === selectedVersionBId) || historyItems[1] || historyItems[0];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs bg-slate-800 text-cyan-400 font-bold px-2 py-0.5 rounded border border-slate-700">
                {vehicle.carClass} {vehicle.pi}
              </span>
              <span className="font-mono text-xs text-slate-300 font-bold">
                {vehicle.drivetrain}
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-xs text-slate-400">
                HISTORIAL DE REGLAJES
              </span>
            </div>
            <h2 className="font-['Chakra_Petch'] text-2xl font-bold text-white mt-1">
              EVOLUCIÓN & CONTROL DE VERSIONES
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Registro inmutable de reglajes, motivos físicos de cada cambio y comparador A/B para {vehicle.make} {vehicle.model}.
            </p>
          </div>

          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs">
            <span className="text-slate-500 block text-[10px]">VERSIÓN EN PISTA ACTUAL:</span>
            <span className="text-cyan-300 font-bold">{currentTune.versionTag}</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Module */}
      {historyItems.length > 1 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-cyan-400" />
              <h3 className="font-mono text-sm font-bold text-white uppercase">
                COMPARADOR TÉCNICO A / B DE REGLAJES
              </h3>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">A:</span>
                <select
                  value={selectedVersionAId}
                  onChange={(e) => setSelectedVersionAId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                >
                  {historyItems.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.versionName}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-600">vs</span>

              <div className="flex items-center gap-1.5">
                <span className="text-cyan-400 font-bold">B:</span>
                <select
                  value={selectedVersionBId}
                  onChange={(e) => setSelectedVersionBId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                >
                  {historyItems.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.versionName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {versionA && versionB && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Dynamic Balance Evolution Map */}
              <div className="lg:col-span-5">
                <BalanceMap
                  balance={versionB.balanceSnapshot}
                  comparisonBalance={versionA.balanceSnapshot}
                  comparisonLabel={versionA.versionName}
                />
              </div>

              {/* Parameter Deltas Comparison Grid */}
              <div className="lg:col-span-7 bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 font-mono text-xs overflow-x-auto">
                <h4 className="text-slate-300 font-bold uppercase mb-2">
                  DELTAS Y DIFERENCIAS PARAMÉTRICAS:
                </h4>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800 text-[10px]">
                      <th className="pb-2">COMPONENTE</th>
                      <th className="pb-2 text-center">VERSIÓN A</th>
                      <th className="pb-2 text-center">VERSIÓN B</th>
                      <th className="pb-2 text-right">DELTA (B - A)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {Object.keys(versionB.parameterSnapshots || {}).map((paramKey) => {
                      const valA = versionA.parameterSnapshots[paramKey];
                      const valB = versionB.parameterSnapshots[paramKey];
                      if (valA === undefined || valB === undefined) return null;

                      const delta = Number((valB - valA).toFixed(2));
                      const hasChanged = delta !== 0;

                      return (
                        <tr
                          key={paramKey}
                          className={hasChanged ? 'bg-cyan-950/20 text-white' : 'text-slate-400'}
                        >
                          <td className="py-2 capitalize">
                            {paramKey.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2 text-center">{valA}</td>
                          <td className="py-2 text-center font-bold text-cyan-300">
                            {valB}
                          </td>
                          <td className="py-2 text-right font-bold">
                            {hasChanged ? (
                              <span
                                className={delta > 0 ? 'text-cyan-400' : 'text-amber-400'}
                              >
                                {delta > 0 ? `+${delta}` : delta}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Version Timeline */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span>LÍNEA TEMPORAL DE VERSIONES REGISTRADAS ({historyItems.length})</span>
        </h3>

        <div className="space-y-4">
          {historyItems.map((item, idx) => {
            const isCurrent = currentTune.versionTag === item.versionName || currentTune.versionTag === item.versionTag;
            const isDemo = item.versionTag?.includes('DEMO') || item.versionName?.includes('DEMO');
            return (
              <div
                key={item.id}
                className={`bg-slate-950 rounded-xl p-4.5 border transition-all ${
                  isCurrent
                    ? 'border-cyan-500 ring-1 ring-cyan-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-black bg-slate-800 text-cyan-400 px-2 py-0.5 rounded border border-slate-700">
                      #{item.versionNumber}
                    </span>
                    <h4 className="font-mono text-sm font-bold text-white">
                      {item.versionName}
                    </h4>
                    {isCurrent && (
                      <span className="font-mono text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                        EN PISTA
                      </span>
                    )}
                    {isDemo && (
                      <span className="font-mono text-[10px] bg-amber-950/70 text-amber-300 px-2 py-0.5 rounded border border-amber-800/60 font-semibold">
                        DEMO / BASELINE EXPERIMENTAL
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.date}
                    </span>
                    <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded">
                      Grip: {item.balanceSnapshot.grip} | Rot: {item.balanceSnapshot.rotation}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="font-sans text-slate-300">
                    <strong className="font-mono text-slate-400 uppercase text-[11px] block">
                      MOTIVO DE INGENIERÍA:
                    </strong>
                    {item.engineeringReason}
                  </div>

                  {item.changesSummary && item.changesSummary.length > 0 && (
                    <div className="pt-2">
                      <span className="font-mono text-slate-500 text-[10px] uppercase block">
                        MODIFICACIONES INTRODUCIDAS:
                      </span>
                      <ul className="list-disc list-inside text-slate-400 text-[11px] font-mono mt-1 space-y-0.5">
                        {item.changesSummary.map((ch, cIdx) => (
                          <li key={cIdx}>{ch}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-850 flex justify-end gap-2 font-mono text-xs">
                  {!isCurrent && (
                    <button
                      onClick={() => onRevertToVersion(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Revertir a esta Versión</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
