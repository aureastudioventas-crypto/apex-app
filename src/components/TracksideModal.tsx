/**
 * APEX TUNING ENGINE — FH5
 * MODO PISTA RÁPIDO (Trackside Mode)
 * Interfaz de alta legibilidad para consultar valores y diagnosticar mientras juegas en FH5
 */

import React, { useState } from 'react';
import { X, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Vehicle, Tune } from '../types';

interface TracksideModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVehicle: Vehicle | null;
  activeTune: Tune | null;
  onApplyQuickFix?: (paramKey: string, newValue: number) => void;
}

export const TracksideModal: React.FC<TracksideModalProps> = ({
  isOpen,
  onClose,
  activeVehicle,
  activeTune,
  onApplyQuickFix,
}) => {
  const [selectedQuickSymptom, setSelectedQuickSymptom] = useState<string | null>(null);

  if (!isOpen || !activeVehicle || !activeTune) return null;

  const params = activeTune.parameters;

  const quickSymptoms = [
    {
      id: 'subvira_curva',
      label: 'Subvira a mitad de curva',
      fixParam: 'arb_front',
      paramName: 'Barra Estabilizadora Delantera',
      currentVal: params.arb_front?.value ?? 25.0,
      targetVal: Math.max(1.0, Number(((params.arb_front?.value ?? 25.0) - 3.5).toFixed(1))),
      action: 'Bajar 3.5 puntos la barra delantera',
    },
    {
      id: 'sobrevira_cola',
      label: 'Se va de cola / trompo',
      fixParam: 'arb_rear',
      paramName: 'Barra Estabilizadora Trasera',
      currentVal: params.arb_rear?.value ?? 30.0,
      targetVal: Math.max(1.0, Number(((params.arb_rear?.value ?? 30.0) - 4.0).toFixed(1))),
      action: 'Bajar 4.0 puntos la barra trasera',
    },
    {
      id: 'subvira_salida',
      label: 'Subvira al acelerar a fondo',
      fixParam: 'diff_center_balance',
      paramName: 'Reparto Central AWD',
      currentVal: params.diff_center_balance?.value ?? 68,
      targetVal: Math.min(80, (params.diff_center_balance?.value ?? 68) + 6),
      action: 'Aumentar +6% potencia al eje trasero',
    },
    {
      id: 'rebota_saltos',
      label: 'Rebota en baches o saltos',
      fixParam: 'rebound_front',
      paramName: 'Extensión Delantera (Rebound)',
      currentVal: params.rebound_front?.value ?? 10.0,
      targetVal: Math.max(3.0, Number(((params.rebound_front?.value ?? 10.0) - 1.5).toFixed(1))),
      action: 'Suavizar Rebound delantero 1.5 puntos',
    },
  ];

  const activeFix = quickSymptoms.find((s) => s.id === selectedQuickSymptom);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Trackside Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider">
                MODO PISTA RÁPIDO (TRACKSIDE)
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Lectura directa de valores clave de FH5 para ingresar en el menú del juego
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle Badge */}
        <div className="bg-slate-950/60 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="text-slate-300 font-bold">
            {activeVehicle.make} {activeVehicle.model} ({activeVehicle.drivetrain})
          </div>
          <div className="text-amber-400 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
            {activeTune.discipline} — {activeTune.versionTag}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Quick Glancing Telemetry Grid */}
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">
              VALORES PRINCIPALES DE REGLAJE EN FH5:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">PRESIÓN DEL/TRAS</span>
                <span className="text-base font-black text-white">
                  {params.tire_pressure_front?.value} / {params.tire_pressure_rear?.value}
                </span>
                <span className="text-[10px] text-slate-500 block">psi</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">ARB DEL/TRAS</span>
                <span className="text-base font-black text-cyan-300">
                  {params.arb_front?.value} / {params.arb_rear?.value}
                </span>
                <span className="text-[10px] text-slate-500 block">1.0 - 65.0</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">CAMBER DEL/TRAS</span>
                <span className="text-base font-black text-sky-300">
                  {params.camber_front?.value}° / {params.camber_rear?.value}°
                </span>
                <span className="text-[10px] text-slate-500 block">grados</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">DIF. REPARTO/ACEL</span>
                <span className="text-base font-black text-emerald-300">
                  {params.diff_center_balance ? `${params.diff_center_balance.value}% | ` : ''}
                  {params.diff_rear_accel?.value}%
                </span>
                <span className="text-[10px] text-slate-500 block">bloqueo</span>
              </div>
            </div>
          </div>

          {/* Quick In-Game Symptom Fixer */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-mono font-bold text-amber-300 uppercase mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>¿QUÉ SIENTES AHORA MISMO EN PISTA? (DIAGNÓSTICO EN 1 CLIC)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickSymptoms.map((s) => {
                const isSelected = selectedQuickSymptom === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedQuickSymptom(s.id)}
                    className={`p-2.5 rounded-lg border text-left font-mono text-xs transition-all ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500/70 text-amber-200'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{s.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                      {s.action}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Fix Details */}
            {activeFix && (
              <div className="mt-3 bg-amber-950/30 border border-amber-500/40 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-amber-300 font-bold uppercase">
                    INTERVENCIÓN ÚNICA RECOMENDADA:
                  </span>
                  <span className="bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded text-[10px]">
                    1 SOLA MODIFICACIÓN
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-300 font-bold block">{activeFix.paramName}</span>
                    <span className="text-[11px] text-slate-400">
                      Actual: {activeFix.currentVal} → Recomendado: {activeFix.targetVal}
                    </span>
                  </div>
                  {onApplyQuickFix && (
                    <button
                      onClick={() => {
                        onApplyQuickFix(activeFix.fixParam, activeFix.targetVal);
                        setSelectedQuickSymptom(null);
                      }}
                      className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>Aplicar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-2">
                  * Regla de ingeniería: Realiza otra prueba antes de aplicar otra modificación en muelles o amortiguación.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold"
          >
            Volver a la Consola Completa
          </button>
        </div>
      </div>
    </div>
  );
};
