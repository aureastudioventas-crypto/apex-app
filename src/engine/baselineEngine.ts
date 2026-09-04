/**
 * APEX TUNING ENGINE — FH5
 * BASELINE ENGINE DETERMINISTA V1.1
 * Motor de cálculo físico basado en principios de ingeniería para Forza Horizon 5.
 *
 * Flujo de ejecución determinista en 14 pasos:
 * 1. Vehicle baseline
 * 2. Tire baseline
 * 3. Alignment baseline
 * 4. Suspension baseline
 * 5. Aero baseline
 * 6. Brake baseline
 * 7. Differential baseline
 * 8. Gearbox baseline
 * 9. Apply drivetrain modifiers
 * 10. Apply discipline modifiers
 * 11. Apply driver modifiers
 * 12. Validate (validateTune)
 * 13. Calculate balance (calculateBalance)
 * 14. Generate explanations (WHAT, WHY, EXPECTED EFFECT, IF PROBLEM PERSISTS, NEXT ACTION)
 */

import {
  Vehicle,
  Discipline,
  DriverProfile,
  HardwareProfile,
  TuneParameter,
  VehicleBalance,
  Tune,
  EngineeringExplanation,
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
  wheelModel: 'Logitech G920',
  rotationDegrees: 900,
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

/**
 * Helper para construir un parámetro de reglaje completo con explicaciones estructuradas.
 */
function createTuneParam(
  key: string,
  category: TuneParameter['category'],
  name: string,
  value: number,
  unit: string,
  min: number,
  max: number,
  step: number,
  isAvailable: boolean,
  target: string,
  why: string,
  effectIncrease: string,
  effectDecrease: string,
  relatedSymptoms: string[],
  nextAction: string,
  explanation: {
    what: string;
    why: string;
    expectedEffect: string;
    ifProblemPersists: string;
    nextAction: string;
  }
): TuneParameter {
  const rounded = Number(Math.max(min, Math.min(max, value)).toFixed(step < 0.1 ? 2 : 1));
  return {
    key,
    category,
    name,
    value: rounded,
    unit,
    min,
    max,
    step,
    target,
    why,
    effectIncrease,
    effectDecrease,
    relatedSymptoms,
    nextAction,
    available: isAvailable,
    isAvailable,
    source: 'BASELINE',
    confidence: 90,
    engineeringExplanation: explanation,
  };
}

/**
 * PIPELINE PRINCIPAL: GENERACIÓN DETERMINISTA DE BASELINE
 */
export function generateBaselineTune(
  vehicle: Vehicle,
  discipline: Discipline = 'ROAD RACING',
  driverProfile: DriverProfile = DEFAULT_DRIVER_PROFILE,
  hardwareProfile: HardwareProfile = DEFAULT_HARDWARE_PROFILE
): Tune {
  const parts = vehicle.parts;

  // 1. VEHICLE BASELINE (Masa, reparto y cinemática)
  const weight = vehicle.weightKg;
  const frontDist = vehicle.frontWeightRatio; // e.g. 0.52
  const rearDist = 1 - frontDist; // e.g. 0.48
  const drivetrain = vehicle.drivetrain; // 'FWD' | 'RWD' | 'AWD'

  // 2. TIRE BASELINE
  let baseTireFront = 28.5;
  let baseTireRear = 28.0;

  // 3. ALIGNMENT BASELINE
  let camberFront = -1.8;
  let camberRear = -1.2;
  let toeFront = 0.0;
  let toeRear = 0.0;
  let caster = 6.0;

  // 4. SUSPENSION BASELINE (Muelles, ARB, Altura, Amortiguadores)
  // Fórmula FH5 recomendada para rigidez de muelles:
  // Rigidez = (Masa en kg / 10) * factor_disciplina * reparto
  let disciplineSpringFactor = 1.0;
  let baseHeightFront = 12.5;
  let baseHeightRear = 13.0;
  let reboundBase = 10.0;
  let bumpFactor = 0.60; // 60% relación recomendada respecto a rebound

  let baseArbFront = 25.0;
  let baseArbRear = 28.0;

  // 5. AERO BASELINE
  let baseAeroFront = 110;
  let baseAeroRear = 140;

  // 6. BRAKE BASELINE
  let baseBrakeBalance = 52.0;
  let baseBrakePressure = 100.0;

  // 7. DIFFERENTIAL BASELINE
  let baseDiffFrontAccel = 35;
  let baseDiffFrontDecel = 5;
  let baseDiffRearAccel = 65;
  let baseDiffRearDecel = 20;
  let baseDiffCenterBalance = 68;

  // 8. GEARBOX BASELINE
  let baseFinalDrive = 3.65;
  const baseGears: number[] = [3.45, 2.35, 1.72, 1.34, 1.08, 0.90];
  if (vehicle.gearsCount > 6) {
    baseGears.push(0.78);
  }

  // 9. APPLY DRIVETRAIN MODIFIERS
  if (drivetrain === 'FWD') {
    baseTireFront -= 0.5; // optimizar tracción de tracción delantera
    baseTireRear += 1.0;
    camberFront -= 0.3; // mayor soporte en curva al eje motriz
    baseArbFront = Math.max(10, 45.0 * frontDist * 0.8);
    baseArbRear = Math.min(65, 45.0 * rearDist * 1.6); // barra trasera más rígida para inducir rotación
    baseDiffFrontAccel = 40;
    baseDiffFrontDecel = 5;
    baseDiffRearAccel = 0;
    baseDiffRearDecel = 0;
    baseDiffCenterBalance = 0;
    baseBrakeBalance = 54.0;
  } else if (drivetrain === 'RWD') {
    baseTireRear -= 0.5;
    baseArbFront = 40.0 * frontDist;
    baseArbRear = 40.0 * rearDist * 1.1;
    baseDiffFrontAccel = 0;
    baseDiffFrontDecel = 0;
    baseDiffRearAccel = 62;
    baseDiffRearDecel = 22;
    baseDiffCenterBalance = 100;
    baseBrakeBalance = 52.0;
  } else {
    // AWD
    baseArbFront = 42.0 * frontDist;
    baseArbRear = 42.0 * rearDist * 1.15;
    baseDiffFrontAccel = 32;
    baseDiffFrontDecel = 5;
    baseDiffRearAccel = 68;
    baseDiffRearDecel = 20;
    baseDiffCenterBalance = 68; // sesgo trasero para agilidad
    baseBrakeBalance = 52.0;
  }

  // 10. APPLY DISCIPLINE MODIFIERS
  switch (discipline) {
    case 'ROAD RACING':
      disciplineSpringFactor = 1.05;
      baseTireFront = 28.5;
      baseTireRear = 28.0;
      camberFront = -1.8;
      camberRear = -1.2;
      toeFront = 0.0;
      toeRear = -0.1;
      caster = 6.2;
      baseHeightFront = 10.5;
      baseHeightRear = 11.0;
      reboundBase = 11.0;
      bumpFactor = 0.60;
      baseAeroFront = 120;
      baseAeroRear = 150;
      baseFinalDrive = 3.65;
      break;

    case 'STREET SCENE':
      disciplineSpringFactor = 0.95;
      baseTireFront = 27.5;
      baseTireRear = 27.5;
      camberFront = -1.6;
      camberRear = -1.1;
      toeFront = 0.0;
      toeRear = 0.0;
      caster = 6.0;
      baseHeightFront = 12.0;
      baseHeightRear = 12.5;
      reboundBase = 9.8;
      bumpFactor = 0.58;
      baseAeroFront = 90;
      baseAeroRear = 120;
      baseFinalDrive = 3.60;
      break;

    case 'DIRT':
      disciplineSpringFactor = 0.70;
      baseTireFront = 25.0;
      baseTireRear = 24.5;
      camberFront = -1.0;
      camberRear = -0.6;
      toeFront = 0.1;
      toeRear = 0.0;
      caster = 5.5;
      baseHeightFront = 18.0;
      baseHeightRear = 18.5;
      reboundBase = 8.5;
      bumpFactor = 0.55;
      baseArbFront *= 0.75;
      baseArbRear *= 0.75;
      baseAeroFront = 70;
      baseAeroRear = 90;
      baseDiffRearAccel = Math.min(95, baseDiffRearAccel + 12);
      baseDiffFrontAccel = Math.min(80, baseDiffFrontAccel + 15);
      baseFinalDrive = 4.10;
      break;

    case 'CROSS COUNTRY':
      disciplineSpringFactor = 0.60;
      baseTireFront = 22.5;
      baseTireRear = 22.0;
      camberFront = -0.5;
      camberRear = -0.4;
      toeFront = 0.0;
      toeRear = 0.0;
      caster = 5.2;
      baseHeightFront = 25.0;
      baseHeightRear = 25.5;
      reboundBase = 7.5;
      bumpFactor = 0.65; // compresión más firme para absorber caídas de saltos
      baseArbFront *= 0.55;
      baseArbRear *= 0.55;
      baseAeroFront = 50;
      baseAeroRear = 60;
      baseDiffFrontAccel = 65;
      baseDiffFrontDecel = 15;
      baseDiffRearAccel = 85;
      baseDiffRearDecel = 35;
      baseDiffCenterBalance = 52;
      baseFinalDrive = 4.30;
      break;

    case 'DRAG':
      disciplineSpringFactor = 1.2;
      baseTireFront = 45.0;
      baseTireRear = 18.0;
      camberFront = 0.0;
      camberRear = 0.0;
      toeFront = 0.0;
      toeRear = 0.0;
      caster = 7.0;
      baseHeightFront = 14.0;
      baseHeightRear = 12.0;
      reboundBase = 12.0;
      bumpFactor = 0.50;
      baseAeroFront = 20;
      baseAeroRear = 20;
      baseDiffRearAccel = 100;
      baseDiffRearDecel = 100;
      baseDiffFrontAccel = 100;
      baseDiffCenterBalance = 80;
      baseFinalDrive = 2.85;
      break;

    case 'DRIFT':
      disciplineSpringFactor = 1.0;
      baseTireFront = 29.0;
      baseTireRear = 38.0;
      camberFront = -4.2;
      camberRear = -0.6;
      toeFront = 0.2;
      toeRear = -0.2;
      caster = 7.0;
      baseHeightFront = 10.0;
      baseHeightRear = 10.5;
      reboundBase = 10.5;
      bumpFactor = 0.60;
      baseArbFront = 35.0;
      baseArbRear = 48.0; // trasera dura para romper tracción a demanda
      baseAeroFront = 30;
      baseAeroRear = 30;
      baseDiffRearAccel = 100;
      baseDiffRearDecel = 90;
      baseDiffFrontAccel = 45;
      baseDiffCenterBalance = 85;
      baseFinalDrive = 3.75;
      break;

    case 'CUSTOM':
    default:
      break;
  }

  // 11. APPLY DRIVER PROFILE MODIFIERS
  // Sliders normalizados de 0 a 100 (50 es neutral)
  const rotationBias = (driverProfile.rotation - 50) / 100; // -0.5 a +0.5
  const entryBias = (driverProfile.cornerEntry - 50) / 100;
  const exitBias = (driverProfile.cornerExit - 50) / 100;
  const oversteerTol = (driverProfile.oversteerTolerance - 50) / 100;
  const steeringResp = (driverProfile.steeringResponse - 50) / 100;

  // Ajustes en ARB según preferencia de rotación
  baseArbRear = Math.max(1, Math.min(65, baseArbRear + rotationBias * 6.0));
  baseArbFront = Math.max(1, Math.min(65, baseArbFront - rotationBias * 3.0));

  // Ajustes de alineación según respuesta de dirección
  if (steeringResp > 0.1 && discipline !== 'DRAG') {
    toeFront = Number((toeFront - 0.1).toFixed(1)); // ligera divergencia delantera para respuesta ágil
    caster = Math.min(7.0, caster + 0.2);
  }

  // Ajuste de diferencial de aceleración según tolerancia a sobreviraje
  if (drivetrain !== 'FWD') {
    baseDiffRearAccel = Math.max(30, Math.min(100, baseDiffRearAccel + oversteerTol * 8));
  }

  // Ajuste de freno según agresividad de entrada
  if (entryBias > 0.2) {
    baseBrakeBalance = Math.min(56.0, baseBrakeBalance + 1.0);
  }

  // Cálculo de muelles finales
  const baseSpringFront = Math.max(25, (weight / 10) * disciplineSpringFactor * frontDist);
  const baseSpringRear = Math.max(25, (weight / 10) * disciplineSpringFactor * rearDist);

  // Amortiguadores
  const reboundFrontVal = Math.max(1.0, Math.min(20.0, reboundBase * (frontDist / 0.5)));
  const reboundRearVal = Math.max(1.0, Math.min(20.0, reboundBase * (rearDist / 0.5)));
  const bumpFrontVal = Math.max(1.0, Math.min(20.0, reboundFrontVal * bumpFactor));
  const bumpRearVal = Math.max(1.0, Math.min(20.0, reboundRearVal * bumpFactor));

  // Build raw parameters dictionary
  const rawParams: Record<string, TuneParameter> = {};

  // Neumáticos
  rawParams.tire_pressure_front = createTuneParam(
    'tire_pressure_front',
    'TIRES',
    'Presión Delantera',
    baseTireFront,
    'psi',
    15.0,
    55.0,
    0.5,
    true,
    'Superficie de agarre y adherencia lateral en giro de entrada.',
    `Calculado para ${weight} kg con ${(frontDist * 100).toFixed(0)}% de peso delantero en ${discipline}.`,
    'Menor deformación de neumático, dirección más reactiva, pero menor agarre máximo.',
    'Mayor huella de contacto y agarre, pero calentamiento más rápido.',
    ['Subviraje', 'Desgaste térmico irregular'],
    'Si subvira en curvas de apoyo, reducir 0.5 psi.',
    {
      what: 'Presión de inflado del neumático delantero en frío.',
      why: `Soporta ${(frontDist * 100).toFixed(0)}% del peso estático más la transferencia en frenada.`,
      expectedEffect: 'Equilibrio óptimo entre huella de contacto y precisión de guiado.',
      ifProblemPersists: 'Si persiste el subviraje, evaluar barra delantera y caída.',
      nextAction: 'Reducir 0.5 psi en el eje delantero si el neumático no alcanza temperatura.',
    }
  );

  rawParams.tire_pressure_rear = createTuneParam(
    'tire_pressure_rear',
    'TIRES',
    'Presión Trasera',
    baseTireRear,
    'psi',
    15.0,
    55.0,
    0.5,
    true,
    'Tracción longitudinal y balance térmico del eje posterior.',
    `Soporta ${(rearDist * 100).toFixed(0)}% de la masa estática más transferencia en aceleración.`,
    'Menor resistencia a la rodadura pero menor agarre longitudinal.',
    'Mayor tracción en aceleración pero mayor resistencia al avance.',
    ['Sobreviraje', 'Wheelspin en salida'],
    'Si patina la trasera en aceleración, reducir 1.0 psi.',
    {
      what: 'Presión de inflado del neumático trasero en frío.',
      why: 'Permite que el parche de contacto trabaje plano al traccionar.',
      expectedEffect: 'Tracción progresiva sin calentamiento excesivo del centro de la banda.',
      ifProblemPersists: 'Si continúa el wheelspin, suavizar muelle trasero o bajar diferencial de aceleración.',
      nextAction: 'Reducir 0.5 a 1.0 psi si falta tracción en salida.',
    }
  );

  // Alineación
  rawParams.camber_front = createTuneParam(
    'camber_front',
    'ALIGNMENT',
    'Camber Delantero',
    camberFront,
    '°',
    -5.0,
    0.0,
    0.1,
    parts.suspensionAdjustable,
    'Mantener la huella del neumático plana cuando el chasis apoya con fuerza centrífuga.',
    `Mayor capacidad lateral en apoyo en eje delantero para disciplina ${discipline}.`,
    'Más negativo otorga mayor agarre en curvas rápidas apoyadas; menos negativo favorece la frenada recta.',
    'Camber cercano a 0° mejora frenada recta pero pierde agarre en apoyos fuertes.',
    ['Subviraje en mitad de curva'],
    'Si persiste el subviraje en mitad de curva, añadir -0.2° de camber.',
    {
      what: 'Ángulo de caída del neumático delantero.',
      why: 'Busca mantener contacto efectivo durante apoyo lateral.',
      expectedEffect: 'Mayor capacidad lateral en curva media y rápida.',
      ifProblemPersists: 'Si persiste el subviraje, evaluar barra delantera y balance de masas.',
      nextAction: 'Aumentar -0.2° de caída negativa.',
    }
  );

  rawParams.camber_rear = createTuneParam(
    'camber_rear',
    'ALIGNMENT',
    'Camber Trasero',
    camberRear,
    '°',
    -5.0,
    0.0,
    0.1,
    parts.suspensionAdjustable,
    'Estabilidad de la zaga en apoyos prolongados sin comprometer la tracción recta.',
    'Equilibrado respecto al camber delantero para conservar el eje posterior plano.',
    'Más agarre lateral trasero, menor tracción en aceleración recta.',
    'Mayor tracción longitudinal en recta pero la cola puede deslizar en curva.',
    ['Sobreviraje en mitad de curva'],
    'Si la zaga se insinúa en curvas rápidas, añadir -0.2° de camber.',
    {
      what: 'Ángulo de caída del neumático trasero.',
      why: 'Garantiza apoyo lateral de la zaga sin perjudicar la tracción en salida.',
      expectedEffect: 'Apoyo estable en curva sostenida.',
      ifProblemPersists: 'Si la cola sigue suelta, suavizar barra estabilizadora trasera.',
      nextAction: 'Añadir -0.2° de caída negativa.',
    }
  );

  rawParams.toe_front = createTuneParam(
    'toe_front',
    'ALIGNMENT',
    'Toe Delantero (Convergencia)',
    toeFront,
    '°',
    -5.0,
    5.0,
    0.1,
    parts.suspensionAdjustable,
    'Afinar la respuesta inicial de la dirección al encarar giros.',
    'Un valor neutro o ligeramente divergente (-0.1°) agiliza el vértice.',
    'Convergencia positiva estabiliza la recta pero hace la dirección menos reactiva.',
    'Divergencia hace la inserción más viva pero puede generar nerviosismo en recta.',
    ['Dirección perezosa', 'Inestabilidad en recta'],
    'Mantener entre 0.0° y -0.1° salvo requerimiento especial.',
    {
      what: 'Ángulo de convergencia o divergencia de las ruedas delanteras.',
      why: 'Controla el tiempo de respuesta del morro al mover el volante.',
      expectedEffect: 'Entrada dócil y predecible al girar.',
      ifProblemPersists: 'Si la dirección es lenta, aplicar -0.1° de divergencia.',
      nextAction: 'Mantener en 0.0° o ajustar a -0.1°.',
    }
  );

  rawParams.toe_rear = createTuneParam(
    'toe_rear',
    'ALIGNMENT',
    'Toe Trasero (Convergencia)',
    toeRear,
    '°',
    -5.0,
    5.0,
    0.1,
    parts.suspensionAdjustable,
    'Asentar el tren posterior en frenadas y aceleraciones violentas.',
    'Una ligera convergencia (-0.1°) frena el efecto de cola suelta.',
    'Mayor convergencia estabiliza pero induce rozamiento parásito.',
    'Divergencia trasera suelta la zaga y genera sobreviraje impredecible.',
    ['Inestabilidad al frenar'],
    'Si la cola baila al frenar a alta velocidad, ajustar a -0.1° o -0.2°.',
    {
      what: 'Ángulo de convergencia de las ruedas traseras.',
      why: 'Fija la trayectoria del eje motriz posterior.',
      expectedEffect: 'Zaga plantada en desaceleraciones fuertes.',
      ifProblemPersists: 'Si la cola sigue nerviosa, revisar reparto de frenada.',
      nextAction: 'Ajustar a -0.1° de convergencia.',
    }
  );

  rawParams.caster = createTuneParam(
    'caster',
    'ALIGNMENT',
    'Caster (Ángulo de Avance)',
    caster,
    '°',
    1.0,
    7.0,
    0.1,
    parts.suspensionAdjustable,
    'Generar camber dinámico al girar y peso natural en el auto-centrado.',
    'Rango de 5.5° a 6.5° entrega estabilidad en alta velocidad y retorno progresivo.',
    'Dirección más firme, más camber en curvas cerradas, retorno enérgico.',
    'Dirección más suave pero menor estabilidad lineal a más de 180 km/h.',
    ['Falta de auto-centrado', 'Dirección pesada'],
    'Subir a 6.5° si el vehículo flota en recta.',
    {
      what: 'Inclinación longitudinal del eje del pivote de dirección.',
      why: 'Proporciona estabilidad direccional y caída dinámica al girar.',
      expectedEffect: 'Sensación de dirección sólida y retorno consistente.',
      ifProblemPersists: 'Si el volante se siente vago, aumentar 0.3°.',
      nextAction: 'Aumentar a 6.2° - 6.5°.',
    }
  );

  // Barras ARB
  rawParams.arb_front = createTuneParam(
    'arb_front',
    'ARB',
    'Barra Estabilizadora Delantera',
    baseArbFront,
    '1.0 - 65.0',
    1.0,
    65.0,
    0.1,
    parts.frontArbAdjustable,
    'Controlar la rigidez torsional lateral delantera y mitigar subviraje.',
    `Punto inicial adaptado para reparto delantero ${(frontDist * 100).toFixed(0)}% y ${drivetrain}.`,
    'Mayor rigidez delantera produce subviraje mecánico.',
    'Menor rigidez permite más carga al neumático exterior; reduce subviraje.',
    ['Subviraje en mitad de curva'],
    'Si subvira en mitad de curva, reducir 2.5 a 4.0 puntos.',
    {
      what: 'Rigidez torsional de la barra estabilizadora delantera.',
      why: 'Modula la distribución de agarre lateral entre ambos ejes.',
      expectedEffect: 'Equilibrio de balance en curva apoyada.',
      ifProblemPersists: 'Si persiste el subviraje, evaluar muelles delanteros y caída.',
      nextAction: 'Reducir 3.0 puntos la barra delantera.',
    }
  );

  rawParams.arb_rear = createTuneParam(
    'arb_rear',
    'ARB',
    'Barra Estabilizadora Trasera',
    baseArbRear,
    '1.0 - 65.0',
    1.0,
    65.0,
    0.1,
    parts.rearArbAdjustable,
    'Inducir rotación en el chasis para equilibrar el reparto de masas.',
    `En ${drivetrain}, equilibra la tendencia natural a empujar hacia afuera.`,
    'Aumenta la rotación; si es excesiva causa sobreviraje súbito.',
    'Asienta el tren posterior; mitiga sobreviraje.',
    ['Sobreviraje en mitad de curva', 'Falta de rotación'],
    'Si falta rotación, aumentar 2.0 a 3.5 puntos.',
    {
      what: 'Rigidez torsional de la barra estabilizadora trasera.',
      why: 'Genera balance neutro compensando el peso de la carrocería.',
      expectedEffect: 'Rotación dócil y controlada en vértice.',
      ifProblemPersists: 'Si sobrevira bruscamente, suavizar la barra trasera 3 puntos.',
      nextAction: 'Aumentar o disminuir según balance observado.',
    }
  );

  // Muelles y Altura
  rawParams.springs_front = createTuneParam(
    'springs_front',
    'SPRINGS',
    'Muelles Delanteros',
    baseSpringFront,
    'kgf/mm',
    10.0,
    300.0,
    0.5,
    parts.suspensionAdjustable,
    `Soportar la masa frontal (${(frontDist * 100).toFixed(0)}%) y controlar cabeceo en frenada.`,
    `Calculado en función de la masa del vehículo y perfil de ${discipline}.`,
    'Menor cabeceo en frenada pero absorción más seca de pianos.',
    'Mayor absorción mecánica pero riesgo de hacer tope.',
    ['El auto toca fondo (Bottom out)', 'Rebota en apoyos'],
    'Si toca fondo en frenada fuerte, subir 8 kgf/mm.',
    {
      what: 'Rigidez del muelle helicoidal del eje delantero.',
      why: `Sostiene ${(frontDist * 100).toFixed(0)}% del peso del vehículo.`,
      expectedEffect: 'Control de cabeceo sin transmitir golpes secos al chasis.',
      ifProblemPersists: 'Si golpea el suelo en ondulaciones, aumentar rigidez o altura.',
      nextAction: 'Aumentar en incrementos de 5-10 kgf/mm.',
    }
  );

  rawParams.springs_rear = createTuneParam(
    'springs_rear',
    'SPRINGS',
    'Muelles Traseros',
    baseSpringRear,
    'kgf/mm',
    10.0,
    300.0,
    0.5,
    parts.suspensionAdjustable,
    'Absorber la transferencia de peso en aceleración y mantener apoyo plano.',
    `Soporta ${(rearDist * 100).toFixed(0)}% del peso estático más masa dinámica en salida.`,
    'Reacción más firme en salida pero menor agarre en suelo roto.',
    'El chasis asienta mejor en aceleración pero puede hundirse demasiado.',
    ['Hundimiento excesivo en aceleración'],
    'Si se hunde excesivamente al abrir gas, subir 6 kgf/mm.',
    {
      what: 'Rigidez del muelle helicoidal del eje trasero.',
      why: 'Equilibra la masa del tren posterior bajo aceleración.',
      expectedEffect: 'Plataforma estable sin rebotes de cola.',
      ifProblemPersists: 'Si rebota en salida de curva, revisar rebote del amortiguador.',
      nextAction: 'Ajustar en incrementos de 5 kgf/mm.',
    }
  );

  rawParams.ride_height_front = createTuneParam(
    'ride_height_front',
    'SPRINGS',
    'Altura Delantera',
    baseHeightFront,
    'cm',
    5.0,
    35.0,
    0.1,
    parts.suspensionAdjustable,
    'Centro de gravedad bajo manteniendo recorrido útil sin rozar el suelo.',
    `Calibrado para el perfil ${discipline} para permitir trabajo de suspensión.`,
    'Mayor recorrido para ondulaciones pero mayor balanceo del chasis.',
    'Centro de masa bajo pero riesgo de rozar el splitter.',
    ['Chasis roza el suelo', 'Pérdida de tracción en baches'],
    'Si roza en compresión máxima, elevar 0.5 cm.',
    {
      what: 'Distancia libre al suelo del eje delantero.',
      why: 'Permite recorrido útil sin que el chasis golpee la superficie.',
      expectedEffect: 'Estabilidad aerodinámica y mecánica balanceada.',
      ifProblemPersists: 'Si golpea el suelo, aumentar 0.5 cm.',
      nextAction: 'Elevar 0.5 cm.',
    }
  );

  rawParams.ride_height_rear = createTuneParam(
    'ride_height_rear',
    'SPRINGS',
    'Altura Trasera',
    baseHeightRear,
    'cm',
    5.0,
    35.0,
    0.1,
    parts.suspensionAdjustable,
    'Geometría neutra de semiejes y flujo de aire hacia el difusor.',
    'Ligeramente superior a la delantera para favorecer la carga aerodinámica.',
    'Mayor recorrido útil en aceleración.',
    'Menor centro de gravedad.',
    ['El difusor golpea en baches'],
    'Ajustar de manera coordinada con la altura delantera.',
    {
      what: 'Distancia libre al suelo del eje trasero.',
      why: 'Mantiene la línea de inclinación (rake) adecuada.',
      expectedEffect: 'Flujo de aire limpio y espacio libre para el recorrido.',
      ifProblemPersists: 'Si la trasera golpea en baches, subir 0.5 cm.',
      nextAction: 'Coordinar con la altura delantera.',
    }
  );

  // Amortiguación
  rawParams.rebound_front = createTuneParam(
    'rebound_front',
    'DAMPING',
    'Extensión Delantera (Rebound)',
    reboundFrontVal,
    '1.0 - 20.0',
    1.0,
    20.0,
    0.1,
    parts.suspensionAdjustable,
    'Frenar la velocidad con la que los muelles delanteros se expanden.',
    'Evita que el morro se levante con violencia al soltar freno.',
    'Chasis más pegado al asfalto pero empaqueta si es excesivo.',
    'Extensión más libre pero puede generar oscilaciones continuas.',
    ['El auto rebota repetidamente'],
    'Si el morro rebota tras superar un bache, subir 0.8 puntos.',
    {
      what: 'Fuerza de amortiguación en la fase de extensión delantera.',
      why: 'Controla la energía acumulada por el muelle al estirarse.',
      expectedEffect: 'Estabilización inmediata tras superar baches.',
      ifProblemPersists: 'Si rebota en apoyos sucesivos, subir 1.0 punto.',
      nextAction: 'Subir 0.5 a 1.0 punto.',
    }
  );

  rawParams.rebound_rear = createTuneParam(
    'rebound_rear',
    'DAMPING',
    'Extensión Trasera (Rebound)',
    reboundRearVal,
    '1.0 - 20.0',
    1.0,
    20.0,
    0.1,
    parts.suspensionAdjustable,
    'Controlar la velocidad de extensión del tren trasero al frenar.',
    'Evita que la cola se levante súbitamente en frenadas fuertes.',
    'Mantiene la zaga asentada en frenada.',
    'La rueda recupera contacto más rápido pero puede oscilar.',
    ['La cola salta al frenar en bajada'],
    'Si la zaga se descuelga al frenar en bajada, subir 0.8 puntos.',
    {
      what: 'Fuerza de amortiguación en la fase de extensión trasera.',
      why: 'Evita que el eje posterior se descargue en deceleración.',
      expectedEffect: 'Zaga controlada durante transferencias de masa hacia adelante.',
      ifProblemPersists: 'Si la cola flota en cambios de rasante, endurecer 0.8 puntos.',
      nextAction: 'Ajustar rebote trasero +0.8.',
    }
  );

  rawParams.bump_front = createTuneParam(
    'bump_front',
    'DAMPING',
    'Compresión Delantera (Bump)',
    bumpFrontVal,
    '1.0 - 20.0',
    1.0,
    20.0,
    0.1,
    parts.suspensionAdjustable,
    'Amortiguar la rapidez de hundimiento al frenar o pasar pianos.',
    `Punto inicial situado entre 50% y 65% del valor de Extensión (${reboundFrontVal.toFixed(1)}).`,
    'Soporta mejor la frenada inicial pero puede rebotar sobre pianos duros.',
    'Pasa pianos y baches con suavidad pero cabecea rápido al tocar freno.',
    ['Inestabilidad al pisar bordillos'],
    'Si el vehículo salta al pisar el piano interior de la curva, bajar 0.8 puntos.',
    {
      what: 'Fuerza de amortiguación en la fase de compresión delantera.',
      why: 'Disipa la velocidad de hundimiento del morro.',
      expectedEffect: 'Absorción progresiva sin transferencias bruscas.',
      ifProblemPersists: 'Si el coche es muy seco en pianos, reducir 1.0 punto.',
      nextAction: 'Reducir 0.5 a 1.0 punto.',
    }
  );

  rawParams.bump_rear = createTuneParam(
    'bump_rear',
    'DAMPING',
    'Compresión Trasera (Bump)',
    bumpRearVal,
    '1.0 - 20.0',
    1.0,
    20.0,
    0.1,
    parts.suspensionAdjustable,
    'Sostener la transferencia de aceleración hacia el eje trasero.',
    `Calculado proporcionalmente al rebote trasero (${(bumpFactor * 100).toFixed(0)}%).`,
    'Menor hundimiento en salida pero menor tolerancia a suelo irregular.',
    'Mayor absorción en suelo bacheado.',
    ['Pérdida de tracción en aceleración rugosa'],
    'Mantener entre 50% y 65% del valor de Extensión Trasera.',
    {
      what: 'Fuerza de amortiguación en la fase de compresión trasera.',
      why: 'Controla la rapidez con que la zaga absorbe la carga al acelerar.',
      expectedEffect: 'Tracción progresiva sin sacudidas en salida.',
      ifProblemPersists: 'Si la rueda trasera patina sobre asfalto irregular, suavizar bump.',
      nextAction: 'Mantener en relación 55%-65% respecto a extensión.',
    }
  );

  // Aerodinámica
  rawParams.aero_front = createTuneParam(
    'aero_front',
    'AERO',
    'Aerodinámica Delantera',
    baseAeroFront,
    'kgf',
    20.0,
    500.0,
    1.0,
    parts.frontAeroAdjustable,
    'Carga vertical en el eje delantero a más de 120 km/h para evitar subviraje rápido.',
    `Equilibrado para las demandas de carga aerodinámica en ${discipline}.`,
    'Mayor agarre en curvas rápidas apoyadas pero mayor resistencia al avance.',
    'Mayor velocidad punta en rectas pero menor agarre en virajes rápidos.',
    ['Subviraje a alta velocidad'],
    'Si el auto se abre en curvas de 4ª o 5ª marcha, añadir 10-15 kgf.',
    {
      what: 'Carga aerodinámica vertical sobre el morro del vehículo.',
      why: 'Proporciona adherencia por downforce a velocidades elevadas.',
      expectedEffect: 'Morro firme y preciso en curvas rápidas.',
      ifProblemPersists: 'Si persiste el subviraje veloz, aumentar carga frontal.',
      nextAction: 'Aumentar 10-15 kgf.',
    }
  );

  rawParams.aero_rear = createTuneParam(
    'aero_rear',
    'AERO',
    'Aerodinámica Trasera',
    baseAeroRear,
    'kgf',
    20.0,
    500.0,
    1.0,
    parts.rearAeroAdjustable,
    'Estabilidad del eje trasero a alta velocidad.',
    'Carga suficiente para evitar sobreviraje en curvas rápidas.',
    'Estabilidad en frenada y curva veloz; menor velocidad tope.',
    'Mayor velocidad máxima pero la cola puede sentirse flotante.',
    ['Sobreviraje a alta velocidad'],
    'Si la cola se mueve en curvas a más de 180 km/h, subir 15 kgf.',
    {
      what: 'Carga aerodinámica vertical sobre el alerón trasero.',
      why: 'Planta el tren motriz posterior a alta velocidad.',
      expectedEffect: 'Zaga anclada en curvas rápidas y frenadas violentas.',
      ifProblemPersists: 'Si la cola se descoloca en curvones rápidos, añadir carga.',
      nextAction: 'Aumentar 15 kgf.',
    }
  );

  // Frenos
  rawParams.brake_balance = createTuneParam(
    'brake_balance',
    'BRAKES',
    'Balance de Frenada',
    baseBrakeBalance,
    '%',
    30.0,
    70.0,
    1.0,
    parts.brakesAdjustable,
    'Distribuir el par de frenado entre el eje delantero y trasero.',
    'Un 52% delantero asegura que las ruedas delanteras frenen primero, mitigando trompos.',
    'Más fuerza adelante: frenada estable pero tendencia al subviraje en entrada.',
    'Más fuerza atrás: ayuda a rotar pero arriesga desestabilizar la zaga.',
    ['Trompo en frenada recta', 'El auto no gira al frenar'],
    'Si el vehículo amaga trompo al frenar en recta, subir al 53% o 54%.',
    {
      what: 'Porcentaje de presión de frenado dirigida al eje delantero.',
      why: 'Equilibra la desaceleración sin bloquear prematuramente las ruedas posteriores.',
      expectedEffect: 'Frenada recta y estable con capacidad de modulación.',
      ifProblemPersists: 'Si no frena recto, mover 1% hacia el frente.',
      nextAction: 'Ajustar a 52% - 53%.',
    }
  );

  rawParams.brake_pressure = createTuneParam(
    'brake_pressure',
    'BRAKES',
    'Presión de Frenado',
    baseBrakePressure,
    '%',
    50.0,
    200.0,
    1.0,
    parts.brakesAdjustable,
    'Sensibilidad de la mordida inicial para modular sin bloqueo.',
    '100% es el punto de referencia estándar en Forza Horizon 5.',
    'Mayor mordida inicial; bloquea más fácilmente si ABS está desactivado.',
    'Recorrido más permisivo, menor riesgo de bloqueo.',
    ['Bloqueo de neumáticos'],
    'Reducir al 95% si bloqueas constantemente ruedas sin ABS.',
    {
      what: 'Multiplicador de potencia aplicado a las pinzas de freno.',
      why: 'Permite adecuar el pedal o gatillo a la fuerza de modulación deseada.',
      expectedEffect: 'Frenada contundente en el umbral previo al bloqueo.',
      ifProblemPersists: 'Si bloquea sin control, reducir al 95%.',
      nextAction: 'Mantener en 100% o ajustar según tacto.',
    }
  );

  // Diferencial
  rawParams.diff_front_accel = createTuneParam(
    'diff_front_accel',
    'DIFFERENTIAL',
    'Diferencial Delantero Aceleración',
    baseDiffFrontAccel,
    '%',
    0.0,
    100.0,
    1.0,
    parts.differentialAdjustable && (drivetrain === 'FWD' || drivetrain === 'AWD'),
    'Traccionar con ambas ruedas delanteras sin trabar el giro de dirección.',
    `En ${drivetrain}, un valor moderado mitiga subviraje por empuje en aceleración.`,
    'Mayor tracción en recta pero el auto tiende a abrirse si aceleras girando.',
    'Giro dócil en aceleración pero la rueda interior puede patinar.',
    ['Subviraje al acelerar en salida'],
    'Si el auto se abre de frente al acelerar en salida, bajar 5-10%.',
    {
      what: 'Porcentaje de bloqueo del diferencial delantero bajo aceleración.',
      why: 'Transfiere par a ambas ruedas delanteras según demanda.',
      expectedEffect: 'Salida de curva con tracción sin resistencia de dirección.',
      ifProblemPersists: 'Si subvira al abrir gas, reducir el porcentaje.',
      nextAction: 'Bajar 5% de aceleración delantera.',
    }
  );

  rawParams.diff_front_decel = createTuneParam(
    'diff_front_decel',
    'DIFFERENTIAL',
    'Diferencial Delantero Deceleración',
    baseDiffFrontDecel,
    '%',
    0.0,
    100.0,
    1.0,
    parts.differentialAdjustable && (drivetrain === 'FWD' || drivetrain === 'AWD'),
    'Giro libre e inserción al soltar el acelerador al entrar en curva.',
    'Un valor entre 0% y 5% permite que las ruedas giren con inercia sin resistencia.',
    'Mayor estabilidad en retención pero produce subviraje en entrada.',
    'Entrada ágil y rápida respuesta de dirección.',
    ['Subviraje al entrar en curva con inercia'],
    'Mantener entre 0% y 5% para agilidad en entrada.',
    {
      what: 'Porcentaje de bloqueo del diferencial delantero al desacelerar.',
      why: 'Evita que el eje delantero se bloquee al frenar o retener con el motor.',
      expectedEffect: 'Inserción limpia al vértice al soltar el gas.',
      ifProblemPersists: 'Si se resiste a entrar en curva, asegurar que esté en 0%-5%.',
      nextAction: 'Mantener en 0% - 5%.',
    }
  );

  rawParams.diff_rear_accel = createTuneParam(
    'diff_rear_accel',
    'DIFFERENTIAL',
    'Diferencial Trasero Aceleración',
    baseDiffRearAccel,
    '%',
    0.0,
    100.0,
    1.0,
    parts.differentialAdjustable && (drivetrain === 'RWD' || drivetrain === 'AWD'),
    'Bloquear ruedas traseras en aceleración para empuje en salida.',
    'Alineado para entrega progresiva sin romper adherencia súbita.',
    'Ambas ruedas empujan juntas; mayor tracción pero propensión a sobreviraje por potencia.',
    'Comportamiento más dócil al abrir gas pero puede patinar la rueda interior.',
    ['Power oversteer (trompo al acelerar)', 'Wheelspin en salida'],
    'Si la cola se descuelga al abrir gas a fondo, reducir al 55%-60%.',
    {
      what: 'Porcentaje de bloqueo del diferencial trasero bajo aceleración.',
      why: 'Proporciona empuje longitudinal simétrico en el eje motriz.',
      expectedEffect: 'Aceleración limpia sin pérdidas en curva de salida.',
      ifProblemPersists: 'Si la trasera rompe tracción súbitamente, bajar 5-10%.',
      nextAction: 'Reducir 5% de aceleración trasera.',
    }
  );

  rawParams.diff_rear_decel = createTuneParam(
    'diff_rear_decel',
    'DIFFERENTIAL',
    'Diferencial Trasero Deceleración',
    baseDiffRearDecel,
    '%',
    0.0,
    100.0,
    1.0,
    parts.differentialAdjustable && (drivetrain === 'RWD' || drivetrain === 'AWD'),
    'Estabilizar el tren trasero al soltar gas y al reducir marchas.',
    'Un 15% a 25% estabiliza la zaga sin bloquear el chasis para rotar.',
    'Estabiliza el coche al soltar gas; frena sobreviraje pero puede causar subviraje.',
    'Permite que la cola rote al levantar el acelerador.',
    ['Inestabilidad al soltar gas', 'Sobreviraje en entrada'],
    'Si la cola se mueve al soltar gas en entrada a curva, subir 5%.',
    {
      what: 'Porcentaje de bloqueo del diferencial trasero al desacelerar.',
      why: 'Controla el efecto de freno motor sobre las ruedas traseras.',
      expectedEffect: 'Retención controlada sin sobresaltos en el eje posterior.',
      ifProblemPersists: 'Si la cola amaga derrape al soltar acelerador, subir decel.',
      nextAction: 'Aumentar 5% la deceleración trasera.',
    }
  );

  rawParams.diff_center_balance = createTuneParam(
    'diff_center_balance',
    'DIFFERENTIAL',
    'Reparto Central AWD (% Trasero)',
    baseDiffCenterBalance,
    '%',
    0.0,
    100.0,
    1.0,
    parts.differentialAdjustable && drivetrain === 'AWD',
    'Porcentaje de potencia dirigido al eje posterior en sistemas AWD.',
    'Un reparto de 65-72% atrás entrega agilidad de propulsión con el agarre de tracción integral.',
    'Mayor rotación y agilidad en vértice con comportamiento de propulsión.',
    'Comportamiento más neutro o subvirador con mayor tracción en línea recta.',
    ['Auto subvira por empuje AWD', 'Exceso de sobreviraje en aceleración'],
    'Si el auto se siente perezoso para girar al acelerar, subir al 70%-72%.',
    {
      what: 'Distribución de par entre el eje delantero y trasero en tracción integral.',
      why: 'Define el carácter dinámico del vehículo en curva acelerada.',
      expectedEffect: 'Rotación ágil que ayuda a cerrar la trayectoria con gas.',
      ifProblemPersists: 'Si empuja de frente, aumentar porcentaje hacia atrás.',
      nextAction: 'Subir a 70% de par trasero.',
    }
  );

  // Transmisión
  rawParams.final_drive = createTuneParam(
    'final_drive',
    'GEARING',
    'Relación Final (Final Drive)',
    baseFinalDrive,
    'ratio',
    2.0,
    6.0,
    0.01,
    parts.transmissionAdjustable,
    'Multiplicador general de par para optimizar la velocidad punta del trazado.',
    `Optimizado para las demandas de ${discipline}.`,
    'Mayor aceleración general pero menor velocidad punta por marcha.',
    'Mayor velocidad punta pero aceleración más pausada.',
    ['Corta inyección antes de la meta', 'Aceleración lenta'],
    'Ajustar para rozar el corte de RPM en la marcha más alta al final de recta.',
    {
      what: 'Relación de engranaje final de la transmisión.',
      why: 'Multiplica todas las relaciones para adaptar la curva de par a la pista.',
      expectedEffect: 'Aceleración uniforme y aprovechamiento de la potencia máxima.',
      ifProblemPersists: 'Si falta velocidad punta, alargar relación final.',
      nextAction: 'Ajustar para rozar el régimen óptimo en la marcha más alta.',
    }
  );

  // Marchas individuales
  baseGears.forEach((ratio, idx) => {
    const gearNum = idx + 1;
    rawParams[`gear_${gearNum}`] = createTuneParam(
      `gear_${gearNum}`,
      'GEARING',
      `${gearNum}ª Marcha`,
      ratio,
      'ratio',
      0.5,
      5.0,
      0.01,
      parts.transmissionAdjustable,
      `Escalonar el salto de revoluciones hacia la ${gearNum}ª velocidad.`,
      `Mantiene el motor en la zona de par óptimo (${vehicle.torqueNm} N·m).`,
      'Marcha más corta (mayor aceleración en esa velocidad).',
      'Marcha más larga (mayor velocidad en esa velocidad).',
      ['Caída de RPM excesiva al cambiar'],
      'Escalonar para evitar caídas de RPM por debajo de la zona de par.',
      {
        what: `Relación de transmisión de la marcha número ${gearNum}.`,
        why: 'Permite sincronizar el régimen de giro tras el cambio.',
        expectedEffect: 'Transición sin pérdida de empuje hacia la siguiente marcha.',
        ifProblemPersists: 'Si cae de vueltas al engranar, acortar ligeramente.',
        nextAction: 'Afinar escalonamiento.',
      }
    );
  });

  // 12. VALIDATE TUNE (Rangos, disponibilidad de piezas y consistencia)
  const initialTune: Tune = {
    id: `tune-${vehicle.id}-${discipline.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    vehicleId: vehicle.id,
    discipline,
    name: `${vehicle.make} ${vehicle.model} - ${discipline}`,
    version: 1,
    versionTag: 'BASE v1.0',
    status: 'BASELINE',
    driverProfile: { ...driverProfile },
    hardwareProfile: { ...hardwareProfile },
    parameters: rawParams,
    balance: {
      grip: 75,
      rotation: 50,
      stability: 70,
      traction: 70,
      coordinates: { x: 0, y: 0 },
    },
    notes: `Reglaje baseline experimental generado deterministamente para ${discipline} bajo física ${drivetrain}.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { validatedTune } = validateTune(initialTune, vehicle);

  // 13. CALCULATE BALANCE
  const balance = calculateBalance(vehicle, validatedTune, discipline);
  validatedTune.balance = balance;

  // 14. RETURN FULL TUNE
  return validatedTune;
}

/**
 * VALIDA Y CORRIGE CONSISTENCIA DE REGLAJES RESPECTO A PIEZAS Y LÍMITES FÍSICOS
 */
export function validateTune(
  tune: Partial<Tune>,
  vehicle: Vehicle
): { valid: boolean; errors: string[]; validatedTune: Tune } {
  const errors: string[] = [];
  const parts = vehicle.parts;
  const drivetrain = vehicle.drivetrain;

  const validParams: Record<string, TuneParameter> = {};
  const currentParams = tune.parameters || {};

  Object.entries(currentParams).forEach(([key, param]) => {
    let isAvailable = true;

    // Verificar disponibilidad según piezas
    if (param.category === 'BRAKES' && !parts.brakesAdjustable) isAvailable = false;
    if (param.category === 'SPRINGS' && !parts.suspensionAdjustable) isAvailable = false;
    if (param.category === 'DAMPING' && !parts.suspensionAdjustable) isAvailable = false;
    if (param.category === 'ALIGNMENT' && !parts.suspensionAdjustable) isAvailable = false;
    if (key === 'arb_front' && !parts.frontArbAdjustable) isAvailable = false;
    if (key === 'arb_rear' && !parts.rearArbAdjustable) isAvailable = false;
    if (key === 'aero_front' && !parts.frontAeroAdjustable) isAvailable = false;
    if (key === 'aero_rear' && !parts.rearAeroAdjustable) isAvailable = false;
    if (param.category === 'GEARING' && !parts.transmissionAdjustable) isAvailable = false;
    if (param.category === 'DIFFERENTIAL' && !parts.differentialAdjustable) isAvailable = false;

    // Diferenciales según drivetrain
    if (key === 'diff_center_balance' && drivetrain !== 'AWD') isAvailable = false;
    if (key.startsWith('diff_front') && drivetrain === 'RWD') isAvailable = false;
    if (key.startsWith('diff_rear') && drivetrain === 'FWD') isAvailable = false;

    // Clamping de valor numérico
    let val = param.value;
    if (isNaN(val)) {
      val = param.min;
      errors.push(`El parámetro ${param.name} tenía valor NaN. Se reajustó al mínimo.`);
    } else if (val < param.min) {
      errors.push(`El parámetro ${param.name} (${val}) estaba por debajo del mínimo permitido (${param.min}).`);
      val = param.min;
    } else if (val > param.max) {
      errors.push(`El parámetro ${param.name} (${val}) superaba el máximo permitido (${param.max}).`);
      val = param.max;
    }

    // Redondear a step
    val = Number(val.toFixed(param.step < 0.1 ? 2 : 1));

    validParams[key] = {
      ...param,
      value: val,
      available: isAvailable,
      isAvailable,
    };
  });

  const validatedTune: Tune = {
    id: tune.id || `tune-${vehicle.id}-${Date.now()}`,
    vehicleId: vehicle.id,
    discipline: tune.discipline || vehicle.currentDiscipline || 'ROAD RACING',
    name: tune.name || `${vehicle.make} ${vehicle.model} Tune`,
    version: tune.version || 1,
    versionTag: tune.versionTag || 'BASE v1.0',
    status: tune.status || 'BASELINE',
    driverProfile: tune.driverProfile || DEFAULT_DRIVER_PROFILE,
    hardwareProfile: tune.hardwareProfile || DEFAULT_HARDWARE_PROFILE,
    parameters: validParams,
    balance: tune.balance || {
      grip: 70,
      rotation: 50,
      stability: 70,
      traction: 70,
      coordinates: { x: 0, y: 0 },
    },
    notes: tune.notes || '',
    createdAt: tune.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    valid: errors.length === 0,
    errors,
    validatedTune,
  };
}

/**
 * ESTIMACIÓN DE BALANCE HEURÍSTICA DE INGENIERÍA
 * Calcula los 4 indicadores técnicos (0 a 100) y las coordenadas de vector de balance
 * derivados de los parámetros del tune y características del vehículo.
 * Nota: Es explícitamente una ESTIMACIÓN DE BALANCE (modelo heurístico).
 */
export function calculateBalance(
  vehicle: Vehicle,
  tuneOrParams: Tune | Record<string, TuneParameter>,
  discipline?: Discipline
): VehicleBalance {
  const isTune = (tp: any): tp is Tune => tp && typeof tp === 'object' && 'parameters' in tp && typeof tp.parameters === 'object';
  const params: Record<string, TuneParameter> = isTune(tuneOrParams)
    ? tuneOrParams.parameters
    : (tuneOrParams as Record<string, TuneParameter>);
  const disc = discipline || (isTune(tuneOrParams) ? tuneOrParams.discipline : vehicle.currentDiscipline) || 'ROAD RACING';

  return calculateVehicleBalance(params, vehicle, disc);
}

/**
 * Función central de cálculo de balance numérico para retrocompatibilidad
 */
export function calculateVehicleBalance(
  parameters: Record<string, TuneParameter>,
  vehicle: Vehicle,
  discipline: Discipline
): VehicleBalance {
  // Parámetros clave con salvaguardas
  const arbFront = parameters.arb_front?.value ?? 25;
  const arbRear = parameters.arb_rear?.value ?? 30;
  const aeroRear = parameters.aero_rear?.value ?? 120;
  const camberFront = Math.abs(parameters.camber_front?.value ?? 1.8);
  const diffCenter = parameters.diff_center_balance?.value ?? 68;
  const diffRearAccel = parameters.diff_rear_accel?.value ?? 65;
  const tirePressureFront = parameters.tire_pressure_front?.value ?? 28.5;

  // 1. GRIP MECÁNICO (0 - 100)
  let gripBase = 68;
  if (vehicle.parts.tireCompound === 'Race' || vehicle.parts.tireCompound === 'Semi-Slick') gripBase += 16;
  if (vehicle.parts.tireCompound === 'Rally') gripBase += 10;
  if (vehicle.parts.tireCompound === 'Offroad' && (discipline === 'CROSS COUNTRY' || discipline === 'DIRT')) gripBase += 18;
  if (camberFront >= 1.5 && camberFront <= 2.2) gripBase += 5;
  if (aeroRear > 130) gripBase += 5;
  if (tirePressureFront >= 27.0 && tirePressureFront <= 29.5) gripBase += 4;
  const grip = Math.min(99, Math.max(25, Math.round(gripBase)));

  // 2. ROTACIÓN DE CHASIS (0 - 100)
  const arbDelta = arbRear - arbFront; // delta positivo favorece rotación posterior
  let rotationBase = 50 + arbDelta * 0.8;
  if (vehicle.drivetrain === 'AWD') {
    rotationBase += (diffCenter - 50) * 0.35;
  } else if (vehicle.drivetrain === 'RWD') {
    rotationBase += 8;
  }
  if (discipline === 'DRIFT') rotationBase += 24;
  const rotation = Math.min(98, Math.max(20, Math.round(rotationBase)));

  // 3. ESTABILIDAD DINÁMICA (0 - 100)
  let stabilityBase = 70;
  stabilityBase += aeroRear / 35;
  stabilityBase -= arbDelta * 0.45;
  if (discipline === 'CROSS COUNTRY') stabilityBase += 8;
  if (discipline === 'DRIFT') stabilityBase -= 18;
  const stability = Math.min(98, Math.max(20, Math.round(stabilityBase)));

  // 4. TRACCIÓN LONGITUDINAL (0 - 100)
  let tractionBase = 60;
  if (vehicle.drivetrain === 'AWD') tractionBase += 24;
  else if (vehicle.drivetrain === 'FWD') tractionBase -= 6;
  if (diffRearAccel >= 55 && diffRearAccel <= 85) tractionBase += 6;
  if (vehicle.parts.rearTireWidthMm > 285) tractionBase += 5;
  const traction = Math.min(99, Math.max(25, Math.round(tractionBase)));

  // Coordenadas cartesianas en el Vector de Balance:
  // X: -50 (Subviraje) a +50 (Sobreviraje)
  // Y: -50 (Blando/Absorción) a +50 (Rígido/Grip puro)
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
