/**
 * APEX TUNING ENGINE — FH5
 * TUNE STUDIO (ESPACIO DE TRABAJO Y AFINACIÓN DE REGLAJES)
 */

import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Save,
  Copy,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Gamepad2,
  Disc,
  Eye,
  Zap,
} from 'lucide-react';
import {
  Vehicle,
  Tune,
  Discipline,
  ParameterCategory,
  DriverProfile,
  HardwareProfile,
  TuneParameter,
} from '../types';
import { DISCIPLINE_PROFILES } from '../engine/matrixKnowledge';
import { generateBaselineTune, calculateVehicleBalance } from '../engine/baselineEngine';
import { BalanceMap } from '../components/BalanceMap';
import { TechnicalGauge } from '../components/TechnicalGauge';
import { ParameterCard } from '../components/ParameterCard';

interface TuneStudioPageProps {
  vehicle: Vehicle;
  tune: Tune;
  onUpdateTune: (updatedTune: Tune) => void;
  onSaveNewVersion: (tune: Tune, versionName: string, notes: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const TuneStudioPage: React.FC<TuneStudioPageProps> = ({
  vehicle,
  tune,
  onUpdateTune,
  onSaveNewVersion,
  onNavigateTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showDriverProfile, setShowDriverProfile] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [versionNameInput, setVersionNameInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Available disciplines
  const disciplines: Discipline[] = [
    'ROAD RACING',
    'STREET SCENE',
    'DIRT',
    'CROSS COUNTRY',
    'DRAG',
    'DRIFT',
  ];

  const categories: { id: string; label: string; cat?: ParameterCategory }[] = [
    { id: 'ALL', label: 'TODOS' },
    { id: 'TIRES', label: 'NEUMÁTICOS', cat: 'TIRES' },
    { id: 'ALIGNMENT', label: 'ALINEACIÓN', cat: 'ALIGNMENT' },
    { id: 'ARB', label: 'BARRAS ARB', cat: 'ARB' },
    { id: 'SPRINGS', label: 'MUELLES Y ALTURA', cat: 'SPRINGS' },
    { id: 'DAMPING', label: 'AMORTIGUACIÓN', cat: 'DAMPING' },
    { id: 'AERO', label: 'AERODINÁMICA', cat: 'AERO' },
    { id: 'BRAKES', label: 'FRENOS', cat: 'BRAKES' },
    { id: 'DIFFERENTIAL', label: 'DIFERENCIAL', cat: 'DIFFERENTIAL' },
    { id: 'GEARING', label: 'TRANSMISIÓN', cat: 'GEARING' },
  ];

  const currentDisciplineInfo = DISCIPLINE_PROFILES[tune.discipline] || DISCIPLINE_PROFILES['ROAD RACING'];

  // Handle parameter value modification
  const handleParameterChange = (paramKey: string, newValue: number) => {
    const updatedParams = { ...tune.parameters };
    if (!updatedParams[paramKey]) return;

    updatedParams[paramKey] = {
      ...updatedParams[paramKey],
      value: newValue,
    };

    // Recalculate balance dynamically
    const newBalance = calculateVehicleBalance(updatedParams, vehicle, tune.discipline);

    const updatedTune: Tune = {
      ...tune,
      parameters: updatedParams,
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTune(updatedTune);
  };

  // Change discipline and regenerate baseline
  const handleSelectDiscipline = (disc: Discipline) => {
    const newBaseline = generateBaselineTune(
      vehicle,
      disc,
      tune.driverProfile,
      tune.hardwareProfile
    );
    onUpdateTune(newBaseline);
  };

  // Regenerate baseline with current driver profile
  const handleRegenerateBaseline = () => {
    const newBaseline = generateBaselineTune(
      vehicle,
      tune.discipline,
      tune.driverProfile,
      tune.hardwareProfile
    );
    onUpdateTune(newBaseline);
  };

  // Driver profile slider updates
  const handleDriverProfileChange = (key: keyof DriverProfile, val: number) => {
    const updatedProfile = { ...tune.driverProfile, [key]: val };
    const newBaseline = generateBaselineTune(
      vehicle,
      tune.discipline,
      updatedProfile,
      tune.hardwareProfile
    );
    onUpdateTune(newBaseline);
  };

  // Filter parameters by category
  const allParams = Object.values(tune.parameters) as TuneParameter[];
  const filteredParameters = allParams.filter((p) => {
    if (selectedCategory === 'ALL') return true;
    return p.category === selectedCategory;
  });

  // Export summary to clipboard
  const handleCopySummary = () => {
    const lines = [
      `=== APEX TUNING ENGINE — FH5 ===`,
      `VEHÍCULO: ${vehicle.make} ${vehicle.model} (${vehicle.carClass} ${vehicle.pi}) [${vehicle.drivetrain}]`,
      `DISCIPLINA: ${tune.discipline} | VERSIÓN: ${tune.versionTag}`,
      `GRIP: ${tune.balance.grip}/100 | ROTACIÓN: ${tune.balance.rotation}/100 | ESTABILIDAD: ${tune.balance.stability}/100 | TRACCIÓN: ${tune.balance.traction}/100`,
      ``,
      `--- AJUSTES CLAVE EN FORZA HORIZON 5 ---`,
      `Presiones: Delantera ${tune.parameters.tire_pressure_front?.value || '-'} psi | Trasera ${tune.parameters.tire_pressure_rear?.value || '-'} psi`,
      `Alineación: Camber Del ${tune.parameters.camber_front?.value || '-'}° | Camber Tras ${tune.parameters.camber_rear?.value || '-'}° | Caster ${tune.parameters.caster?.value || '-'}°`,
      `Barras ARB: Delantera ${tune.parameters.arb_front?.value || '-'} | Trasera ${tune.parameters.arb_rear?.value || '-'}`,
      `Muelles: Delantero ${tune.parameters.springs_front?.value || '-'} kgf/mm | Trasero ${tune.parameters.springs_rear?.value || '-'} kgf/mm`,
      `Altura: Delantera ${tune.parameters.ride_height_front?.value || '-'} cm | Trasera ${tune.parameters.ride_height_rear?.value || '-'} cm`,
      `Amortiguadores Rebound: Del ${tune.parameters.rebound_front?.value || '-'} | Tras ${tune.parameters.rebound_rear?.value || '-'}`,
      `Amortiguadores Bump: Del ${tune.parameters.bump_front?.value || '-'} | Tras ${tune.parameters.bump_rear?.value || '-'}`,
      `Diferencial: Accel Tras ${tune.parameters.diff_rear_accel?.value || '-'}% | Decel Tras ${tune.parameters.diff_rear_decel?.value || '-'}%` +
        (vehicle.drivetrain === 'AWD' ? ` | Reparto Trasero ${tune.parameters.diff_center_balance?.value || '-'}%` : ''),
      `Frenos: Balance Delantero ${tune.parameters.brake_balance?.value || '-'}% | Presión ${tune.parameters.brake_pressure?.value || '-'}%`,
      `===============================`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Active Vehicle & Discipline Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                {vehicle.weightKg} kg ({(vehicle.frontWeightRatio * 100).toFixed(0)}% Del)
              </span>
            </div>
            <h2 className="font-['Chakra_Petch'] text-2xl font-bold text-white mt-1">
              {vehicle.make} {vehicle.model}{' '}
              <span className="text-slate-400 text-base font-normal">
                {vehicle.year}
              </span>
            </h2>
          </div>

          {/* Version controls */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="bg-slate-950 text-cyan-300 px-3 py-1.5 rounded border border-slate-800 font-bold">
              VERSIÓN: {tune.versionTag}
            </span>

            <button
              id="btn-save-version"
              onClick={() => {
                setVersionNameInput(`v${tune.version + 0.1}`);
                setShowSaveModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>GUARDAR VERSIÓN</span>
            </button>

            <button
              onClick={handleRegenerateBaseline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Restablecer al baseline matemático"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET BASELINE</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Copiar reglaje para ingresar en FH5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedNotification ? '¡COPIADO!' : 'COPIAR REGLAJE'}</span>
            </button>
          </div>
        </div>

        {/* Discipline Selector Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-2">
            SELECCIONA LA DISCIPLINA DE COMPETICIÓN EN FORZA:
          </label>
          <div className="flex flex-wrap gap-2">
            {disciplines.map((disc) => {
              const isSelected = tune.discipline === disc;
              return (
                <button
                  key={disc}
                  id={`btn-discipline-${disc}`}
                  onClick={() => handleSelectDiscipline(disc)}
                  className={`px-3 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {disc}
                </button>
              );
            })}
          </div>

          {/* Discipline Strategy Card */}
          <div className="mt-3 bg-slate-950/80 rounded-lg p-3.5 border border-slate-800/80 text-xs">
            <div className="flex items-center justify-between font-mono mb-1">
              <span className="text-cyan-400 font-bold">
                ESTRATEGIA: {currentDisciplineInfo.name}
              </span>
              <span className="text-[11px] text-slate-500">
                Física FH5 Determinista
              </span>
            </div>
            <p className="text-slate-300 text-xs font-sans leading-relaxed">
              {currentDisciplineInfo.objective}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-slate-400">
              <span className="text-slate-300">
                <strong>Respuesta esperada:</strong> {currentDisciplineInfo.expectedBehavior}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver and Hardware Profile Collapsible Drawer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowDriverProfile(!showDriverProfile)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-850 text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="font-mono text-xs font-bold text-white uppercase">
                PERFIL DEL PILOTO & HARDWARE
              </span>
              <span className="text-[11px] text-slate-400 font-sans ml-2">
                (Ajusta sliders de estilo de conducción y asistencias en FH5)
              </span>
            </div>
          </div>
          {showDriverProfile ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showDriverProfile && (
          <div className="p-5 border-t border-slate-800 bg-slate-950/50 space-y-4 font-mono text-xs">
            <p className="text-slate-400 font-sans text-xs">
              Mueve estos sliders según tus preferencias de conducción. El baseline engine re-calculará automáticamente el reglaje para adaptarse a tu estilo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sliders */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Entrada en Curva</span>
                  <span className="text-cyan-400 font-bold">{tune.driverProfile.cornerEntry}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tune.driverProfile.cornerEntry}
                  onChange={(e) => handleDriverProfileChange('cornerEntry', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>Estable / Conservadora</span>
                  <span>Agresiva / Ataque</span>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Rotación del Chasis</span>
                  <span className="text-cyan-400 font-bold">{tune.driverProfile.rotation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tune.driverProfile.rotation}
                  onChange={(e) => handleDriverProfileChange('rotation', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>Baja (Segura)</span>
                  <span>Alta (Reactiva)</span>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Tolerancia a Sobreviraje</span>
                  <span className="text-cyan-400 font-bold">{tune.driverProfile.oversteerTolerance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tune.driverProfile.oversteerTolerance}
                  onChange={(e) => handleDriverProfileChange('oversteerTolerance', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>Baja (Cero derrape)</span>
                  <span>Alta (Permite deslizar)</span>
                </div>
              </div>
            </div>

            {/* Hardware Info */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4 text-cyan-400" />
                  Dispositivo: <strong className="text-white">Controlador (Mando Estándar)</strong>
                </span>
                <span className="text-slate-400">
                  Dirección: <strong className="text-cyan-300">Simulación</strong>
                </span>
                <span className="text-slate-400">
                  ABS: <strong className="text-white">Activado</strong>
                </span>
                <span className="text-slate-400">
                  TCS: <strong className="text-white">Desactivado</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Balance Map & 4 Gauges Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Dynamic Balance Vector Map */}
        <div className="lg:col-span-5">
          <BalanceMap balance={tune.balance} />
        </div>

        {/* 4 Technical Gauges */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <TechnicalGauge
            label="GRIP MECÁNICO"
            value={tune.balance.grip}
            sublabel="Contacto de huella, compuesto y camber optimizado"
            category="GRIP"
          />
          <TechnicalGauge
            label="ROTACIÓN DE CHASIS"
            value={tune.balance.rotation}
            sublabel="Agilidad transitoria y diferencial de barras ARB"
            category="ROTACION"
          />
          <TechnicalGauge
            label="ESTABILIDAD DINÁMICA"
            value={tune.balance.stability}
            sublabel="Downforce aerodinámico y absorción de masa en frenada"
            category="ESTABILIDAD"
          />
          <TechnicalGauge
            label="TRACCIÓN LONGITUDINAL"
            value={tune.balance.traction}
            sublabel="Bloqueo de aceleración diferencial y anchura de gomas"
            category="TRACCION"
          />
        </div>
      </div>

      {/* Parameter Categories Navigation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
            PARÁMETROS DE REGLAJE DE INGENIERÍA ({filteredParameters.length} VISIBLES)
          </h3>
          <span className="font-mono text-[11px] text-slate-500">
            Escalas exactas de Forza Horizon 5
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-filter-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded font-mono text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredParameters.map((param) => (
          <ParameterCard
            key={param.key}
            param={param}
            onChangeValue={handleParameterChange}
          />
        ))}
      </div>

      {/* SAVE NEW VERSION MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
              <Save className="w-4 h-4 text-cyan-400" />
              <span>GUARDAR NUEVA VERSIÓN DE REGLAJE</span>
            </h3>
            <p className="text-slate-400 font-sans">
              Cada versión guarda una instantánea matemática del reglaje, permitiendo comparar evoluciones o revertir si la prueba en pista no ofrece el rendimiento esperado.
            </p>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Etiqueta / Nombre de Versión
              </label>
              <input
                type="text"
                value={versionNameInput}
                onChange={(e) => setVersionNameInput(e.target.value)}
                placeholder="e.g. v1.1 - Ajuste ARB Trasera"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Motivo de Ingeniería / Notas
              </label>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                rows={3}
                placeholder="¿Qué objetivo físico persigue este ajuste?"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-sans text-xs"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onSaveNewVersion(tune, versionNameInput || `v${tune.version + 1}`, notesInput);
                  setShowSaveModal(false);
                }}
                className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                Confirmar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
