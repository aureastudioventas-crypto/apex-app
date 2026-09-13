export type ParameterUnit = 'bar' | 'degree' | 'percent' | 'kgf_mm' | 'kgf' | 'cm' | 'inch' | 'ratio' | 'kmh' | 'km' | 'none';

export interface ParameterUnitDefinition {
  unit: ParameterUnit;
  label: string;
  displayUnit: string;
  min?: number;
  max?: number;
  step?: number;
  aliases?: string[];
}

export const PARAMETER_UNITS: Record<ParameterUnit, ParameterUnitDefinition> = {
  bar: { unit: 'bar', label: 'Presión de neumáticos', displayUnit: 'bar', min: 1, max: 4, step: 0.1, aliases: ['psi'] },
  degree: { unit: 'degree', label: 'Ángulo', displayUnit: '°', step: 0.1 },
  percent: { unit: 'percent', label: 'Porcentaje', displayUnit: '%', min: 0, max: 100, step: 1 },
  kgf_mm: { unit: 'kgf_mm', label: 'Rigidez de muelle', displayUnit: 'kgf/mm', step: 0.1 },
  kgf: { unit: 'kgf', label: 'Fuerza de amortiguador', displayUnit: 'kgf', step: 0.1 },
  cm: { unit: 'cm', label: 'Altura', displayUnit: 'cm', step: 0.1 },
  inch: { unit: 'inch', label: 'Pulgadas', displayUnit: 'in', step: 0.1 },
  ratio: { unit: 'ratio', label: 'Relación', displayUnit: '', step: 0.01 },
  kmh: { unit: 'kmh', label: 'Velocidad', displayUnit: 'km/h', step: 1 },
  km: { unit: 'km', label: 'Distancia', displayUnit: 'km', step: 0.1 },
  none: { unit: 'none', label: 'Sin unidad', displayUnit: '' },
};

export const PSI_TO_BAR = 0.0689475729;
export const BAR_TO_PSI = 14.5037738;

export function normalizeUnit(unit: string): ParameterUnit {
  const normalized = unit.trim().toLowerCase();
  if (normalized === 'psi' || normalized === 'bar') return 'bar';
  if (normalized === '%' || normalized === 'percent' || normalized === 'percentage') return 'percent';
  if (normalized === '°' || normalized === 'deg' || normalized === 'degree') return 'degree';
  if (normalized === 'kgf/mm' || normalized === 'kgf_mm') return 'kgf_mm';
  if (normalized === 'kgf') return 'kgf';
  if (normalized === 'cm') return 'cm';
  if (normalized === 'in' || normalized === 'inch') return 'inch';
  if (normalized === 'ratio') return 'ratio';
  if (normalized === 'km/h' || normalized === 'kmh') return 'kmh';
  if (normalized === 'km') return 'km';
  return 'none';
}

export function psiToBar(value: number): number {
  return Number((value * PSI_TO_BAR).toFixed(2));
}

export function barToPsi(value: number): number {
  return Number((value * BAR_TO_PSI).toFixed(2));
}
