/**
 * APEX TUNING ENGINE — FH5
 * PÁGINA DE TEST EN PISTA & DIAGNÓSTICO DE COMPORTAMIENTO
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Gauge,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { Vehicle, Tune, TestSession, DiagnosisResult } from '../types';
import { diagnoseTestSession } from '../engine/diagnosisEngine';
import { calculateVehicleBalance } from '../engine/baselineEngine';

interface TestDiagnosisPageProps {
  vehicle: Vehicle;
  tune: Tune;
  onUpdateTune: (updatedTune: Tune) => void;
  onSaveNewVersion: (tune: Tune, versionName: string, notes: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const TestDiagnosisPage: React.FC<TestDiagnosisPageProps> = ({
  vehicle,
  tune,
  onUpdateTune,
  onSaveNewVersion,
  onNavigateTab,
}) => {
  const [trackName, setTrackName] = useState<string>('Circuito Horizon de México');
  const [surface, setSurface] = useState<TestSession['surface']>('Asfalto liso');
  const [conditions, setConditions] = useState<TestSession['conditions']>('Seco');
  const [approxSpeed, setApproxSpeed] = useState<TestSession['approxSpeed']>('Media');

  // Symptoms state
  const [symptoms, setSymptoms] = useState<TestSession['symptoms']>({
    midCorner: 'Subviraje',
    cornerEntry: 'Estable',
    cornerExit: 'Estable',
    braking: 'Estable',
    suspension: 'Estable',
    straight: 'Estable',
  });

  const [pilotNotes, setPilotNotes] = useState<string>('');
  const [diagnosisResults, setDiagnosisResults] = useState<DiagnosisResult[] | null>(null);
  const [appliedIntervention, setAppliedIntervention] = useState<string | null>(null);

  const handleRunDiagnosis = () => {
    const session: TestSession = {
      id: `session-${Date.now()}`,
      tuneId: tune.id,
      vehicleId: vehicle.id,
      date: new Date().toISOString(),
      discipline: tune.discipline,
      trackName,
      surface,
      conditions,
      approxSpeed,
      symptoms,
      pilotNotes,
    };

    const results = diagnoseTestSession(session, tune);
    setDiagnosisResults(results);
    setAppliedIntervention(null);
  };

  const handleApplyIntervention = (diag: DiagnosisResult) => {
    const intervention = diag.primaryIntervention;
    if (intervention.parameterKey === 'none') return;

    const updatedParams = { ...tune.parameters };
    if (updatedParams[intervention.parameterKey]) {
      updatedParams[intervention.parameterKey] = {
        ...updatedParams[intervention.parameterKey],
        value: intervention.recommendedValue,
      };

      const newBalance = calculateVehicleBalance(updatedParams, vehicle, tune.discipline);
      const nextVersionNum = Number((tune.version + 0.1).toFixed(1));
      const versionName = `v${nextVersionNum} (Post-Test: ${diag.zone})`;

      const updatedTune: Tune = {
        ...tune,
        version: nextVersionNum,
        versionTag: versionName,
        parameters: updatedParams,
        balance: newBalance,
        notes: `Ajuste correctivo tras test en ${trackName}: ${intervention.actionInstruction}`,
        updatedAt: new Date().toISOString(),
      };

      onUpdateTune(updatedTune);
      onSaveNewVersion(
        updatedTune,
        versionName,
        `Intervención primaria aplicada: ${intervention.actionInstruction}. Razón: ${intervention.explanation}`
      );
      setAppliedIntervention(intervention.parameterKey);
    }
  };

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
              <span className="font-mono text-xs text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
                {tune.discipline}
              </span>
            </div>
            <h2 className="font-['Chakra_Petch'] text-2xl font-bold text-white mt-1">
              SESIÓN DE TEST EN PISTA & DIAGNÓSTICO DINÁMICO
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Registra el comportamiento observado al volante de {vehicle.make} {vehicle.model} para identificar causas y aplicar una única intervención correctiva.
            </p>
          </div>

          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs">
            <span className="text-slate-500 block text-[10px]">REGLAJE PROBADO:</span>
            <span className="text-cyan-300 font-bold">{tune.name} ({tune.versionTag})</span>
          </div>
        </div>
      </div>

      {/* Test Conditions Setup */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>1. CONDICIONES DEL TRAZADO Y PRUEBA</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Nombre del Circuito / Tramo</label>
            <input
              type="text"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Superficie</label>
            <select
              value={surface}
              onChange={(e) => setSurface(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            >
              <option value="Asfalto liso">Asfalto liso</option>
              <option value="Asfalto irregular">Asfalto irregular</option>
              <option value="Tierra suelta">Tierra suelta / Grava</option>
              <option value="Barro">Barro</option>
              <option value="Arena">Arena</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Climatología</label>
            <select
              value={conditions}
              onChange={(e) => setConditions(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            >
              <option value="Seco">Seco</option>
              <option value="Húmedo">Húmedo</option>
              <option value="Lluvia">Lluvia</option>
              <option value="Tormenta">Tormenta</option>
              <option value="Caluroso">Caluroso</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Velocidad de Curva Crítica</label>
            <select
              value={approxSpeed}
              onChange={(e) => setApproxSpeed(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            >
              <option value="Baja">Baja (&lt; 90 km/h - Mecánico)</option>
              <option value="Media">Media (90 - 150 km/h)</option>
              <option value="Alta">Alta (&gt; 150 km/h - Aerodinámico)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Symptom Logger Form (6 Sector Zones) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
            <span>2. COMPORTAMIENTO OBSERVADO POR ZONAS (SÍNTOMAS)</span>
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Indica con exactitud en qué sector de la curva o fase dinámica el vehículo manifiesta desequilibrio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {/* Zona 1: Entrada */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-bold block mb-2">
              A. ENTRADA EN CURVA (Turn-in / Inserción)
            </span>
            <div className="space-y-1.5">
              {['Estable', 'Subviraje', 'Sobreviraje', 'Nervioso'].map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white">
                  <input
                    type="radio"
                    name="entry"
                    checked={symptoms.cornerEntry === val}
                    onChange={() => setSymptoms({ ...symptoms, cornerEntry: val as any })}
                    className="accent-cyan-400"
                  />
                  <span>{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Zona 2: Mitad de curva */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-bold block mb-2">
              B. MITAD DE CURVA (Vértice / Apoyo lateral)
            </span>
            <div className="space-y-1.5">
              {['Estable', 'Subviraje', 'Sobreviraje'].map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white">
                  <input
                    type="radio"
                    name="mid"
                    checked={symptoms.midCorner === val}
                    onChange={() => setSymptoms({ ...symptoms, midCorner: val as any })}
                    className="accent-cyan-400"
                  />
                  <span>{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Zona 3: Salida con acelerador */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-bold block mb-2">
              C. SALIDA DE CURVA (Aceleración / Gas a fondo)
            </span>
            <div className="space-y-1.5">
              {['Estable', 'Subviraje', 'Power oversteer', 'Wheelspin'].map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white">
                  <input
                    type="radio"
                    name="exit"
                    checked={symptoms.cornerExit === val}
                    onChange={() => setSymptoms({ ...symptoms, cornerExit: val as any })}
                    className="accent-cyan-400"
                  />
                  <span>{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Zona 4: Frenada */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-bold block mb-2">
              D. FRENADA (En línea recta o apoyando)
            </span>
            <div className="space-y-1.5">
              {['Estable', 'Se va de frente', 'Se mueve de atrás', 'No gira'].map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white">
                  <input
                    type="radio"
                    name="brake"
                    checked={symptoms.braking === val}
                    onChange={() => setSymptoms({ ...symptoms, braking: val as any })}
                    className="accent-cyan-400"
                  />
                  <span>{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Zona 5: Suspensión / Baches */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-bold block mb-2">
              E. SUSPENSIÓN (Baches, pianos y saltos)
            </span>
            <div className="space-y-1.5">
              {['Estable', 'Rebota', 'Toca fondo', 'Demasiado rígido'].map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white">
                  <input
                    type="radio"
                    name="susp"
                    checked={symptoms.suspension === val}
                    onChange={() => setSymptoms({ ...symptoms, suspension: val as any })}
                    className="accent-cyan-400"
                  />
                  <span>{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Zona 6: Rectas a fondo */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-bold block mb-2">
              F. LÍNEA RECTA (Alta velocidad &gt; 220 km/h)
            </span>
            <div className="space-y-1.5">
              {['Estable', 'Nervioso', 'Lento'].map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white">
                  <input
                    type="radio"
                    name="straight"
                    checked={symptoms.straight === val}
                    onChange={() => setSymptoms({ ...symptoms, straight: val as any })}
                    className="accent-cyan-400"
                  />
                  <span>{val}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-slate-400 font-mono text-xs mb-1">
            Comentarios o sensaciones adicionales del piloto:
          </label>
          <input
            type="text"
            value={pilotNotes}
            onChange={(e) => setPilotNotes(e.target.value)}
            placeholder="e.g. En la curva 3 de 4ta marcha el coche se abrió demasiado hacia la grava..."
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono text-xs"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            id="btn-run-diagnosis"
            onClick={handleRunDiagnosis}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            <Activity className="w-4 h-4" />
            <span>EJECUTAR DIAGNÓSTICO DE INGENIERÍA</span>
          </button>
        </div>
      </div>

      {/* DIAGNOSIS RESULTS DISPLAY */}
      {diagnosisResults && (
        <div className="space-y-5">
          <div className="bg-slate-950 border border-cyan-500/60 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-sm font-bold text-white uppercase flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <span>INFORME TÉCNICO DE INGENIERÍA DE PISTA</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {diagnosisResults.length} anomalía(s) analizada(s)
              </span>
            </div>
          </div>

          {diagnosisResults.map((diag, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4"
            >
              {/* Analyzed Zone Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded font-bold">
                    SECTOR: {diag.zone}
                  </span>
                  <h4 className="font-mono text-base font-bold text-white mt-1">
                    {diag.symptomAnalyzed}
                  </h4>
                </div>
              </div>

              {/* Probabilistic causes list */}
              <div>
                <h5 className="font-mono text-xs font-bold text-slate-300 uppercase mb-2">
                  PROBABILIDAD DE CAUSAS (MATRIZ DINÁMICA):
                </h5>
                <div className="space-y-2">
                  {diag.possibleCauses.map((cause, cIdx) => (
                    <div
                      key={cIdx}
                      className="bg-slate-950 p-2.5 rounded border border-slate-800 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-200 font-bold">{cause.component}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-20 h-1.5 bg-slate-900 rounded overflow-hidden">
                            <div
                              className="h-full bg-cyan-400"
                              style={{ width: `${cause.probability}%` }}
                            />
                          </div>
                          <span className="text-cyan-400 font-bold">{cause.probability}%</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">{cause.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PRIMARY INTERVENTION CARD (1 SINGLE RECOMMENDATION) */}
              {diag.primaryIntervention && diag.primaryIntervention.parameterKey !== 'none' && (
                <div className="bg-cyan-950/30 border-2 border-cyan-500/80 rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      INTERVENCIÓN PRIMARIA PRIORITARIA ({diag.primaryIntervention.priorityCategory})
                    </span>
                    <span className="font-mono text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-semibold">
                      REGLA DE ORO: 1 SOLA MODIFICACIÓN
                    </span>
                  </div>

                  <div className="bg-slate-950/90 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                    <div>
                      <span className="text-xs text-slate-400 block">PARÁMETRO A AJUSTAR:</span>
                      <span className="text-sm font-bold text-white">
                        {diag.primaryIntervention.parameterName}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">ACTUAL</span>
                        <span className="text-slate-300 font-bold">
                          {diag.primaryIntervention.currentValue} {diag.primaryIntervention.unit}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="text-[10px] text-slate-500 block">RECOMENDADO</span>
                        <span className="text-cyan-300 text-sm font-black">
                          {diag.primaryIntervention.recommendedValue} {diag.primaryIntervention.unit}
                        </span>
                      </div>
                      <span className="font-bold text-cyan-400 bg-cyan-950 px-2 py-1 rounded border border-cyan-800">
                        {diag.primaryIntervention.delta > 0 ? `+${diag.primaryIntervention.delta}` : diag.primaryIntervention.delta}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="text-slate-300 font-sans leading-relaxed">
                      <strong>Por qué de la intervención:</strong> {diag.primaryIntervention.explanation}
                    </p>
                    <p className="text-cyan-300 font-mono text-[11px] font-semibold">
                      <strong>Instrucción para FH5:</strong> {diag.primaryIntervention.actionInstruction}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[11px] text-amber-300/90 font-mono">
                      ⚠️ {diag.nextStepWarning}
                    </span>

                    <button
                      onClick={() => handleApplyIntervention(diag)}
                      disabled={appliedIntervention === diag.primaryIntervention.parameterKey}
                      className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-mono text-xs font-bold transition-all shadow-sm shadow-cyan-500/20 w-fit"
                    >
                      {appliedIntervention === diag.primaryIntervention.parameterKey
                        ? '✓ INTERVENCIÓN APLICADA'
                        : 'APLICAR Y CREAR NUEVA VERSIÓN'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
