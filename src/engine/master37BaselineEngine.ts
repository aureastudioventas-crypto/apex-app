/**
 * APEX TUNING ENGINE — FH5
 * MASTER 37 BASELINE ADAPTER — REV. 4.0
 *
 * La hoja de categoría es la fuente de referencia. Este adaptador convierte
 * rangos publicados en puntos iniciales deterministas y conserva la validación
 * del Baseline Engine. No crea rangos de categoría nuevos.
 */

import { Discipline, Drivetrain, Tune, TuneParameter, Vehicle } from '../types';
import { getMaster37Sheet, MASTER_37_SHEET_COUNT } from '../data/master37Sheets';
import { generateBaselineTune } from './baselineEngine';

const DISCIPLINE_INDEX: Record<Discipline, number> = { 'ROAD RACING': 0, 'STREET SCENE': 0, DIRT: 1, 'CROSS COUNTRY': 2, DRAG: 0, DRIFT: 0, CUSTOM: 0 };
const BAR_TO_PSI = 14.5037738;
const CM_TO_IN = 0.3937007874;
const KGF_TO_LB = 2.2046226218;

function parseNumber(value: string): number | null {
  const match = value.replace(',', '.').match(/[-+]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}
function parseRangePair(value: string): [number, number] | null {
  const match = value.replace(',', '.').replace(/\s/g, '').match(/([+-]?\d+(?:\.\d+)?)[–-]([+-]?\d+(?:\.\d+)?)/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}
function midpoint(range: [number, number]): number { return (range[0] + range[1]) / 2; }
function rangePairFromPct(value: string, axis: 'front' | 'rear'): number | null {
  const pair = parseRangePair(value.split('/')[axis === 'front' ? 0 : 1] || '');
  return pair ? midpoint(pair) : null;
}
function selectedRideHeightPct(value: string, discipline: Discipline): number | null {
  const ranges = value.match(/[+]?\d+(?:\.\d+)?[–-][+]?\d+(?:\.\d+)?%/g) || [];
  const selected = ranges[Math.min(DISCIPLINE_INDEX[discipline], Math.max(0, ranges.length - 1))];
  const pair = selected ? parseRangePair(selected.replace('%', '')) : null;
  return pair ? midpoint(pair) : null;
}

function setValue(params: Record<string, TuneParameter>, key: string, value: number | null, source: TuneParameter['source'] = 'MASTER37'): void {
  const param = params[key];
  if (!param || value === null || !Number.isFinite(value) || !param.isAvailable) return;
  const clamped = Math.max(param.min, Math.min(param.max, value));
  const stepped = param.min + Math.round((clamped - param.min) / param.step) * param.step;
  params[key] = { ...param, value: Number(stepped.toFixed(param.step < 0.1 ? 2 : 1)), source, confidence: 100 };
}

function setPressurePsi(params: Record<string, TuneParameter>, key: string, psi: number | null): void {
  const param = params[key];
  if (!param || !param.isAvailable || psi === null || !Number.isFinite(psi)) return;
  params[key] = { ...param, unit: 'psi', min: 15, max: 55, step: 0.5, value: Number(Math.max(15, Math.min(55, psi)).toFixed(1)), source: 'MASTER37', confidence: 100 };
}

function convertDisplayUnits(params: Record<string, TuneParameter>): void {
  ['ride_height_front', 'ride_height_rear'].forEach(key => {
    const p = params[key];
    if (p && p.isAvailable && p.unit.toLowerCase() === 'cm') params[key] = { ...p, unit: 'in', value: Number((p.value * CM_TO_IN).toFixed(2)), min: Number((p.min * CM_TO_IN).toFixed(2)), max: Number((p.max * CM_TO_IN).toFixed(2)), step: Number((p.step * CM_TO_IN).toFixed(3)) };
  });
  ['aero_front', 'aero_rear'].forEach(key => {
    const p = params[key];
    if (p && p.isAvailable && p.unit.toLowerCase() === 'kgf') params[key] = { ...p, unit: 'lb', value: Number((p.value * KGF_TO_LB).toFixed(1)), min: Number((p.min * KGF_TO_LB).toFixed(1)), max: Number((p.max * KGF_TO_LB).toFixed(1)), step: Number((p.step * KGF_TO_LB).toFixed(1)) };
  });
}

function disciplinePressure(sheet: ReturnType<typeof getMaster37Sheet>, discipline: Discipline): [number, number] | null {
  if (!sheet) return null;
  const label = discipline === 'CROSS COUNTRY' ? 'XC' : discipline === 'DIRT' ? 'Tierra' : 'Carretera';
  const match = sheet.tirePressuresBar.match(new RegExp(`${label}[^·]*?([0-9]+(?:[.,][0-9]+)?)\\s*/\\s*([0-9]+(?:[.,][0-9]+)?)\\s*bar`, 'i'));
  return match ? [Number(match[1].replace(',', '.')) * BAR_TO_PSI, Number(match[2].replace(',', '.')) * BAR_TO_PSI] : null;
}

function differentialPairs(sheet: ReturnType<typeof getMaster37Sheet>, drivetrain: Drivetrain): number[] | null {
  if (!sheet) return null;
  const label = drivetrain === 'AWD' ? 'AWD:' : `${drivetrain}:`;
  const start = sheet.differential.indexOf(label);
  if (start < 0) return null;
  const segment = sheet.differential.slice(start + label.length).split('·')[0];
  const pairs = segment.match(/\d+(?:[.,]\d+)?[–-]\d+(?:[.,]\d+)?/g) || [];
  return pairs.map(p => { const pair = parseRangePair(p); return pair ? midpoint(pair) : NaN; }).filter(Number.isFinite);
}

export function generateMaster37BaselineTune(
  vehicle: Vehicle,
  discipline: Discipline = 'ROAD RACING',
  driverProfile?: Parameters<typeof generateBaselineTune>[2],
  hardwareProfile?: Parameters<typeof generateBaselineTune>[3],
): Tune {
  const tune = generateBaselineTune(vehicle, discipline, driverProfile, hardwareProfile);
  const sheet = vehicle.categoryId ? getMaster37Sheet(vehicle.categoryId) : undefined;
  const params = { ...tune.parameters };

  ['tire_pressure_front', 'tire_pressure_rear'].forEach(key => {
    const p = params[key];
    if (p && p.unit.toLowerCase() === 'bar') setPressurePsi(params, key, p.value * BAR_TO_PSI);
    else if (p && p.unit.toLowerCase() === 'psi') setPressurePsi(params, key, p.value);
  });

  if (!sheet) {
    convertDisplayUnits(params);
    tune.parameters = params;
    tune.notes = `${tune.notes || ''} | MASTER 37: categoría no seleccionada; se conserva baseline genérico. Hay ${MASTER_37_SHEET_COUNT} hojas Rev. 4.0 disponibles.`;
    return tune;
  }

  setValue(params, 'caster', (() => { const r = parseRangePair(sheet.casterDeg); return r ? midpoint(r) : null; })());
  setValue(params, 'arb_front', rangePairFromPct(sheet.arbFrontRearPct, 'front'));
  setValue(params, 'arb_rear', rangePairFromPct(sheet.arbFrontRearPct, 'rear'));

  const springFrontPct = rangePairFromPct(sheet.springsFrontRearPct, 'front');
  const springRearPct = rangePairFromPct(sheet.springsFrontRearPct, 'rear');
  setValue(params, 'springs_front', springFrontPct === null ? null : params.springs_front.min + (params.springs_front.max - params.springs_front.min) * springFrontPct / 100);
  setValue(params, 'springs_rear', springRearPct === null ? null : params.springs_rear.min + (params.springs_rear.max - params.springs_rear.min) * springRearPct / 100);

  const heightPct = selectedRideHeightPct(sheet.rideHeightPct, discipline);
  if (heightPct !== null) {
    setValue(params, 'ride_height_front', params.ride_height_front.min + (params.ride_height_front.max - params.ride_height_front.min) * heightPct / 100);
    setValue(params, 'ride_height_rear', params.ride_height_rear.min + (params.ride_height_rear.max - params.ride_height_rear.min) * heightPct / 100);
  }

  const reboundText = sheet.damping.replace(/^Rebote F\/R:\s*/, '').split('.')[0];
  const reboundFrontPct = rangePairFromPct(reboundText, 'front');
  const reboundRearPct = rangePairFromPct(reboundText, 'rear');
  setValue(params, 'rebound_front', reboundFrontPct === null ? null : params.rebound_front.min + (params.rebound_front.max - params.rebound_front.min) * reboundFrontPct / 100);
  setValue(params, 'rebound_rear', reboundRearPct === null ? null : params.rebound_rear.min + (params.rebound_rear.max - params.rebound_rear.min) * reboundRearPct / 100);

  const pressure = disciplinePressure(sheet, discipline);
  if (pressure) {
    setPressurePsi(params, 'tire_pressure_front', pressure[0]);
    setPressurePsi(params, 'tire_pressure_rear', pressure[1]);
  }

  const diff = differentialPairs(sheet, vehicle.drivetrain);
  if (diff) {
    if (vehicle.drivetrain === 'FWD') {
      setValue(params, 'diff_front_accel', diff[0] ?? null); setValue(params, 'diff_front_decel', diff[1] ?? null);
    } else if (vehicle.drivetrain === 'RWD') {
      setValue(params, 'diff_rear_accel', diff[0] ?? null); setValue(params, 'diff_rear_decel', diff[1] ?? null);
    } else {
      setValue(params, 'diff_front_accel', diff[0] ?? null); setValue(params, 'diff_front_decel', diff[1] ?? null);
      setValue(params, 'diff_rear_accel', diff[2] ?? null); setValue(params, 'diff_rear_decel', diff[3] ?? null);
      const center = sheet.differential.match(/centro\s+(\d+)[–-](\d+)%/i);
      setValue(params, 'diff_center_balance', center ? midpoint([Number(center[1]), Number(center[2])]) : null);
    }
  }

  const brake = sheet.brakeBalance.match(/(\d+)[–-](\d+)%/);
  setValue(params, 'brake_balance', brake ? midpoint([Number(brake[1]), Number(brake[2])]) : null);
  setValue(params, 'brake_pressure', parseNumber(sheet.brakeBalance.match(/presión\s+(\d+)%/i)?.[1] || ''));

  convertDisplayUnits(params);
  tune.parameters = params;
  tune.versionTag = 'MASTER 37 / REV. 4.0';
  tune.notes = `MASTER 37 / ${sheet.id} / ${sheet.name} / ${sheet.sourceVersion}. Valores iniciales derivados determinísticamente de los rangos de la hoja y validados por el motor.`;
  tune.updatedAt = new Date().toISOString();
  return tune;
}
