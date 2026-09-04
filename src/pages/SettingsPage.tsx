/**
 * APEX TUNING ENGINE — FH5
 * PÁGINA DE CONFIGURACIÓN & GESTIÓN DE DATOS DEL SISTEMA
 */

import React, { useState } from 'react';
import {
  Settings,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { StorageService } from '../services/storage';

interface SettingsPageProps {
  onDataReset: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onDataReset }) => {
  const [resetConfirm, setResetConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleReset = () => {
    StorageService.resetAll();
    onDataReset();
    setResetConfirm(false);
    setSuccessMessage('Base de datos restablecida a los vehículos y configuraciones de demostración originales.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleExportBackup = () => {
    const backup = {
      vehicles: StorageService.getVehicles(),
      tunes: StorageService.getTunes(),
      history: StorageService.getHistory(),
      sessions: StorageService.getTestSessions(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apex_fh5_telemetry_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="font-['Chakra_Petch'] text-xl font-bold text-white uppercase tracking-wide">
            CONFIGURACIÓN DEL SISTEMA DE INGENIERÍA
          </h2>
        </div>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Preferencias de telemetría, unidades de Forza Horizon 5 y copias de seguridad de garaje.
        </p>
      </div>

      {successMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500/80 rounded-lg p-3.5 flex items-center gap-2.5 font-mono text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Units & FH5 Standards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2">
          1. SISTEMA DE UNIDADES (ESTÁNDAR FORZA HORIZON 5)
        </h3>
        <p className="text-slate-400 font-sans">
          El sistema está estrictamente alineado con las unidades y escalas oficiales del menú de tuneo de FH5 en español e inglés:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">PRESIÓN DE NEUMÁTICOS</span>
            <span className="text-white font-bold text-sm">psi (libras / pulgada²)</span>
            <span className="text-[10px] text-slate-500 block mt-1">Escala FH5: 15.0 - 55.0 psi</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">BARRAS ESTABILIZADORAS (ARB)</span>
            <span className="text-cyan-300 font-bold text-sm">Escala 1.0 a 65.0</span>
            <span className="text-[10px] text-slate-500 block mt-1">Sin porcentajes ficticios</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">MUELLES (RIGIDEZ)</span>
            <span className="text-white font-bold text-sm">kgf/mm (kilogramo-fuerza)</span>
            <span className="text-[10px] text-slate-500 block mt-1">Frecuencia natural calculada</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">AMORTIGUADORES (BUMP / REBOUND)</span>
            <span className="text-sky-300 font-bold text-sm">Escala 1.0 a 20.0</span>
            <span className="text-[10px] text-slate-500 block mt-1">Regla 55-65% de compresión</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">DIFERENCIAL & FRENOS</span>
            <span className="text-white font-bold text-sm">% de Bloqueo / Balance</span>
            <span className="text-[10px] text-slate-500 block mt-1">0% abierto a 100% soldado</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">AERODINÁMICA (DOWNFORCE)</span>
            <span className="text-teal-300 font-bold text-sm">kgf (kilogramos de carga)</span>
            <span className="text-[10px] text-slate-500 block mt-1">Carga vertical directa</span>
          </div>
        </div>
      </div>

      {/* System Architecture Specifications */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
        <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>2. ARQUITECTURA DEL SISTEMA Y TELEMETRÍA</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-300">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <div className="text-cyan-400 font-bold">Motor de Baseline Determinista:</div>
            <p className="text-slate-400 font-sans text-xs">
              Los valores de base no son inventados por IA de forma aleatoria, sino calculados mediante fórmulas de física y dinámica vehicular que consideran masa, reparto estático y cinemática de tracción (FWD, RWD, AWD).
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <div className="text-cyan-400 font-bold">Asistente IA de Ingeniería de Pista:</div>
            <p className="text-slate-400 font-sans text-xs">
              Conexión de telemetría segura en el backend Node.js utilizando el SDK @google/genai. Las claves API nunca se exponen al navegador cliente.
            </p>
          </div>
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2">
          3. COPIAS DE SEGURIDAD & RESTABLECIMIENTO
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>EXPORTAR BASE DE DATOS (.JSON)</span>
          </button>

          <button
            onClick={() => setResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-300 border border-rose-900/60 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>RESTABLECER A VEHÍCULOS DE DEMO</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/60 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-rose-400 uppercase flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>¿RESTABLECER DATOS DE TELEMETRÍA?</span>
            </h3>
            <p className="text-slate-300 font-sans">
              Esta acción eliminará todos los vehículos, reglajes y sesiones de prueba personalizadas y restaurará los vehículos de muestra (BMW X5 M, Nissan GT-R, Mazda MX-5, Ford Mustang GT).
            </p>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setResetConfirm(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Sí, Restablecer Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
