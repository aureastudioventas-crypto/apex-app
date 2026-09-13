/**
 * APEX TUNING ENGINE — FH5
 * MASTER 37 BASELINE ADAPTER — REV. 4.0
 *
 * La hoja de categoría es la fuente de referencia. Este adaptador no inventa
 * rangos nuevos: convierte los rangos publicados en un punto inicial
 * determinista y después conserva la validación/piezas del Baseline Engine.
 */

import { Discipline, Drivetrain, Tune, TuneParameter, Vehicle } from '../types';
import { getMaster37Sheet, MASTER_37_SHEET_COUNT } from '../data/master37Sheets';
import { generateBaselineTune } from './baselineEngine';

const DISCIPLINE_INDEX: Record<Discipline, number> = {
  'ROAD RACING': 0,
  'STREET SCENE': 0,
  DIRT: 1,
  'CROSS COUNTRY': 2,
  DRAG: 0,
  DRIFT: 0,
  CUSTOM: 0,
};

function parseNumber(value: string): number | null {
  const normalized = value.replace(',', '.');
  const match = normalized.match(/[-+]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseRangePair(value: string): [number, number] | null {
  const normalized = value.replace(',', '.').replace(/\s/g, '');
  const match = normalized.match(/([+-]?\d+(?:\.\d+)?)[–-]([+-]?\d+(?:\.\d+)?)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

function midpoint(range: [number, number]): number {
  return (range[0] + range[1]) / 2;
}

function rangePairFromPct(value: string, axis: 'front' | 'rear'): number | null {
  const parts = value.split('/');
  const pair = parseRangePair(parts[axis === 'front' ? 0 : 1] || '');
  return pair ? midpoint(pair) : null;
}

function selectedRideHeightPct(value: string, discipline: Discipline): number | null {
  const ranges = value.match(/[+]?\d+(?:\.\d+)?[–-][+]?\d+(?:\.\d+)?%/g) || [];
  const selected = ranges[Math.min(DISCIPLINE_INDEX[discipline], Math.max(0, ranges.length - 1))];
  if (!selected) return null;
  const pair = parseRangePair(selected.replace('%', ''));
  return pair ? midpoint(pair) : null;
}

function setValue(params: Record<string, TuneParameter>, key: string, value: number | null, source = 'MASTER37'): void {
  const param = params[key];
  if (!param || value === null || !Number.isFinite(value) || !param.isAvailable) return;
  const clamped = Math.max(param.min, Math.min(param.max, value));
  const steps = Math.round((clamped - param.min) / param.step);
  const stepped = param.min + steps * param.step;
  params[key] = {
    ...param,
    value: Number(stepped.toFixed(param.step < 0.1 ? 2 : 1)),
    source: source as TuneParameter['source'],
    confidence: 100,
  };
}

function disciplinePressure(sheet: ReturnType<typeof getMaster37Sheet>, discipline: Discipline): [number, number] | null {
  if (!sheet) return null;
  const label = discipline === 'CROSS COUNTRY' ? 'XC' : discipline === 'DIRT' ? 'Tierra' : 'Carretera';
  const match = sheet.tirePressuresBar.match(new RegExp(`${label}[^·]*?([0-9]+(?:[.,][0-9]+)?)\\s*/\\s*([0-9]+(?:[.,][0-9]+)?)\\s*bar`, 'i'));
  if (!match) return null;
  return [Number(match[1].replace(',', '.')), Number(match[2].replace(',', '.'))];
}

function differentialValues(sheet: ReturnType<typeof getMaster37Sheet>, drivetrain: Drivetrain): number[] | null {
  if (!sheet) return null;
  const label = drivetrain === 'AWD' ? 'AWD:' : `${drivetrain}:`;
  const start = sheet.differential.indexOf(label);
  if (start < 0) return null;
  const segment = sheet.differential.slice(start + label.length).split('·')[0];
  const nums = segment.match(/\d+(?:[.,]\d+)?/g)?.map(n => Number(n.replace(',', '.'))) || [];
  return nums.length >= 2 ? nums : null;
}

/**
 * Genera un baseline usando primero la hoja Rev. 4.0 de la categoría del vehículo.
 * Si el vehículo aún no tiene categoryId, conserva el baseline genérico y deja
 * la trazabilidad explícita para que no se presente como una hoja de categoría.
 */
export function generateMaster37BaselineTune(
  vehicle: Vehicle,
  discipline: Discipline = 'ROAD RACING',
  driverProfile?: Parameters<typeof generateBaselineTune>[2],
  hardwareProfile?: Parameters<typeof generateBaselineTune>[3],
): Tune {
  const tune = generateBaselineTune(vehicle, discipline, driverProfile, hardwareProfile);
  const sheet = vehicle.categoryId ? getMaster37Sheet(vehicle.categoryId) : undefined;

  if (!sheet) {
    tune.notes = `${tune.notes || ''} | MASTER 37: categoría no seleccionada; se conserva baseline genérico. Hay ${MASTER_37_SHEET_COUNT} hojas Rev. 4.0 disponibles.`;
    return tune;
  }

  const params = { ...tune.parameters };

  setValue(params, 'caster', (() => {
    const range = parseRangePair(sheet.casterDeg);
    return range ? midpoint(range) : null;
  })());

  setValue(params, 'arb_front', rangePairFromPct(sheet.arbFrontRearPct, 'front'));
  setValue(params, 'arb_rear', rangePairFromPct(sheet.arbFrontRearPct, 'rear'));
  setValue(params, 'springs_front', rangePairFromPct(sheet.springsFrontRearPct, 'front') === null ? null :
    params.springs_front.min + (params.springs_front.max - params.springs_front.min) * (rangePairFromPct(sheet.springsFrontRearPct, 'front')! / 100));
  setValue(params, 'springs_rear', rangePairFromPct(sheet.springsFrontRearPct, 'rear') === null ? null :
    params.springs_rear.min + (params.springs_rear.max - params.springs_rear.min) * (rangePairFromPct(sheet.springsFrontRearPct, 'rear')! / 100));

  const heightPct = selectedRideHeightPct(sheet.rideHeightPct, discipline);
  if (heightPct !== null) {
    setValue(params, 'ride_height_front', params.ride_height_front.min + (params.ride_height_front.max - params.ride_height_front.min) * heightPct / 100);
    setValue(params, 'ride_height_rear', params.ride_height_rear.min + (params.ride_height_rear.max - params.ride_height_rear.min) * heightPct / 100);
  }

  const dampingFront = rangePairFromPct(sheet.damping.replace(/^Rebote F\/R:\s*/, '').split('.')[0], 'front');
  const dampingRear = rangePairFromPct(sheet.damping.replace(/^Rebote F\/R:\s*/, '').split('.')[0], 'rear');
  setValue(params, 'rebound_front', dampingFront === null ? null : params.rebound_front.min + (params.rebound_front.max - params.rebound_front.min) * dampingFront / 100);
  setValue(params, 'rebound_rear', dampingRear === null ? null : params.rebound_rear.min + (params.rebound_rear.max - params.rebound_rear.min) * dampingRear / 100);

  const pressure = disciplinePressure(sheet, discipline);
  if (pressure) {
    setValue(params, 'tire_pressure_front', pressure[0]);
    setValue(params, 'tire_pressure_rear', pressure[1]);
  }

  const diff = differentialValues(sheet, vehicle.drivetrain);
  if (diff) {
    if (vehicle.drivetrain === 'FWD') {
      setValue(params, 'diff_front_accel', diff[0]);
      setValue(params, 'diff_front_decel', diff[1]);
    } else if (vehicle.drivetrain === 'RWD') {
      setValue(params, 'diff_rear_accel', diff[0]);
      setValue(params, 'diff_rear_decel', diff[1]);
    } else {
      setValue(params, 'diff_front_accel', diff[0]);
      setValue(params, 'diff_front_decel', diff[1]);
      setValue(params, 'diff_rear_accel', diff[2]);
      setValue(params, 'diff_rear_decel', diff[3]);
      const center = sheet.differential.match(/centro\s+(\d+)[–-](\d+)%/i);
      setValue(params, 'diff_center_balance', center ? midpoint([Number(center[1]), Number(center[2])]) : null);
    }
  }

  const brake = sheet.brakeBalance.match(/(\d+)[–-](\d+)%/);
  setValue(params, 'brake_balance', brake ? midpoint([Number(brake[1]), Number(brake[2])]) : null);
  setValue(params, 'brake_pressure', parseNumber(sheet.brakeBalance.match(/presión\s+(\d+)%/i)?.[1] || ''));

  tune.parameters = params;
  tune.versionTag = 'MASTER 37 / REV. 4.0';
  tune.notes = `MASTER 37 / ${sheet.id} / ${sheet.name} / ${sheet.sourceVersion}. Valores iniciales derivados determinísticamente de los rangos de la hoja y luego validados por el motor.`;
  tune.updatedAt = new Date().toISOString();
  return tune;
}
