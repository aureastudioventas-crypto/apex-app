/**
 * APEX TUNING ENGINE — FH5
 * BASELINE ENGINE DETERMINISTA
 * Motor de cálculo físico basado en reglas y fórmulas oficiales para Forza Horizon 5
 */

import {
  Vehicle,
  Discipline,
  DriverProfile,
  HardwareProfile,
  TuneParameter,
  VehicleBalance,
  Tune,
} from '../types';

export const DEFAULT_DRIVER_PROFILE: DriverProfile = {
  cornerEntry: 50,
  rotation: 50,
  cornerExit: 50,
  oversteerTolerance: 50,
  steeringResponse: 50,
  sensitivity: 50,
};

export const DEFAULT_HARDWARE_PROFILE: HardwareProfile = {
  deviceType: 'CONTROLADOR',
  assists: {
    abs: true,
    tcs: false,
    stm: false,
    steering: 'Simulación',
    transmission: 'Manual',
    clutch: false,
    drivingLine: 'Solo Frenado',
    rewind: true,
  },
};

export function generateBaselineTune(
  vehicle: Vehicle,
  discipline: Discipline = 'ROAD RACING',
  driverProfile: DriverProfile = DEFAULT_DRIVER_PROFILE,
  hardwareProfile: HardwareProfile = DEFAULT_HARDWARE_PROFILE
): Tune {
  const parts = vehicle.parts;
  const weight = vehicle.weightKg;
  const frontDist = vehicle.frontWeightRatio; // e.g. 0.52
  const rearDist = 1 - frontDist; // e.g. 0.48
  const drivetrain = vehicle.drivetrain; // 'FWD' | 'RWD' | 'AWD'

  // Driver profile modifiers (-0.2 to +0.2 scale)
  const rotationBias = (driverProfile.rotation - 50) / 100; // -0.5 to +0.5
  const entryBias = (driverProfile.cornerEntry - 50) / 100;
  const exitBias = (driverProfile.cornerExit - 50) / 100;
  const oversteerTol = (driverProfile.oversteerTolerance - 50) / 100;

  // 1. NEUMÁTICOS (Presión en psi)
  let baseTireFront = 28.5;
  let baseTireRear = 28.5;

  switch (discipline) {
    case 'ROAD RACING':
      baseTireFront = 28.5;
      baseTireRear = 28.0;
      break;
    case 'STREET SCENE':
      baseTireFront = 27.5;
      baseTireRear = 27.5;
      break;
    case 'DIRT':
      baseTireFront = 25.0;
      baseTireRear = 24.5;
      break;
    case 'CROSS COUNTRY':
      baseTireFront = 22.5;
      baseTireRear = 22.0;
      break;
    case 'DRAG':
      baseTireFront = 45.0;
      baseTireRear = 18.0;
      break;
    case 'DRIFT':
      baseTireFront = 29.0;
      baseTireRear = 38.0 + (oversteerTol * 6);
      break;
    default:
      baseTireFront = 28.0;
      baseTireRear = 28.0;
  }

  // Drivetrain tire tweak
  if (drivetrain === 'FWD') {
    baseTireFront -= 0.5; // más tracción delantera
    baseTireRear += 1.0;
  } else if (drivetrain === 'RWD' && discipline !== 'DRIFT') {
    baseTireRear -= 0.5;
  }

  // 2. ALINEACIÓN (Camber, Toe, Caster)
  let camberFront = -1.8;
  let camberRear = -1.2;
  let toeFront = 0.0;
  let toeRear = 0.0;
  let caster = 6.0;

  if (discipline === 'ROAD RACING') {
    camberFront = -1.8 - (rotationBias * 0.4);
    camberRear = -1.2;
    toeFront = rotationBias > 0.1 ? 0.1 : 0.0;
    toeRear = -0.1;
    caster = 6.2;
  } else if (discipline === 'STREET SCENE') {
    camberFront = -1.6;
    camberRear = -1.1;
    toeFront = 0.0;
    toeRear = 0.0;
    caster = 6.0;
  } else if (discipline === 'DIRT') {
    camberFront = -1.0;
    camberRear = -0.6;
    toeFront = 0.1;
    toeRear = 0.0;
    caster = 5.5;
  } else if (discipline === 'CROSS COUNTRY') {
    camberFront = -0.5;
    camberRear = -0.4;
    toeFront = 0.0;
    toeRear = 0.0;
    caster = 5.2;
  } else if (discipline === 'DRAG') {
    camberFront = 0.0;
    camberRear = 0.0;
    toeFront = 0.0;
    toeRear = 0.0;
    caster = 7.0;
  } else if (discipline === 'DRIFT') {
    camberFront = -4.2;
    camberRear = -0.6;
    toeFront = 0.2;
    toeRear = -0.1;
    caster = 7.0;
  }

  // 3. BARRAS ESTABILIZADORAS (ARB: escala 1.0 a 65.0 en FH5)
  // Fórmula base FH5: (Max - Min) * Distribución + Min
  // Donde ARB range es 65 - 1 = 64
  let arbFront = 1.0 + 64.0 * frontDist;
  let arbRear = 1.0 + 64.0 * rearDist;

  if (discipline === 'ROAD RACING') {
    // Para eliminar subviraje en FH5, aflojamos delante y tensamos detrás
    arbFront = Math.max(10, arbFront * 0.65);
    arbRear = Math.min(65, arbRear * 0.95 + (rotationBias * 8));
  } else if (discipline === 'STREET SCENE') {
    arbFront = Math.max(8, arbFront * 0.60);
    arbRear = Math.min(60, arbRear * 0.85 + (rotationBias * 6));
  } else if (discipline === 'DIRT') {
    arbFront = Math.max(5, arbFront * 0.40);
    arbRear = Math.min(45, arbRear * 0.50);
  } else if (discipline === 'CROSS COUNTRY') {
    // Barras ultra blandas para evitar que los aterrizajes descoloquen el coche
    arbFront = 2.5;
    arbRear = 3.5;
  } else if (discipline === 'DRAG') {
    arbFront = 1.0;
    arbRear = 65.0;
  } else if (discipline === 'DRIFT') {
    arbFront = 40.0;
    arbRear = 22.0 - (oversteerTol * 6);
  }

  // Drivetrain ARB correction
  if (drivetrain === 'FWD') {
    arbFront = Math.max(8, arbFront - 6.0);
    arbRear = Math.min(60, arbRear + 8.0); // trasera dura para inducir rotación
  } else if (drivetrain === 'AWD' && discipline !== 'CROSS COUNTRY') {
    // Regla de oro AWD en FH5: la barra trasera SIEMPRE debe ser más rígida que la delantera
    if (arbRear <= arbFront) {
      arbRear = arbFront + 5.0 + (rotationBias * 4);
    }
  }

  // 4. MUELLES (Rigidez en kgf/mm)
  // En FH5 los muelles de carreras estándar rondan 80 a 220 kgf/mm según masa
  // Base: peso en kg * factor
  const springBaseFactor = discipline === 'CROSS COUNTRY' ? 0.045 : discipline === 'DIRT' ? 0.07 : 0.105;
  let springsFront = weight * frontDist * springBaseFactor;
  let springsRear = weight * rearDist * springBaseFactor;

  if (discipline === 'DRAG') {
    springsFront = 25.0;
    springsRear = 220.0;
  }

  // 5. ALTURA DE CARROCERÍA (cm)
  let rideHeightFront = 9.5;
  let rideHeightRear = 9.5;

  if (discipline === 'ROAD RACING') {
    rideHeightFront = 8.0;
    rideHeightRear = 8.2;
  } else if (discipline === 'STREET SCENE') {
    rideHeightFront = 10.0;
    rideHeightRear = 10.2;
  } else if (discipline === 'DIRT') {
    rideHeightFront = 16.5;
    rideHeightRear = 17.0;
  } else if (discipline === 'CROSS COUNTRY') {
    rideHeightFront = 26.5;
    rideHeightRear = 27.0;
  } else if (discipline === 'DRAG') {
    rideHeightFront = 18.0;
    rideHeightRear = 7.0;
  } else if (discipline === 'DRIFT') {
    rideHeightFront = 8.5;
    rideHeightRear = 8.8;
  }

  // 6. AMORTIGUADORES: REBOTE (Rebound 1.0 - 20.0) y COMPRESIÓN (Bump 1.0 - 20.0)
  // Regla de oro FH5: Rebound base según distribución; Bump = 55% a 65% del Rebound
  let reboundFront = 1.0 + 19.0 * frontDist;
  let reboundRear = 1.0 + 19.0 * rearDist;

  if (discipline === 'ROAD RACING') {
    reboundFront = Math.min(17.0, Math.max(8.0, reboundFront * 1.1));
    reboundRear = Math.min(17.0, Math.max(7.5, reboundRear * 1.05));
  } else if (discipline === 'CROSS COUNTRY') {
    reboundFront = 6.2;
    reboundRear = 6.0;
  } else if (discipline === 'DIRT') {
    reboundFront = 7.8;
    reboundRear = 7.5;
  } else if (discipline === 'DRAG') {
    reboundFront = 1.0;
    reboundRear = 19.5;
  }

  // Bump calculation (55% - 65% of rebound)
  const bumpFactor = discipline === 'CROSS COUNTRY' ? 0.75 : 0.60;
  let bumpFront = reboundFront * bumpFactor;
  let bumpRear = reboundRear * bumpFactor;

  // 7. AERODINÁMICA (Downforce en kgf)
  let aeroFront = 110;
  let aeroRear = 145;

  if (discipline === 'ROAD RACING') {
    aeroFront = 135;
    aeroRear = 180 + (oversteerTol < 0 ? 30 : 0);
  } else if (discipline === 'DIRT' || discipline === 'CROSS COUNTRY') {
    aeroFront = 45;
    aeroRear = 60;
  } else if (discipline === 'DRAG') {
    aeroFront = 25;
    aeroRear = 25;
  } else if (discipline === 'DRIFT') {
    aeroFront = 65;
    aeroRear = 35;
  }

  // 8. FRENOS (Balance % y Presión %)
  let brakeBalance = 52.0; // 50% es centro
  let brakePressure = 100.0;

  if (discipline === 'DIRT') brakeBalance = 49.0;
  if (discipline === 'DRIFT') brakeBalance = 46.0;

  // 9. DIFERENCIAL (% Aceleración y % Deceleración)
  let diffFrontAccel = 35;
  let diffFrontDecel = 5;
  let diffRearAccel = 65;
  let diffRearDecel = 25;
  let diffCenterBalance = 68; // % Rear Bias en AWD

  if (drivetrain === 'FWD') {
    diffFrontAccel = 40 + (exitBias * 15);
    diffFrontDecel = 0;
  } else if (drivetrain === 'RWD') {
    if (discipline === 'DRIFT') {
      diffRearAccel = 100;
      diffRearDecel = 100;
    } else if (discipline === 'DRAG') {
      diffRearAccel = 100;
      diffRearDecel = 100;
    } else {
      diffRearAccel = 60 + (exitBias * 15);
      diffRearDecel = 20 + (entryBias * -10);
    }
  } else if (drivetrain === 'AWD') {
    if (discipline === 'ROAD RACING') {
      diffFrontAccel = 28;
      diffFrontDecel = 0;
      diffRearAccel = 72 + (exitBias * 12);
      diffRearDecel = 22;
      diffCenterBalance = 68 + (rotationBias * 7); // 68-75% atrás para rotación FH5
    } else if (discipline === 'DIRT') {
      diffFrontAccel = 50;
      diffFrontDecel = 10;
      diffRearAccel = 80;
      diffRearDecel = 30;
      diffCenterBalance = 60;
    } else if (discipline === 'CROSS COUNTRY') {
      diffFrontAccel = 65;
      diffFrontDecel = 15;
      diffRearAccel = 85;
      diffRearDecel = 35;
      diffCenterBalance = 52; // casi 50/50 para fuerza bruta
    } else if (discipline === 'DRIFT') {
      diffFrontAccel = 45;
      diffFrontDecel = 0;
      diffRearAccel = 100;
      diffRearDecel = 90;
      diffCenterBalance = 85;
    }
  }

  // 10. TRANSMISIÓN (Final Drive y marchas)
  const finalDrive = discipline === 'DRAG' ? 2.85 : discipline === 'DIRT' ? 4.10 : 3.65;
  const gearRatios: number[] = [3.45, 2.35, 1.72, 1.34, 1.08, 0.90];
  if (vehicle.gearsCount > 6) {
    gearRatios.push(0.78);
  }

  // Build parameters dictionary with explicit FH5 units, constraints, and visibility flags
  const parameters: Record<string, TuneParameter> = {
    tire_pressure_front: {
      key: 'tire_pressure_front',
      category: 'TIRES',
      name: 'Presión Delantera',
      value: Number(baseTireFront.toFixed(1)),
      unit: 'psi',
      min: 15.0,
      max: 55.0,
      step: 0.5,
      target: 'Maximizar superficie de agarre y adherencia lateral en giro de entrada.',
      why: `Calculado para ${vehicle.weightKg} kg con un ${(frontDist * 100).toFixed(0)}% de peso en el eje delantero en disciplina ${discipline}.`,
      effectIncrease: 'Menor deformación del neumático, dirección más rápida, pero menor agarre máximo.',
      effectDecrease: 'Mayor huella de contacto y agarre, pero calentamiento más rápido y flanco perezoso.',
      relatedSymptoms: ['Subviraje', 'Desgaste térmico irregular'],
      nextAction: 'Si subvira en curvones rápidos, reduce 0.5 psi.',
      isAvailable: true,
    },
    tire_pressure_rear: {
      key: 'tire_pressure_rear',
      category: 'TIRES',
      name: 'Presión Trasera',
      value: Number(baseTireRear.toFixed(1)),
      unit: 'psi',
      min: 15.0,
      max: 55.0,
      step: 0.5,
      target: 'Garantizar tracción longitudinal y balance térmico del eje posterior.',
      why: `Soporta el ${(rearDist * 100).toFixed(0)}% de la masa estática más transferencia de carga bajo aceleración.`,
      effectIncrease: 'Menor agarre trasero y menor resistencia al rodaje.',
      effectDecrease: 'Mayor tracción al acelerar en salida pero mayor resistencia a la rodadura.',
      relatedSymptoms: ['Sobreviraje', 'Wheelspin'],
      nextAction: 'Si hay wheelspin en salida, reduce 1.0 psi.',
      isAvailable: true,
    },
    camber_front: {
      key: 'camber_front',
      category: 'ALIGNMENT',
      name: 'Camber Delantero',
      value: Number(camberFront.toFixed(1)),
      unit: '°',
      min: -5.0,
      max: 0.0,
      step: 0.1,
      target: 'Mantener la huella del neumático plana cuando el chasis apoya con fuerza centrífuga.',
      why: `El vehículo requiere mayor capacidad de apoyo lateral en eje delantero para neutralizar subviraje.`,
      effectIncrease: 'Más negativo da mayor agarre en curvas rápidas apoyadas; menos negativo mejora la frenada recta.',
      effectDecrease: 'Camber más cercano a 0° mejora frenada recta pero pierde agarre lateral en virajes fuertes.',
      relatedSymptoms: ['Subviraje en mitad de curva', 'Temperatura exterior de neumático baja'],
      nextAction: 'Si el auto sigue subvirando a mitad de curva, aumentar a -2.1°.',
      isAvailable: parts.suspensionAdjustable,
    },
    camber_rear: {
      key: 'camber_rear',
      category: 'ALIGNMENT',
      name: 'Camber Trasero',
      value: Number(camberRear.toFixed(1)),
      unit: '°',
      min: -5.0,
      max: 0.0,
      step: 0.1,
      target: 'Estabilidad de la zaga en apoyos prolongados sin comprometer la tracción de salida.',
      why: `Equilibrado respecto al camber delantero para conservar el eje motriz con huella plana.`,
      effectIncrease: 'Más agarre lateral trasero, menos tracción en línea recta.',
      effectDecrease: 'Más tracción longitudinal en recta pero la cola puede deslizar en curvones.',
      relatedSymptoms: ['Sobreviraje de mitad de curva'],
      nextAction: 'Si la zaga se insinúa en curvas rápidas, añadir -0.3° de camber.',
      isAvailable: parts.suspensionAdjustable,
    },
    toe_front: {
      key: 'toe_front',
      category: 'ALIGNMENT',
      name: 'Toe Delantero (Convergencia)',
      value: Number(toeFront.toFixed(1)),
      unit: '°',
      min: -5.0,
      max: 5.0,
      step: 0.1,
      target: 'Afinar la respuesta inicial de la dirección al iniciar el giro.',
      why: `Un valor levemente divergente (-0.1° Out) agiliza la entrada; 0.0° otorga estabilidad total.`,
      effectIncrease: 'Convergencia positiva estabiliza la recta pero hace la dirección lenta.',
      effectDecrease: 'Divergencia (negativa en algunos juegos, Out) hace el giro instantáneo pero nervioso en recta.',
      relatedSymptoms: ['Dirección perezosa', 'Inestabilidad en recta'],
      nextAction: 'Mantener neutro salvo necesidad de agilidad extrema.',
      isAvailable: parts.suspensionAdjustable,
    },
    toe_rear: {
      key: 'toe_rear',
      category: 'ALIGNMENT',
      name: 'Toe Trasero (Convergencia)',
      value: Number(toeRear.toFixed(1)),
      unit: '°',
      min: -5.0,
      max: 5.0,
      step: 0.1,
      target: 'Fijar el tren trasero para evitar latigazos en frenadas y aceleraciones violentas.',
      why: `Un toque de convergencia negativa (-0.1° In) asienta la zaga en frenada.`,
      effectIncrease: 'Mayor ángulo de convergencia estabiliza pero produce arrastre parásito.',
      effectDecrease: 'Zaga suelta y propensa a sobreviraje.',
      relatedSymptoms: ['Auto se mueve de atrás al frenar'],
      nextAction: 'Si la trasera baila al frenar a 200 km/h, ajustar a -0.2°.',
      isAvailable: parts.suspensionAdjustable,
    },
    caster: {
      key: 'caster',
      category: 'ALIGNMENT',
      name: 'Caster (Ángulo de Avance)',
      value: Number(caster.toFixed(1)),
      unit: '°',
      min: 1.0,
      max: 7.0,
      step: 0.1,
      target: 'Generar camber dinámico al girar y auto-centrado del volante.',
      why: `6.0° - 6.5° entrega estabilidad en alta velocidad y peso natural al contravolantear.`,
      effectIncrease: 'Dirección más firme, más camber en curva cerrada, auto-retorno rápido.',
      effectDecrease: 'Dirección blanda y ligera pero menor estabilidad a alta velocidad.',
      relatedSymptoms: ['Falta de auto-centrado', 'Dirección pesada'],
      nextAction: 'Subir a 6.5° si el auto flota en línea recta.',
      isAvailable: parts.suspensionAdjustable,
    },
    arb_front: {
      key: 'arb_front',
      category: 'ARB',
      name: 'Barra Estabilizadora Delantera',
      value: Number(arbFront.toFixed(1)),
      unit: '1.0 - 65.0',
      min: 1.0,
      max: 65.0,
      step: 0.1,
      target: 'Controlar la rigidez torsional lateral delantera y regular el subviraje mecánico.',
      why: `Ajuste determinista compensado para el peso delantero ${(frontDist * 100).toFixed(0)}% y tracción ${drivetrain}.`,
      effectIncrease: 'Disminuye el agarre relativo del eje delantero; produce subviraje.',
      effectDecrease: 'Aumenta el agarre del eje delantero en curvas apoyadas; reduce subviraje.',
      relatedSymptoms: ['Subviraje en mitad de curva'],
      nextAction: 'Si el auto se niega a girar en el vértice, reducir 3.0 puntos.',
      isAvailable: parts.frontArbAdjustable,
    },
    arb_rear: {
      key: 'arb_rear',
      category: 'ARB',
      name: 'Barra Estabilizadora Trasera',
      value: Number(arbRear.toFixed(1)),
      unit: '1.0 - 65.0',
      min: 1.0,
      max: 65.0,
      step: 0.1,
      target: 'Inducir rotación en la carrocería para compensar el reparto de masas.',
      why: `En ${drivetrain}, la barra trasera más rígida ayuda a que el vehículo gire en lugar de empujar hacia afuera.`,
      effectIncrease: 'Aumenta la rotación del auto; si es excesivo causa sobreviraje violento.',
      effectDecrease: 'Asienta la parte trasera; reduce sobreviraje.',
      relatedSymptoms: ['Sobreviraje en mitad de curva', 'Falta de rotación'],
      nextAction: 'Si falta rotación al entrar, aumentar 2.0 a 4.0 puntos.',
      isAvailable: parts.rearArbAdjustable,
    },
    springs_front: {
      key: 'springs_front',
      category: 'SPRINGS',
      name: 'Muelles Delanteros',
      value: Number(springsFront.toFixed(1)),
      unit: 'kgf/mm',
      min: 10.0,
      max: 300.0,
      step: 0.5,
      target: 'Sostener la masa del motor (${frontDist * 100}%) y controlar el cabeceo en frenada.',
      why: `Fórmula FH5: Masa delantera corregida por frecuencia de resonancia de disciplina ${discipline}.`,
      effectIncrease: 'Menor balanceo y cabeceo, pero absorbe peor los baches y pianos.',
      effectDecrease: 'Mayor grip mecánico en suelo irregular, pero mayor cabeceo y riesgo de hacer tope.',
      relatedSymptoms: ['El auto toca fondo (Bottom out)', 'Rebota en apoyos'],
      nextAction: 'Si toca fondo al frenar, aumentar 10 kgf/mm.',
      isAvailable: parts.suspensionAdjustable,
    },
    springs_rear: {
      key: 'springs_rear',
      category: 'SPRINGS',
      name: 'Muelles Traseros',
      value: Number(springsRear.toFixed(1)),
      unit: 'kgf/mm',
      min: 10.0,
      max: 300.0,
      step: 0.5,
      target: 'Absorber la transferencia de peso en aceleración y mantener equilibrio plano.',
      why: `Calibrado para soportar ${(rearDist * 100).toFixed(0)}% del peso sin hundimiento excesivo en salida.`,
      effectIncrease: 'Reacción más seca, menor agachada en salida pero menor tracción en piso rugoso.',
      effectDecrease: 'El auto se sienta mejor al acelerar aumentando tracción, pero puede balancear demasiado.',
      relatedSymptoms: ['Hundimiento excesivo en aceleración'],
      nextAction: 'Si el coche se sienta demasiado al acelerar, endurecer 8 kgf/mm.',
      isAvailable: parts.suspensionAdjustable,
    },
    ride_height_front: {
      key: 'ride_height_front',
      category: 'SPRINGS',
      name: 'Altura Delantera',
      value: Number(rideHeightFront.toFixed(1)),
      unit: 'cm',
      min: 5.0,
      max: 35.0,
      step: 0.1,
      target: 'Centro de gravedad lo más bajo posible sin que el splitter o los brazos hagan tope.',
      why: `Calibrado para el perfil ${discipline} para permitir recorrido útil sin rozar el asfalto o tierra.`,
      effectIncrease: 'Más recorrido para baches y saltos, pero mayor balanceo por CdG alto.',
      effectDecrease: 'Menor balanceo y mejor efecto aerodinámico, pero riesgo de tocar fondo.',
      relatedSymptoms: ['Chasis roza el suelo', 'Pérdida de tracción en baches'],
      nextAction: 'Si roza el suelo en compresión máxima, subir 0.5 cm.',
      isAvailable: parts.suspensionAdjustable,
    },
    ride_height_rear: {
      key: 'ride_height_rear',
      category: 'SPRINGS',
      name: 'Altura Trasera',
      value: Number(rideHeightRear.toFixed(1)),
      unit: 'cm',
      min: 5.0,
      max: 35.0,
      step: 0.1,
      target: 'Evitar arrastre del difusor trasero y mantener geometría neutra en semiejes.',
      why: `Ligeramente superior o igual a la delantera para favorecer la aerodinámica pasiva y evitar tope.`,
      effectIncrease: 'Más recorrido disponible en aceleración.',
      effectDecrease: 'Menor centro de gravedad.',
      relatedSymptoms: ['El difusor golpea en badenes'],
      nextAction: 'Ajustar a la par con la delantera.',
      isAvailable: parts.suspensionAdjustable,
    },
    rebound_front: {
      key: 'rebound_front',
      category: 'DAMPING',
      name: 'Extensión Delantera (Rebound)',
      value: Number(reboundFront.toFixed(1)),
      unit: '1.0 - 20.0',
      min: 1.0,
      max: 20.0,
      step: 0.1,
      target: 'Frenar la velocidad con la que los muelles delanteros se estiran tras una compresión.',
      why: `Evita que el morro se levante con violencia al soltar freno o al superar ondulaciones.`,
      effectIncrease: 'Chasis más pegado al suelo, pero si es excesivo empaqueta la suspensión hacia abajo.',
      effectDecrease: 'Extensión más libre pero el auto rebota como una pelota.',
      relatedSymptoms: ['El auto rebota repetidamente'],
      nextAction: 'Si el frente rebota al salir del bache, subir 1.0 punto.',
      isAvailable: parts.suspensionAdjustable,
    },
    rebound_rear: {
      key: 'rebound_rear',
      category: 'DAMPING',
      name: 'Extensión Trasera (Rebound)',
      value: Number(reboundRear.toFixed(1)),
      unit: '1.0 - 20.0',
      min: 1.0,
      max: 20.0,
      step: 0.1,
      target: 'Controlar el rebote del tren trasero al transferir masa hacia adelante en frenada.',
      why: `Mantiene plantado el eje posterior para evitar que la zaga se descargue súbitamente.`,
      effectIncrease: 'Evita que la cola se levante rápido en frenadas fuertes.',
      effectDecrease: 'Permite que la rueda recupere contacto rápidamente.',
      relatedSymptoms: ['La cola salta al frenar en bajada'],
      nextAction: 'Si la trasera se descuelga en frenadas en bajada, subir 0.8 puntos.',
      isAvailable: parts.suspensionAdjustable,
    },
    bump_front: {
      key: 'bump_front',
      category: 'DAMPING',
      name: 'Compresión Delantera (Bump)',
      value: Number(bumpFront.toFixed(1)),
      unit: '1.0 - 20.0',
      min: 1.0,
      max: 20.0,
      step: 0.1,
      target: 'Frenar la rapidez de hundimiento al frenar o pasar pianos.',
      why: `Regla de oro FH5: Calculado al ${(bumpFactor * 100).toFixed(0)}% del valor de Extensión (${reboundFront.toFixed(1)}).`,
      effectIncrease: 'Soporta mejor la frenada inicial, pero salta hacia los lados en pianos duros.',
      effectDecrease: 'Pasa pianos y baches con suavidad, pero cabecea rápido al tocar freno.',
      relatedSymptoms: ['Inestabilidad al pisar bordillos'],
      nextAction: 'Si el auto salta al tocar el piano interior de la curva, bajar 1.0 punto.',
      isAvailable: parts.suspensionAdjustable,
    },
    bump_rear: {
      key: 'bump_rear',
      category: 'DAMPING',
      name: 'Compresión Trasera (Bump)',
      value: Number(bumpRear.toFixed(1)),
      unit: '1.0 - 20.0',
      min: 1.0,
      max: 20.0,
      step: 0.1,
      target: 'Soportar la carga de aceleración cuando el peso se desplaza hacia atrás.',
      why: `Proporcional a la extensión trasera ${(bumpFactor * 100).toFixed(0)}%.`,
      effectIncrease: 'Menor hundimiento en salida pero puede perder tracción si el suelo está bacheado.',
      effectDecrease: 'Mayor absorción en suelo roto.',
      relatedSymptoms: ['Pérdida de tracción en aceleración rugosa'],
      nextAction: 'Mantener entre 50% y 65% del Rebound trasero.',
      isAvailable: parts.suspensionAdjustable,
    },
    aero_front: {
      key: 'aero_front',
      category: 'AERO',
      name: 'Aerodinámica Delantera',
      value: Math.round(aeroFront),
      unit: 'kgf',
      min: 20.0,
      max: 500.0,
      step: 1.0,
      target: 'Añadir carga vertical al eje delantero a más de 120 km/h para evitar subviraje a alta velocidad.',
      why: `Equilibrado para las demandas de carga aerodinámica de ${discipline}.`,
      effectIncrease: 'Mucho más agarre en curvas de 4ta y 5ta marcha pero mayor resistencia al avance.',
      effectDecrease: 'Mayor velocidad punta en rectas largas pero menor agarre en curvas rápidas.',
      relatedSymptoms: ['Subviraje a más de 160 km/h'],
      nextAction: 'Aumentar 10-15 kgf si el auto se va de frente en curvas de alta velocidad.',
      isAvailable: parts.frontAeroAdjustable,
    },
    aero_rear: {
      key: 'aero_rear',
      category: 'AERO',
      name: 'Aerodinámica Trasera',
      value: Math.round(aeroRear),
      unit: 'kgf',
      min: 20.0,
      max: 500.0,
      step: 1.0,
      target: 'Plantar el eje posterior a alta velocidad para estabilidad absoluta.',
      why: `Carga suficiente para evitar sobreviraje en curvas rápidas sin frenar excesivamente en recta.`,
      effectIncrease: 'Estabilidad extrema en frenada y curva rápida; menor velocidad máxima.',
      effectDecrease: 'Más velocidad punta pero la cola se vuelve flotante a más de 200 km/h.',
      relatedSymptoms: ['Sobreviraje a alta velocidad', 'Auto flotante en recta'],
      nextAction: 'Si la cola se mueve en curvas de 200+ km/h, aumentar 15 kgf.',
      isAvailable: parts.rearAeroAdjustable,
    },
    brake_balance: {
      key: 'brake_balance',
      category: 'BRAKES',
      name: 'Balance de Frenada',
      value: Number(brakeBalance.toFixed(1)),
      unit: '%',
      min: 30.0,
      max: 70.0,
      step: 1.0,
      target: 'Distribuir el par de frenado entre el eje delantero y trasero.',
      why: `Un 52% delantero asegura que las ruedas delanteras frenen primero, evitando el trompo por bloqueo trasero.`,
      effectIncrease: 'Más del 50% envía fuerza adelante: frena estable pero produce subviraje en entrada.',
      effectDecrease: 'Menos del 50% envía fuerza atrás: ayuda a rotar pero arriesga trompos severos.',
      relatedSymptoms: ['Trompo en frenada recta', 'El auto no gira al frenar'],
      nextAction: 'Si el auto hace trompo al frenar en recta, subir a 53%.',
      isAvailable: parts.brakesAdjustable,
    },
    brake_pressure: {
      key: 'brake_pressure',
      category: 'BRAKES',
      name: 'Presión de Frenado',
      value: Number(brakePressure.toFixed(1)),
      unit: '%',
      min: 50.0,
      max: 200.0,
      step: 1.0,
      target: 'Intensidad de frenada para modular sin bloquear neumático.',
      why: `100% es el estándar de Forza Horizon 5; se modula con el gatillo del control o pedal de celda de carga.`,
      effectIncrease: 'Mayor mordida inicial; bloquea neumáticos más fácilmente si ABS está desactivado.',
      effectDecrease: 'Recorrido más permisivo, menor riesgo de bloqueo pero distancias de parada más largas.',
      relatedSymptoms: ['Bloqueo constante de neumáticos'],
      nextAction: 'Reducir al 95% si bloqueas ruedas constantemente sin ABS.',
      isAvailable: parts.brakesAdjustable,
    },
    diff_front_accel: {
      key: 'diff_front_accel',
      category: 'DIFFERENTIAL',
      name: 'Diferencial Delantero Aceleración',
      value: Math.round(diffFrontAccel),
      unit: '%',
      min: 0.0,
      max: 100.0,
      step: 1.0,
      target: 'Traccionar con ambas ruedas delanteras al acelerar sin trabar la dirección.',
      why: `En ${drivetrain}, un valor moderado (25-40%) evita el subviraje por empuje (power understeer).`,
      effectIncrease: 'Mayor tracción en recta pero el auto tiende a irse de frente si aceleras girando.',
      effectDecrease: 'Giro suave y dócil en aceleración pero la rueda interior puede patinar.',
      relatedSymptoms: ['Subviraje al acelerar en salida'],
      nextAction: 'Si el auto se abre de frente al acelerar en salida de curva, bajar 5-10%.',
      isAvailable: parts.differentialAdjustable && (drivetrain === 'FWD' || drivetrain === 'AWD'),
    },
    diff_front_decel: {
      key: 'diff_front_decel',
      category: 'DIFFERENTIAL',
      name: 'Diferencial Delantero Deceleración',
      value: Math.round(diffFrontDecel),
      unit: '%',
      min: 0.0,
      max: 100.0,
      step: 1.0,
      target: 'Permitir giro libre e inserción al soltar el acelerador al entrar a curva.',
      why: `0% a 5% permite que las ruedas giren a diferente velocidad en la fase de giro con inercia.`,
      effectIncrease: 'Mayor estabilidad en retención pero causa subviraje severo en entrada.',
      effectDecrease: 'Entrada a curva ágil y sin resistencia en el volante.',
      relatedSymptoms: ['Subviraje al entrar en curva con inercia'],
      nextAction: 'Mantener en 0% - 5% para máxima agilidad en entrada.',
      isAvailable: parts.differentialAdjustable && (drivetrain === 'FWD' || drivetrain === 'AWD'),
    },
    diff_rear_accel: {
      key: 'diff_rear_accel',
      category: 'DIFFERENTIAL',
      name: 'Diferencial Trasero Aceleración',
      value: Math.round(diffRearAccel),
      unit: '%',
      min: 0.0,
      max: 100.0,
      step: 1.0,
      target: 'Bloquear ruedas traseras en aceleración para empuje contundente de salida.',
      why: `Calibrado para empuje enérgico sin romper tracción súbita en la rueda exterior.`,
      effectIncrease: 'Ambas ruedas empujan al unísono; mayor tracción pero propensión a power oversteer.',
      effectDecrease: 'Comportamiento más dócil al abrir gas pero patinamiento en rueda interior.',
      relatedSymptoms: ['Power oversteer (trompo al acelerar)', 'Wheelspin en salida'],
      nextAction: 'Si la cola se descuelga al pisar a fondo en salida, bajar al 60%.',
      isAvailable: parts.differentialAdjustable && (drivetrain === 'RWD' || drivetrain === 'AWD'),
    },
    diff_rear_decel: {
      key: 'diff_rear_decel',
      category: 'DIFFERENTIAL',
      name: 'Diferencial Trasero Deceleración',
      value: Math.round(diffRearDecel),
      unit: '%',
      min: 0.0,
      max: 100.0,
      step: 1.0,
      target: 'Estabilizar el tren trasero al soltar gas y al reducir marchas.',
      why: `15% a 25% estabiliza la zaga en deceleración sin bloquear el chasis para el giro.`,
      effectIncrease: 'Estabiliza fuertemente el coche al soltar gas; frena el sobreviraje pero causa subviraje.',
      effectDecrease: 'Permite que la cola rote al levantar el pie del acelerador (Lift-off oversteer).',
      relatedSymptoms: ['Inestabilidad al soltar gas', 'Sobreviraje en entrada'],
      nextAction: 'Si la cola se mueve al soltar gas en entrada a curva, subir 5-8%.',
      isAvailable: parts.differentialAdjustable && (drivetrain === 'RWD' || drivetrain === 'AWD'),
    },
    diff_center_balance: {
      key: 'diff_center_balance',
      category: 'DIFFERENTIAL',
      name: 'Reparto Central AWD (% Trasero)',
      value: Math.round(diffCenterBalance),
      unit: '%',
      min: 0.0,
      max: 100.0,
      step: 1.0,
      target: 'Determinar el porcentaje de potencia que va al eje trasero en sistemas AWD.',
      why: `En FH5, un reparto de 65-72% atrás entrega la agilidad de un propulsión con el agarre de tracción total.`,
      effectIncrease: 'Comportamiento de propulsión trasera, mayor rotación y agilidad en vértice.',
      effectDecrease: 'Comportamiento más neutro o subvirador con mayor tracción frontal en línea recta.',
      relatedSymptoms: ['Auto subvira por empuje AWD', 'Exceso de sobreviraje en aceleración'],
      nextAction: 'Si el auto se siente torpe y se va de frente al acelerar, subir al 72% atrás.',
      isAvailable: parts.differentialAdjustable && drivetrain === 'AWD',
    },
    final_drive: {
      key: 'final_drive',
      category: 'GEARING',
      name: 'Relación Final (Final Drive)',
      value: Number(finalDrive.toFixed(2)),
      unit: 'ratio',
      min: 2.0,
      max: 6.0,
      step: 0.01,
      target: 'Multiplicador general de par para alcanzar la velocidad tope del trazado.',
      why: `Optimizado para las demandas de aceleración y velocidad punta de ${discipline}.`,
      effectIncrease: 'Mayor aceleración general pero menor velocidad punta en cada marcha.',
      effectDecrease: 'Mayor velocidad máxima potencial pero aceleración más perezosa.',
      relatedSymptoms: ['Corta inyección antes de la meta', 'Aceleración lenta'],
      nextAction: 'Ajustar para tocar casi el corte de inyección en la marcha más alta al final de la recta principal.',
      isAvailable: parts.transmissionAdjustable,
    },
  };

  // Add individual gears
  gearRatios.forEach((ratio, idx) => {
    const gearNum = idx + 1;
    parameters[`gear_${gearNum}`] = {
      key: `gear_${gearNum}`,
      category: 'GEARING',
      name: `${gearNum}ª Marcha`,
      value: Number(ratio.toFixed(2)),
      unit: 'ratio',
      min: 0.5,
      max: 5.0,
      step: 0.01,
      target: `Escalonar el salto de revoluciones hacia la ${gearNum}ª velocidad.`,
      why: `Mantiene el motor en la zona de par óptimo (${vehicle.torqueNm} N·m).`,
      effectIncrease: 'Marcha más corta (más aceleración).',
      effectDecrease: 'Marcha más larga (más velocidad).',
      relatedSymptoms: ['Caída excesiva de RPM al cambiar'],
      nextAction: 'Escalonar para evitar caídas de RPM por debajo de la zona de potencia.',
      isAvailable: parts.transmissionAdjustable,
    };
  });

  // Calculate dynamic balance from calculated parameters
  const balance = calculateVehicleBalance(parameters, vehicle, discipline);

  return {
    id: `tune-${vehicle.id}-${Date.now()}`,
    vehicleId: vehicle.id,
    discipline,
    name: `${vehicle.make} ${vehicle.model} - ${discipline} Baseline`,
    version: 1,
    versionTag: 'BASE v1',
    driverProfile: { ...driverProfile },
    hardwareProfile: { ...hardwareProfile },
    parameters,
    balance,
    notes: `Reglaje baseline determinista generado para disciplina ${discipline}. Configurado bajo la física de ${vehicle.drivetrain}.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Calcula los 4 indicadores técnicos de ingeniería (0 a 100) y las coordenadas de telemetría
 * basados en el estado actual de los parámetros de reglaje.
 */
export function calculateVehicleBalance(
  parameters: Record<string, TuneParameter>,
  vehicle: Vehicle,
  discipline: Discipline
): VehicleBalance {
  // Grab values safely with fallbacks
  const arbFront = parameters.arb_front?.value ?? 25;
  const arbRear = parameters.arb_rear?.value ?? 30;
  const aeroRear = parameters.aero_rear?.value ?? 120;
  const camberFront = Math.abs(parameters.camber_front?.value ?? 1.8);
  const diffCenter = parameters.diff_center_balance?.value ?? 65;
  const diffRearAccel = parameters.diff_rear_accel?.value ?? 65;
  const tirePressureFront = parameters.tire_pressure_front?.value ?? 28.5;

  // Base physics metrics
  // 1. GRIP (0 - 100)
  // Depends on compound, tire width, camber optimization, aero
  let gripBase = 70;
  if (vehicle.parts.tireCompound === 'Race' || vehicle.parts.tireCompound === 'Semi-Slick') gripBase += 15;
  if (vehicle.parts.tireCompound === 'Rally') gripBase += 8;
  if (vehicle.parts.tireCompound === 'Offroad' && discipline === 'CROSS COUNTRY') gripBase += 16;
  if (camberFront >= 1.6 && camberFront <= 2.2) gripBase += 5;
  if (aeroRear > 140) gripBase += 6;
  if (tirePressureFront >= 27.5 && tirePressureFront <= 29.5) gripBase += 4;
  const grip = Math.min(99, Math.max(30, Math.round(gripBase)));

  // 2. ROTACIÓN (0 - 100)
  // Higher ARB rear relative to front, higher rear diff bias in AWD, higher camber front -> higher rotation
  const arbDelta = arbRear - arbFront; // positive means oversteer bias
  let rotationBase = 50 + (arbDelta * 0.8);
  if (vehicle.drivetrain === 'AWD') {
    rotationBase += (diffCenter - 50) * 0.4;
  } else if (vehicle.drivetrain === 'RWD') {
    rotationBase += 8;
  }
  if (discipline === 'DRIFT') rotationBase += 25;
  const rotation = Math.min(98, Math.max(25, Math.round(rotationBase)));

  // 3. ESTABILIDAD (0 - 100)
  // High aero rear, lower ARB rear relative to front, higher damping -> higher stability
  let stabilityBase = 72;
  stabilityBase += (aeroRear / 30);
  stabilityBase -= (arbDelta * 0.5);
  if (discipline === 'CROSS COUNTRY') stabilityBase += 8;
  if (discipline === 'DRIFT') stabilityBase -= 20;
  const stability = Math.min(98, Math.max(25, Math.round(stabilityBase)));

  // 4. TRACCIÓN (0 - 100)
  // AWD has naturally higher traction, differential accel setting, tire width
  let tractionBase = 60;
  if (vehicle.drivetrain === 'AWD') tractionBase += 25;
  else if (vehicle.drivetrain === 'FWD') tractionBase -= 5;
  if (diffRearAccel >= 60 && diffRearAccel <= 85) tractionBase += 6;
  if (vehicle.parts.rearTireWidthMm > 285) tractionBase += 5;
  const traction = Math.min(99, Math.max(30, Math.round(tractionBase)));

  // Coordenadas cartesianas en el Vector de Balance:
  // X: -50 (Subviraje marcado) a +50 (Sobreviraje marcado)
  // Y: -50 (Suspensión blanda / absorción) a +50 (Rígido / Grip de circuito puro)
  const xCoord = Math.min(45, Math.max(-45, Math.round((rotation - 50) * 0.9)));
  const yCoord = Math.min(45, Math.max(-45, Math.round((grip - 50) * 0.9)));

  return {
    grip,
    rotation,
    stability,
    traction,
    coordinates: {
      x: xCoord,
      y: yCoord,
    },
  };
}
