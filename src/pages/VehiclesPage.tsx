/**
 * APEX TUNING ENGINE — FH5
 * PÁGINA DE GESTIÓN Y FICHA TÉCNICA DE VEHÍCULOS
 */

import React, { useState } from 'react';
import {
  Car,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Wrench,
  X,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import {
  Vehicle,
  CarClass,
  Drivetrain,
  Aspiration,
  Discipline,
  TireCompound,
  VehicleParts,
} from '../types';

interface VehiclesPageProps {
  vehicles: Vehicle[];
  activeVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onSaveVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const VehiclesPage: React.FC<VehiclesPageProps> = ({
  vehicles,
  activeVehicleId,
  onSelectVehicle,
  onSaveVehicle,
  onDeleteVehicle,
  onNavigateTab,
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const initialNewVehicle: Vehicle = {
    id: `custom-veh-${Date.now()}`,
    make: 'Porsche',
    model: '911 GT3 RS',
    year: 2019,
    carClass: 'S1',
    pi: 895,
    drivetrain: 'RWD',
    engine: '4.0L Flat-6 Naturally Aspirated',
    powerHp: 520,
    torqueNm: 470,
    displacementL: 4.0,
    aspiration: 'Natural',
    weightKg: 1430,
    frontWeightRatio: 0.43,
    gearsCount: 7,
    transmissionType: 'Secuencial',
    status: 'BASELINE',
    currentDiscipline: 'ROAD RACING',
    parts: {
      tireCompound: 'Semi-Slick',
      frontTireWidthMm: 265,
      rearTireWidthMm: 325,
      frontRimSizeInches: 20,
      rearRimSizeInches: 21,
      frontTrackWidthLevel: 2,
      rearTrackWidthLevel: 2,
      brakesAdjustable: true,
      suspensionAdjustable: true,
      frontArbAdjustable: true,
      rearArbAdjustable: true,
      differentialAdjustable: true,
      transmissionAdjustable: true,
      frontAeroAdjustable: true,
      rearAeroAdjustable: true,
      weightReduction: 'Race',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [formData, setFormData] = useState<Vehicle>(initialNewVehicle);

  const handleOpenCreate = () => {
    setFormData({ ...initialNewVehicle, id: `custom-veh-${Date.now()}` });
    setEditingVehicle(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setFormData(JSON.parse(JSON.stringify(v)));
    setEditingVehicle(v);
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveVehicle(formData);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div>
          <h2 className="font-['Chakra_Petch'] text-xl font-bold text-white uppercase tracking-wide">
            REGISTRO TÉCNICO DE VEHÍCULOS
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Configuración exhaustiva de masa, tren motriz y componentes ajustables instalados en FH5.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-sm shadow-cyan-500/20 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTRAR VEHÍCULO</span>
        </button>
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vehicles.map((veh) => {
          const isActive = veh.id === activeVehicleId;
          return (
            <div
              key={veh.id}
              className={`bg-slate-900/90 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-cyan-500 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-950/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {veh.carClass} {veh.pi}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-300">
                      {veh.drivetrain}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 font-semibold">
                    {veh.currentDiscipline}
                  </span>
                </div>

                <h3 className="font-['Chakra_Petch'] text-lg font-bold text-white">
                  {veh.make} {veh.model}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Año {veh.year} • {veh.engine}
                </p>

                {/* Specs Table */}
                <div className="mt-4 bg-slate-950/80 rounded-lg p-3 border border-slate-800/80 grid grid-cols-2 gap-y-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">POTENCIA / PAR</span>
                    <span className="text-slate-300 font-bold">
                      {veh.powerHp} HP • {veh.torqueNm} N·m
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">PESO / REPARTO</span>
                    <span className="text-slate-300 font-bold">
                      {veh.weightKg} kg ({(veh.frontWeightRatio * 100).toFixed(0)}% Del)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">NEUMÁTICOS</span>
                    <span className="text-slate-300 font-bold">
                      {veh.parts.tireCompound}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">ANCHO GOMAS</span>
                    <span className="text-slate-300 font-bold">
                      {veh.parts.frontTireWidthMm}/{veh.parts.rearTireWidthMm} mm
                    </span>
                  </div>
                </div>

                {/* Adjustable parts summary */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/70 text-[11px] font-mono flex flex-wrap gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded border ${veh.parts.suspensionAdjustable ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                    Susp: {veh.parts.suspensionAdjustable ? 'Competición' : 'Stock'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border ${veh.parts.differentialAdjustable ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                    Diff: {veh.parts.differentialAdjustable ? 'Competición' : 'Stock'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border ${veh.parts.frontArbAdjustable ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                    ARBs: {veh.parts.frontArbAdjustable ? 'Ajustables' : 'Stock'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border ${veh.parts.rearAeroAdjustable ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                    Aero: {veh.parts.rearAeroAdjustable ? 'Alerón Carrera' : 'Stock'}
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    onSelectVehicle(veh.id);
                    onNavigateTab('tuner');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isActive ? 'VEHÍCULO ACTIVO' : 'ACTIVAR'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(veh)}
                    className="p-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white"
                    title="Editar especificaciones"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!veh.isDemo && (
                    <button
                      onClick={() => onDeleteVehicle(veh.id)}
                      className="p-1.5 rounded bg-slate-800/70 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300"
                      title="Eliminar vehículo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT VEHICLE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-cyan-400" />
                <h3 className="font-mono text-base font-bold text-white uppercase">
                  {editingVehicle ? 'EDITAR FICHA TÉCNICA' : 'REGISTRAR NUEVO VEHÍCULO'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-5 font-mono text-xs">
              {/* Sección 1: Identificación básica */}
              <div>
                <h4 className="text-cyan-400 font-bold uppercase mb-2 border-b border-slate-800 pb-1">
                  1. IDENTIFICACIÓN Y HOMOLOGACIÓN
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Marca</label>
                    <input
                      type="text"
                      required
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Modelo</label>
                    <input
                      type="text"
                      required
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Año</label>
                    <input
                      type="number"
                      min={1920}
                      max={2030}
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2020 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Clase FH5</label>
                    <select
                      value={formData.carClass}
                      onChange={(e) => setFormData({ ...formData, carClass: e.target.value as CarClass })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="D">D (100 - 500)</option>
                      <option value="C">C (501 - 600)</option>
                      <option value="B">B (601 - 700)</option>
                      <option value="A">A (701 - 800)</option>
                      <option value="S1">S1 (801 - 900)</option>
                      <option value="S2">S2 (901 - 998)</option>
                      <option value="X">X (999)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Índice PI (100 - 999)</label>
                    <input
                      type="number"
                      min={100}
                      max={999}
                      value={formData.pi}
                      onChange={(e) => setFormData({ ...formData, pi: parseInt(e.target.value) || 800 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Tracción (Drivetrain)</label>
                    <select
                      value={formData.drivetrain}
                      onChange={(e) => setFormData({ ...formData, drivetrain: e.target.value as Drivetrain })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="AWD">AWD (Tracción Total)</option>
                      <option value="RWD">RWD (Propulsión Trasera)</option>
                      <option value="FWD">FWD (Tracción Delantera)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 2: Telemetría de Masa y Motor */}
              <div>
                <h4 className="text-cyan-400 font-bold uppercase mb-2 border-b border-slate-800 pb-1">
                  2. MASA, MOTOR & DINÁMICA
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Peso Total (kg)</label>
                    <input
                      type="number"
                      min={500}
                      max={4000}
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: parseInt(e.target.value) || 1400 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Reparto Delantero (%)</label>
                    <input
                      type="number"
                      min={30}
                      max={75}
                      value={Math.round(formData.frontWeightRatio * 100)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          frontWeightRatio: (parseFloat(e.target.value) || 50) / 100,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Potencia (HP)</label>
                    <input
                      type="number"
                      min={50}
                      max={2500}
                      value={formData.powerHp}
                      onChange={(e) => setFormData({ ...formData, powerHp: parseInt(e.target.value) || 500 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Par Motor (N·m)</label>
                    <input
                      type="number"
                      min={50}
                      max={3000}
                      value={formData.torqueNm}
                      onChange={(e) => setFormData({ ...formData, torqueNm: parseInt(e.target.value) || 600 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Componentes Ajustables Instalados (PIEZAS DE FH5) */}
              <div>
                <h4 className="text-cyan-400 font-bold uppercase mb-2 border-b border-slate-800 pb-1">
                  3. PIEZAS AJUSTABLES INSTALADAS (FH5)
                </h4>
                <p className="text-[11px] text-slate-500 font-sans mb-3">
                  Marca únicamente las piezas que tengan instalado el paquete ajustable de competición en Forza Horizon 5. Si una pieza está desmarcada, el sistema ocultará sus parámetros de reglaje para evitar ajustes imposibles en el juego.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.parts.suspensionAdjustable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parts: { ...formData.parts, suspensionAdjustable: e.target.checked },
                        })
                      }
                      className="rounded accent-cyan-400 w-4 h-4"
                    />
                    <span>Suspensión Carrera</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.parts.frontArbAdjustable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parts: {
                            ...formData.parts,
                            frontArbAdjustable: e.target.checked,
                            rearArbAdjustable: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-cyan-400 w-4 h-4"
                    />
                    <span>Barras Estabilizadoras</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.parts.differentialAdjustable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parts: { ...formData.parts, differentialAdjustable: e.target.checked },
                        })
                      }
                      className="rounded accent-cyan-400 w-4 h-4"
                    />
                    <span>Diferencial Carrera</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.parts.brakesAdjustable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parts: { ...formData.parts, brakesAdjustable: e.target.checked },
                        })
                      }
                      className="rounded accent-cyan-400 w-4 h-4"
                    />
                    <span>Frenos Carrera</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.parts.transmissionAdjustable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parts: { ...formData.parts, transmissionAdjustable: e.target.checked },
                        })
                      }
                      className="rounded accent-cyan-400 w-4 h-4"
                    />
                    <span>Caja Carrera</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.parts.frontAeroAdjustable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parts: { ...formData.parts, frontAeroAdjustable: e.target.checked },
                        })
                      }
                      className="rounded accent-cyan-400 w-4 h-4"
                    />
                    <span>Splitter Delantero</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.parts.rearAeroAdjustable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parts: { ...formData.parts, rearAeroAdjustable: e.target.checked },
                        })
                      }
                      className="rounded accent-cyan-400 w-4 h-4"
                    />
                    <span>Alerón Trasero Carrera</span>
                  </label>
                </div>

                {/* Neumáticos */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Compuesto</label>
                    <select
                      value={formData.parts.tireCompound}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parts: { ...formData.parts, tireCompound: e.target.value as TireCompound },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="Race">Competición (Race)</option>
                      <option value="Semi-Slick">Semi-Slick</option>
                      <option value="Sport">Deportivo (Sport)</option>
                      <option value="Street">Calle (Street)</option>
                      <option value="Rally">Rally</option>
                      <option value="Offroad">Todo Terreno (Offroad)</option>
                      <option value="Drift">Drift</option>
                      <option value="Drag">Drag</option>
                      <option value="Stock">De Serie (Stock)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Anchura Delantera (mm)</label>
                    <input
                      type="number"
                      value={formData.parts.frontTireWidthMm}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parts: {
                            ...formData.parts,
                            frontTireWidthMm: parseInt(e.target.value) || 245,
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Anchura Trasera (mm)</label>
                    <input
                      type="number"
                      value={formData.parts.rearTireWidthMm}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parts: {
                            ...formData.parts,
                            rearTireWidthMm: parseInt(e.target.value) || 295,
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  {editingVehicle ? 'Guardar Cambios' : 'Guardar y Generar Baseline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
