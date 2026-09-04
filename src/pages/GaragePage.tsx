/**
 * APEX TUNING ENGINE — FH5
 * PÁGINA DE GARAJE MOTORSPORT
 */

import React from 'react';
import {
  Car,
  Sliders,
  Activity,
  History,
  Plus,
  ArrowRight,
  Shield,
  Gauge,
  Zap,
} from 'lucide-react';
import { Vehicle, Tune } from '../types';
import { StorageService } from '../services/storage';

interface GaragePageProps {
  vehicles: Vehicle[];
  tunes: Record<string, Tune>;
  activeVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenCreateVehicleModal: () => void;
}

export const GaragePage: React.FC<GaragePageProps> = ({
  vehicles,
  tunes,
  activeVehicleId,
  onSelectVehicle,
  onNavigateTab,
  onOpenCreateVehicleModal,
}) => {
  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'AFINADO':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
      case 'EN PRUEBAS':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80';
      case 'BASELINE':
        return 'bg-sky-950/80 text-sky-400 border-sky-800/80';
      case 'PROYECTO':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getClassBadge = (carClass: Vehicle['carClass']) => {
    switch (carClass) {
      case 'X':
        return 'bg-purple-900 text-white border-purple-600';
      case 'S2':
        return 'bg-blue-900 text-white border-blue-600';
      case 'S1':
        return 'bg-purple-950 text-purple-200 border-purple-700';
      case 'A':
        return 'bg-rose-950 text-rose-200 border-rose-700';
      case 'B':
        return 'bg-orange-950 text-orange-200 border-orange-700';
      case 'C':
        return 'bg-amber-950 text-amber-200 border-amber-700';
      default:
        return 'bg-slate-800 text-slate-200 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Fleet Telemetry */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-['Chakra_Petch'] text-xl font-bold text-white uppercase tracking-wide">
              GARAJE DE INGENIERÍA MOTORSPORT
            </h2>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded font-bold">
              {vehicles.length} VEHÍCULOS
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Plataforma central de diagnóstico, reglajes y evolución de chasis para Forza Horizon 5.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-create-vehicle-garage"
            onClick={onOpenCreateVehicleModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-sm shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>NUEVO VEHÍCULO</span>
          </button>
        </div>
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {vehicles.map((veh) => {
          const isActive = veh.id === activeVehicleId;
          const tune = tunes[veh.id];
          const balance = tune?.balance;

          return (
            <div
              key={veh.id}
              id={`vehicle-card-${veh.id}`}
              className={`bg-slate-900/90 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-black px-2 py-0.5 rounded border ${getClassBadge(
                        veh.carClass
                      )}`}
                    >
                      {veh.carClass} {veh.pi}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded border ${getStatusBadge(
                        veh.status
                      )}`}
                    >
                      {veh.status}
                    </span>
                    <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {veh.drivetrain}
                    </span>
                  </div>

                  <span className="font-mono text-xs text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/60 font-bold">
                    {veh.currentDiscipline}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-['Chakra_Petch'] text-lg font-bold text-white tracking-wide">
                    {veh.make} {veh.model}{' '}
                    <span className="text-slate-400 text-sm font-normal">
                      {veh.year}
                    </span>
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    {veh.engine} • {veh.powerHp} HP • {veh.weightKg} kg ({(veh.frontWeightRatio * 100).toFixed(0)}% Del)
                  </p>
                </div>

                {/* 4 Technical Indicators for Grip, Rotation, Stability, Traction */}
                {balance && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block uppercase">GRIP</span>
                      <span className="text-sm font-black text-cyan-300">{balance.grip}</span>
                      <span className="text-[9px] text-slate-500 block">/100</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block uppercase">ROTACIÓN</span>
                      <span className="text-sm font-black text-sky-300">{balance.rotation}</span>
                      <span className="text-[9px] text-slate-500 block">/100</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block uppercase">ESTABILIDAD</span>
                      <span className="text-sm font-black text-teal-300">{balance.stability}</span>
                      <span className="text-[9px] text-slate-500 block">/100</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block uppercase">TRACCIÓN</span>
                      <span className="text-sm font-black text-emerald-300">{balance.traction}</span>
                      <span className="text-[9px] text-slate-500 block">/100</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-mono text-slate-500">
                  Compuesto: <span className="text-slate-300 font-medium">{veh.parts.tireCompound}</span> (
                  {veh.parts.frontTireWidthMm}/{veh.parts.rearTireWidthMm}mm)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectVehicle(veh.id);
                      onNavigateTab('tuner');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isActive ? 'AFINAR REGLAJE' : 'SELECCIONAR'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectVehicle(veh.id);
                      onNavigateTab('test');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-mono text-xs"
                    title="Probar en pista y diagnosticar"
                  >
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>TEST</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectVehicle(veh.id);
                      onNavigateTab('history');
                    }}
                    className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
                    title="Historial de versiones"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
