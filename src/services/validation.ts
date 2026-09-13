import { Tune, Vehicle, ValidationResult, ValidationIssue } from '../types';
import { normalizeUnit, PARAMETER_UNITS } from './parameterUnits';

function stepAligned(value: number, min: number, step: number): boolean {
  if (!Number.isFinite(step) || step <= 0) return true;
  const n = (value - min) / step;
  return Math.abs(n - Math.round(n)) < 1e-7;
}

export function validateTune(tune: Tune, vehicle?: Vehicle): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const params = tune.parameters;
  const parts = vehicle?.parts;

  Object.entries(params).forEach(([key, p]) => {
    if (p.isAvailable === false || p.available === false) {
      warnings.push({ parameterKey: key, type: 'WARNING', message: `El parámetro "${p.name}" está marcado como no disponible y no debe aplicarse.`, currentValue: p.value, unit: p.unit });
      return;
    }

    if (p.min > p.max) {
      errors.push({ parameterKey: key, type: 'ERROR', message: `Rango inválido en "${p.name}": min > max.`, currentValue: p.value, allowedRange: [p.min, p.max], unit: p.unit });
      return;
    }

    if (p.value < p.min - 1e-9 || p.value > p.max + 1e-9) {
      errors.push({ parameterKey: key, type: 'ERROR', message: `El parámetro "${p.name}" está fuera del rango permitido.`, currentValue: p.value, allowedRange: [p.min, p.max], unit: p.unit });
    }

    if (!stepAligned(p.value, p.min, p.step)) {
      errors.push({ parameterKey: key, type: 'ERROR', message: `El parámetro "${p.name}" no respeta el step ${p.step}.`, currentValue: p.value, allowedRange: [p.min, p.max], unit: p.unit });
    }

    const normalized = normalizeUnit(p.unit);
    if (normalized === 'none' && p.unit.trim() !== '') {
      warnings.push({ parameterKey: key, type: 'WARNING', message: `Unidad no reconocida: ${p.unit}.`, currentValue: p.value, unit: p.unit });
    }
    const definition = PARAMETER_UNITS[normalized];
    if (definition?.min !== undefined && p.value < definition.min) {
      warnings.push({ parameterKey: key, type: 'WARNING', message: `El valor queda por debajo de la ventana genérica de ${definition.displayUnit}.`, currentValue: p.value, unit: p.unit });
    }
    if (definition?.max !== undefined && p.value > definition.max) {
      warnings.push({ parameterKey: key, type: 'WARNING', message: `El valor queda por encima de la ventana genérica de ${definition.displayUnit}.`, currentValue: p.value, unit: p.unit });
    }
  });

  if (parts) {
    if (!parts.frontAeroAdjustable && params.aero_front?.available) warnings.push({ parameterKey: 'aero_front', type: 'WARNING', message: 'Aero delantero ajustable no instalado.', unit: params.aero_front.unit });
    if (!parts.rearAeroAdjustable && params.aero_rear?.available) warnings.push({ parameterKey: 'aero_rear', type: 'WARNING', message: 'Aero trasero ajustable no instalado.', unit: params.aero_rear.unit });
    if (!parts.frontArbAdjustable && params.arb_front?.available) warnings.push({ parameterKey: 'arb_front', type: 'WARNING', message: 'Barra estabilizadora delantera ajustable no instalada.', unit: params.arb_front.unit });
    if (!parts.rearArbAdjustable && params.arb_rear?.available) warnings.push({ parameterKey: 'arb_rear', type: 'WARNING', message: 'Barra estabilizadora trasera ajustable no instalada.', unit: params.arb_rear.unit });
    if (!parts.differentialAdjustable) ['diff_front_accel','diff_front_decel','diff_rear_accel','diff_rear_decel','diff_center_balance'].forEach((k) => {
      if (params[k]?.available) warnings.push({ parameterKey: k, type: 'WARNING', message: 'Diferencial ajustable no instalado.', unit: params[k].unit });
    });
    if (!parts.brakesAdjustable && params.brake_balance?.available) warnings.push({ parameterKey: 'brake_balance', type: 'WARNING', message: 'Frenos ajustables no instalados.', unit: params.brake_balance.unit });
  }

  if (params.bump_front && params.rebound_front && params.bump_front.value > params.rebound_front.value) warnings.push({ parameterKey: 'bump_front', type: 'WARNING', message: 'Bump delantero supera Rebound; revisar relación de amortiguación.', currentValue: params.bump_front.value, unit: params.bump_front.unit });
  if (params.bump_rear && params.rebound_rear && params.bump_rear.value > params.rebound_rear.value) warnings.push({ parameterKey: 'bump_rear', type: 'WARNING', message: 'Bump trasero supera Rebound; revisar relación de amortiguación.', currentValue: params.bump_rear.value, unit: params.bump_rear.unit });

  if (params.tire_pressure_front) {
    const p = params.tire_pressure_front.value;
    if (p < 1.38 && tune.discipline !== 'DRAG') warnings.push({ parameterKey: 'tire_pressure_front', type: 'WARNING', message: `Presión delantera muy baja (${p} bar).`, currentValue: p, unit: 'bar' });
    if (p > 2.48 && tune.discipline !== 'DRAG' && tune.discipline !== 'DRIFT') warnings.push({ parameterKey: 'tire_pressure_front', type: 'WARNING', message: `Presión delantera alta (${p} bar).`, currentValue: p, unit: 'bar' });
  }

  if (params.camber_front && params.camber_front.value > 0) errors.push({ parameterKey: 'camber_front', type: 'ERROR', message: 'Camber delantero positivo; revisar reglaje.', currentValue: params.camber_front.value, unit: params.camber_front.unit });

  if (!tune.id || !tune.vehicleId || !tune.discipline) errors.push({ parameterKey: '__tune__', type: 'ERROR', message: 'El tune requiere id, vehicleId y discipline.' });

  return { isValid: errors.length === 0, errors, warnings };
}
