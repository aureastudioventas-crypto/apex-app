/**
 * APEX TUNING ENGINE — FH5
 * SERVICIO DE VALIDACIÓN DE INGENIERÍA V1.1
 *
 * Valida la coherencia cinemática, rangos de Forza Horizon 5, unidades
 * y dependencias de piezas instaladas para cualquier reglaje.
 */

import { Tune, Vehicle, ValidationResult, ValidationIssue } from '../types';

export function validateTune(tune: Tune, vehicle?: Vehicle): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const params = tune.parameters;
  const parts = vehicle?.parts;

  // 1. Validar Rangos y Unidades de Parámetros FH5
  Object.entries(params).forEach(([key, p]) => {
    // Si la pieza no está instalada, verificar disponibilidad
    if (p.min !== undefined && p.max !== undefined) {
      if (p.value < p.min - 0.001) {
        errors.push({
          parameterKey: key,
          type: 'ERROR',
          message: `El parámetro "${p.name}" (${p.value} ${p.unit}) está por debajo del rango mínimo permitido en FH5 (${p.min} ${p.unit}).`,
          currentValue: p.value,
          allowedRange: [p.min, p.max],
          unit: p.unit,
        });
      } else if (p.value > p.max + 0.001) {
        errors.push({
          parameterKey: key,
          type: 'ERROR',
          message: `El parámetro "${p.name}" (${p.value} ${p.unit}) excede el límite máximo permitido en FH5 (${p.max} ${p.unit}).`,
          currentValue: p.value,
          allowedRange: [p.min, p.max],
          unit: p.unit,
        });
      }
    }
  });

  // 2. Validar Dependencias de Piezas Instaladas
  if (parts) {
    if (!parts.frontAeroAdjustable && params.aero_front?.available) {
      warnings.push({
        parameterKey: 'aero_front',
        type: 'WARNING',
        message: 'El parachoques delantero ajustable no está instalado en el vehículo. Los valores de downforce frontal no tendrán efecto en pista.',
        unit: 'kgf',
      });
    }

    if (!parts.rearAeroAdjustable && params.aero_rear?.available) {
      warnings.push({
        parameterKey: 'aero_rear',
        type: 'WARNING',
        message: 'El alerón trasero ajustable no está instalado. Los valores de downforce trasero permanecerán en stock.',
        unit: 'kgf',
      });
    }

    if (!parts.frontArbAdjustable && params.arb_front?.available) {
      warnings.push({
        parameterKey: 'arb_front',
        type: 'WARNING',
        message: 'La barra estabilizadora delantera ajustable no está instalada en el vehículo.',
        unit: '1.0 - 65.0',
      });
    }

    if (!parts.rearArbAdjustable && params.arb_rear?.available) {
      warnings.push({
        parameterKey: 'arb_rear',
        type: 'WARNING',
        message: 'La barra estabilizadora trasera ajustable no está instalada en el vehículo.',
        unit: '1.0 - 65.0',
      });
    }

    if (!parts.differentialAdjustable) {
      ['diff_front_accel', 'diff_rear_accel', 'diff_center_balance'].forEach((k) => {
        if (params[k]?.available) {
          warnings.push({
            parameterKey: k,
            type: 'WARNING',
            message: 'El diferencial de carreras ajustable no está equipado. Se utilizará el ratio de fábrica.',
            unit: '%',
          });
        }
      });
    }

    if (!parts.brakesAdjustable && params.brake_balance?.available) {
      warnings.push({
        parameterKey: 'brake_balance',
        type: 'WARNING',
        message: 'Frenos de carreras ajustables no instalados; balance y presión fijos de fábrica.',
        unit: '%',
      });
    }
  }

  // 3. Reglas de Coherencia Cinemática Motorsport
  // Compresión vs Extensión: Bump no debería ser mayor a Rebound en FH5
  if (params.bump_front && params.rebound_front) {
    if (params.bump_front.value > params.rebound_front.value) {
      warnings.push({
        parameterKey: 'bump_front',
        type: 'WARNING',
        message: `La compresión delantera (${params.bump_front.value}) es superior a la extensión (${params.rebound_front.value}). En FH5 se recomienda Bump entre 50% y 70% de Rebound para evitar rebotes parásitos.`,
        currentValue: params.bump_front.value,
        unit: '1.0 - 20.0',
      });
    }
  }

  if (params.bump_rear && params.rebound_rear) {
    if (params.bump_rear.value > params.rebound_rear.value) {
      warnings.push({
        parameterKey: 'bump_rear',
        type: 'WARNING',
        message: `La compresión trasera (${params.bump_rear.value}) es superior a la extensión (${params.rebound_rear.value}). Riesgo de rebote violento en pianos.`,
        currentValue: params.bump_rear.value,
        unit: '1.0 - 20.0',
      });
    }
  }

  // Presión de neumáticos fuera de ventanas habituales
  if (params.tire_pressure_front) {
    const pFront = params.tire_pressure_front.value;
    if (pFront < 20.0 && tune.discipline !== 'DRAG') {
      warnings.push({
        parameterKey: 'tire_pressure_front',
        type: 'WARNING',
        message: `Presión delantera muy baja (${pFront} psi). Riesgo de flaneo excesivo y calentamiento súbito en circuito.`,
        currentValue: pFront,
        unit: 'psi',
      });
    } else if (pFront > 36.0 && tune.discipline !== 'DRAG' && tune.discipline !== 'DRIFT') {
      warnings.push({
        parameterKey: 'tire_pressure_front',
        type: 'WARNING',
        message: `Presión delantera alta (${pFront} psi). Reduce el parche de contacto efectivo en curva.`,
        currentValue: pFront,
        unit: 'psi',
      });
    }
  }

  // Camber positivo: casi siempre un error en asfalto/tierra
  if (params.camber_front && params.camber_front.value > 0.0) {
    errors.push({
      parameterKey: 'camber_front',
      type: 'ERROR',
      message: `Camber delantero positivo (${params.camber_front.value}°). Reduce severamente el apoyo en virajes.`,
      currentValue: params.camber_front.value,
      unit: '°',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
