/**
 * APEX TUNING ENGINE — FH5
 * PÁGINA DE MATRIZ DE INGENIERÍA MOTORSPORT (Master Knowledge Base)
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Sliders,
  Shield,
  Layers,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { MASTER_MATRIX, DISCIPLINE_PROFILES } from '../engine/matrixKnowledge';
import { MatrixItem } from '../types';

export const MatrixPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredItems = MASTER_MATRIX.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.symptoms.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs bg-slate-800 text-cyan-400 font-bold px-2 py-0.5 rounded border border-slate-700">
                MASTER KNOWLEDGE BASE
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-xs text-slate-400">
                FH5 PHYSICS FORMULARY
              </span>
            </div>
            <h2 className="font-['Chakra_Petch'] text-2xl font-bold text-white mt-1">
              MATRIZ DE INGENIERÍA MOTORSPORT
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Base de conocimiento técnico estructurada con reglas físicas, rangos de Forza Horizon 5, efectos dinámicos y jerarquía de diagnóstico.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">
              Jerarquía de Pista: <strong>1. Seguridad → 2. Gomas → 3. ARB → 4. Muelles → 5. Aero → 6. Diff</strong>
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar parámetro, síntoma o comportamiento (e.g. subviraje, rebote, arb)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="TIRES">Neumáticos</option>
            <option value="ALIGNMENT">Alineación</option>
            <option value="ARB">Barras Estabilizadoras (ARB)</option>
            <option value="SPRINGS">Muelles y Altura</option>
            <option value="DAMPING">Amortiguación (Rebound/Bump)</option>
            <option value="AERO">Aerodinámica</option>
            <option value="BRAKES">Frenos</option>
            <option value="DIFFERENTIAL">Diferenciales</option>
            <option value="GEARING">Transmisión</option>
          </select>
        </div>
      </div>

      {/* Matrix Cards Grid */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            id={`matrix-item-${item.id}`}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs hover:border-slate-700 transition-colors"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-cyan-950 text-cyan-400 border border-cyan-800/80 px-2 py-0.5 rounded">
                  P{item.priority}
                </span>
                <h3 className="font-mono text-base font-bold text-white">
                  {item.name}
                </h3>
                <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {item.category}
                </span>
              </div>

              <div className="text-right">
                <span className="text-cyan-300 font-bold">
                  Rango FH5: [{item.min} - {item.max}] {item.unit}
                </span>
              </div>
            </div>

            {/* Target & Purpose */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                OBJETIVO FÍSICO Y PROPÓSITO MECÁNICO:
              </span>
              <p className="text-slate-200 font-sans text-xs leading-relaxed">
                {item.target}
              </p>
            </div>

            {/* Effects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">
                  ▲ AL AUMENTAR (+ / MÁS RÍGIDO):
                </span>
                <p className="text-slate-400 font-sans text-xs leading-tight">
                  {item.effectIncrease}
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-bold block mb-1">
                  ▼ AL REDUCIR (- / MÁS BLANDO):
                </span>
                <p className="text-slate-400 font-sans text-xs leading-tight">
                  {item.effectDecrease}
                </p>
              </div>
            </div>

            {/* Drivetrain Modifiers */}
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
              <span className="text-slate-300 font-bold block mb-1">
                COMPORTAMIENTO SEGÚN TREN MOTRIZ (DRIVETRAIN):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <strong className="text-cyan-400">FWD:</strong>{' '}
                  <span className="text-slate-400 font-sans">{item.drivetrainModifiers.FWD}</span>
                </div>
                <div>
                  <strong className="text-sky-400">RWD:</strong>{' '}
                  <span className="text-slate-400 font-sans">{item.drivetrainModifiers.RWD}</span>
                </div>
                <div>
                  <strong className="text-teal-400">AWD:</strong>{' '}
                  <span className="text-slate-400 font-sans">{item.drivetrainModifiers.AWD}</span>
                </div>
              </div>
            </div>

            {/* Symptoms Tags */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold">
                SÍNTOMAS RELACIONADOS:
              </span>
              {item.symptoms.map((s, sIdx) => (
                <span
                  key={sIdx}
                  className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
