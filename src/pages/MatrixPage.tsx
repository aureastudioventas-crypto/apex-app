/**
 * APEX TUNING ENGINE — FH5
 * PÁGINA DE MATRIZ DE INGENIERÍA MOTORSPORT
 */

import React, { useState } from 'react';
import { Search, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { MASTER_MATRIX } from '../engine/matrixKnowledge';
import { MASTER_37_SHEETS } from '../data/master37Sheets';

export const MatrixPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParameterCategory, setSelectedParameterCategory] = useState<string>('ALL');
  const [selectedSheetId, setSelectedSheetId] = useState<string>('FH5-TM-001');

  const filteredItems = MASTER_MATRIX.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(q) || item.target.toLowerCase().includes(q) || item.symptoms.some((s) => s.toLowerCase().includes(q));
    const matchesCat = selectedParameterCategory === 'ALL' || item.category === selectedParameterCategory;
    return matchesSearch && matchesCat;
  });

  const selectedSheet = MASTER_37_SHEETS.find((sheet) => sheet.id === selectedSheetId) || MASTER_37_SHEETS[0];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs bg-slate-800 text-cyan-400 font-bold px-2 py-0.5 rounded border border-slate-700">MASTER KNOWLEDGE BASE</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-xs text-slate-400">FH5 REV. 4.0 · 37 CATEGORÍAS</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">MATRIZ MAESTRA APEX FH5</h2>
            <p className="text-xs text-slate-400 mt-1">37 hojas de categoría integradas desde el Manual Oficial APEX FH5 Rev. 4.0, más la matriz de parámetros de ingeniería.</p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">37/37 hojas cargadas</span>
          </div>
        </div>
      </div>

      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">HOJAS DE CATEGORÍA FH5-TM-001 → FH5-TM-037</h3>
            <p className="text-xs text-slate-400">Selecciona una categoría para consultar sus bases Rev. 4.0. Los porcentajes son posición dentro del rango FH5.</p>
          </div>
          <select value={selectedSheetId} onChange={(e) => setSelectedSheetId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200">
            {MASTER_37_SHEETS.map((sheet) => <option key={sheet.id} value={sheet.id}>{sheet.id} — {sheet.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {MASTER_37_SHEETS.map((sheet) => (
            <button key={sheet.id} onClick={() => setSelectedSheetId(sheet.id)} className={`text-left p-2.5 rounded-lg border font-mono text-[11px] transition-colors ${selectedSheet.id === sheet.id ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600'}`}>
              <strong>{String(sheet.number).padStart(2, '0')}</strong> · {sheet.name}
            </button>
          ))}
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-cyan-400 font-mono text-xs font-bold">{selectedSheet.id}</span>
              <h4 className="text-xl font-bold text-white">{selectedSheet.name}</h4>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">FUENTE: {selectedSheet.sourceVersion}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg border border-slate-800"><span className="text-slate-500 block">CASTER</span><strong className="text-slate-200">{selectedSheet.casterDeg}°</strong></div>
            <div className="p-3 rounded-lg border border-slate-800"><span className="text-slate-500 block">BARRAS F/R · % RANGO</span><strong className="text-slate-200">{selectedSheet.arbFrontRearPct}</strong></div>
            <div className="p-3 rounded-lg border border-slate-800"><span className="text-slate-500 block">RESORTES F/R · % RANGO</span><strong className="text-slate-200">{selectedSheet.springsFrontRearPct}</strong></div>
            <div className="p-3 rounded-lg border border-slate-800"><span className="text-slate-500 block">ALTURA · % RANGO</span><strong className="text-slate-200">{selectedSheet.rideHeightPct}</strong></div>
            <div className="p-3 rounded-lg border border-slate-800 md:col-span-2"><span className="text-slate-500 block">AMORTIGUADORES</span><strong className="text-slate-200">{selectedSheet.damping}</strong></div>
            <div className="p-3 rounded-lg border border-slate-800 xl:col-span-2"><span className="text-slate-500 block">DIFERENCIAL</span><strong className="text-slate-200">{selectedSheet.differential}</strong></div>
            <div className="p-3 rounded-lg border border-slate-800"><span className="text-slate-500 block">NEUMÁTICOS</span><strong className="text-slate-200">{selectedSheet.tirePressuresBar}</strong></div>
            <div className="p-3 rounded-lg border border-slate-800"><span className="text-slate-500 block">FRENOS</span><strong className="text-slate-200">{selectedSheet.brakeBalance}</strong></div>
            <div className="p-3 rounded-lg border border-slate-800 md:col-span-2 xl:col-span-2"><span className="text-slate-500 block">AERODINÁMICA</span><strong className="text-slate-200">{selectedSheet.aero}</strong></div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar parámetro, síntoma o comportamiento..." className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 font-mono" />
          </div>
          <select value={selectedParameterCategory} onChange={(e) => setSelectedParameterCategory(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300">
            <option value="ALL">Todos los parámetros</option>
            <option value="TIRES">Neumáticos</option>
            <option value="ALIGNMENT">Alineación</option>
            <option value="ARB">Barras estabilizadoras</option>
            <option value="SPRINGS">Muelles y altura</option>
            <option value="DAMPING">Amortiguación</option>
            <option value="AERO">Aerodinámica</option>
            <option value="BRAKES">Frenos</option>
            <option value="DIFFERENTIAL">Diferenciales</option>
            <option value="GEARING">Transmisión</option>
          </select>
        </div>
      </section>

      <div className="space-y-4">
        {filteredItems.map((item) => (
          <details key={item.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 group">
            <summary className="list-none cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3"><span className="font-mono text-xs font-black bg-cyan-950 text-cyan-400 border border-cyan-800/80 px-2 py-0.5 rounded">P{item.priority}</span><h3 className="font-mono text-base font-bold text-white">{item.name}</h3><span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{item.category}</span></div>
              <div className="flex items-center gap-2"><span className="text-cyan-300 font-bold font-mono text-xs">Rango FH5: [{item.min} - {item.max}] {item.unit}</span><ChevronDown className="w-4 h-4 text-slate-500 group-open:hidden" /><ChevronUp className="w-4 h-4 text-slate-500 hidden group-open:block" /></div>
            </summary>
            <div className="pt-4 space-y-3 text-xs">
              <p className="text-slate-200">{item.target}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="bg-slate-950 p-3 rounded-lg border border-slate-800"><strong className="text-cyan-400 block mb-1">▲ AL AUMENTAR</strong><span className="text-slate-400">{item.effectIncrease}</span></div><div className="bg-slate-950 p-3 rounded-lg border border-slate-800"><strong className="text-slate-400 block mb-1">▼ AL REDUCIR</strong><span className="text-slate-400">{item.effectDecrease}</span></div></div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800"><strong className="text-slate-300 block mb-1">FWD:</strong><span className="text-slate-400">{item.drivetrainModifiers.FWD}</span><strong className="text-slate-300 block mt-2 mb-1">RWD:</strong><span className="text-slate-400">{item.drivetrainModifiers.RWD}</span><strong className="text-slate-300 block mt-2 mb-1">AWD:</strong><span className="text-slate-400">{item.drivetrainModifiers.AWD}</span></div>
              <div className="flex flex-wrap gap-1.5">{item.symptoms.map((s, i) => <span key={i} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">{s}</span>)}</div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};
