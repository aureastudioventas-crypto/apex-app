/**
 * APEX TUNING ENGINE — FH5
 * HEADER DE INGENIERÍA MOTORSPORT
 */

import React from 'react';
import {
  Gauge,
  Car,
  Sliders,
  Activity,
  History,
  BookOpen,
  Settings,
  Bot,
  Zap,
} from 'lucide-react';
import { Vehicle } from '../types';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activeVehicle: Vehicle | null;
  onOpenTrackside: () => void;
  onOpenAiAssistant: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  activeVehicle,
  onOpenTrackside,
  onOpenAiAssistant,
}) => {
  const tabs = [
    { id: 'garage', label: 'GARAGE', icon: Gauge },
    { id: 'vehicles', label: 'VEHÍCULOS', icon: Car },
    { id: 'tuner', label: 'TUNE STUDIO', icon: Sliders },
    { id: 'test', label: 'TEST & DIAGNÓSTICO', icon: Activity },
    { id: 'history', label: 'HISTORIAL', icon: History },
    { id: 'matrix', label: 'MATRIZ INGENIERÍA', icon: BookOpen },
    { id: 'settings', label: 'CONFIGURACIÓN', icon: Settings },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0c1017] sticky top-0 z-40">
      {/* Top telemetry bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono font-semibold tracking-wider text-slate-300 uppercase">
              APEX INGENIERÍA MOTORSPORT
            </span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline font-mono text-slate-400">
            FH5 TELEMETRY ENGINE v1.0
          </span>
        </div>

        {activeVehicle && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">VEHÍCULO ACTIVO:</span>
            <span className="bg-slate-800 text-cyan-300 font-semibold px-2 py-0.5 rounded border border-slate-700">
              {activeVehicle.make} {activeVehicle.model} ({activeVehicle.carClass} {activeVehicle.pi})
            </span>
            <span className="bg-cyan-950/80 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/60 font-mono font-bold">
              {activeVehicle.currentDiscipline}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Quick Trackside Button */}
          <button
            id="btn-trackside-mode"
            onClick={onOpenTrackside}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-mono text-xs font-semibold transition-colors"
            title="Modo Pista Rápido para usar mientras juegas"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>MODO PISTA</span>
          </button>

          {/* AI Chief Engineer Assistant */}
          <button
            id="btn-ai-assistant"
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-semibold transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>INGENIERO IA</span>
          </button>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 font-['Chakra_Petch']">
            <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">
              APEX TUNING ENGINE
            </span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              FORZA HORIZON 5
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-['JetBrains_Mono']">
            Sistema inteligente de ingeniería de reglajes y diagnóstico dinámico
          </p>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
