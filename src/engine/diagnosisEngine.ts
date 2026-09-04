/**
 * APEX TUNING ENGINE — FH5
 * MOTOR DE DIAGNÓSTICO BASADO EN PROBABILIDAD Y PRIORIDAD
 * Identifica causas potenciales y determina UNA intervención primaria prioritaria
 */

import {
  TestSession,
  Tune,
  DiagnosisResult,
  DiagnosisCause,
  PrimaryIntervention,
  TuneParameter,
} from '../types';

export function diagnoseTestSession(
  session: TestSession,
  currentTune: Tune
): DiagnosisResult[] {
  const results: DiagnosisResult[] = [];
  const symptoms = session.symptoms;
  const params = currentTune.parameters;

  // 1. Diagnóstico de Mitad de Curva (Mid Corner)
  if (symptoms.midCorner === 'Subviraje') {
    const causes: DiagnosisCause[] = [
      {
        component: 'Barra estabilizadora delantera (ARB)',
        parameterKey: 'arb_front',
        probability: 90,
        rationale: 'Excesiva rigidez torsional lateral en el eje delantero satura el neumático exterior y no le permite morder el asfalto.',
      },
      {
        component: 'Camber delantero insuficiente',
        parameterKey: 'camber_front',
        probability: 80,
        rationale: 'Con la carrocería apoyada, la banda de rodadura delantera no apoya plana y pierde adherencia lateral en el vértice.',
      },
      {
        component: 'Muelles delanteros excesivamente rígidos',
        parameterKey: 'springs_front',
        probability: 60,
        rationale: 'La suspensión delantera no transfiere masa hacia la rueda exterior para generar agarre mecánico.',
      },
      {
        component: 'Presión de neumático delantero alta',
        parameterKey: 'tire_pressure_front',
        probability: 50,
        rationale: 'El neumático delantero sobre-inflado reduce el área de la huella de contacto en apoyo.',
      },
      {
        component: 'Aerodinámica delantera insuficiente',
        parameterKey: 'aero_front',
        probability: 30,
        rationale: 'Si la curva se negocia por encima de 130 km/h, falta de downforce en el splitter frontal.',
      },
    ];

    // Determinar la ÚNICA intervención primaria prioritaria siguiendo la jerarquía:
    // Balance (ARB) es prioridad 3 y 90% probabilidad
    const currentArb = params.arb_front?.value ?? 30.0;
    const recommendedArb = Math.max(params.arb_front?.min ?? 1.0, Number((currentArb - 3.5).toFixed(1)));

    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'arb_front',
      parameterName: 'Barra Estabilizadora Delantera',
      currentValue: currentArb,
      recommendedValue: recommendedArb,
      unit: '1.0 - 65.0',
      delta: Number((recommendedArb - currentArb).toFixed(1)),
      explanation: 'Reducir ligeramente la rigidez de la barra estabilizadora delantera para permitir mayor transferencia de carga al neumático exterior delantero.',
      actionInstruction: `Disminuir la Barra Estabilizadora Delantera de ${currentArb} a ${recommendedArb} (-3.5 puntos).`,
      priorityCategory: 'Balance',
    };

    results.push({
      symptomAnalyzed: 'Subviraje en mitad de curva (Mid-Corner Understeer)',
      zone: 'MITAD DE CURVA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Realiza otra prueba de 2-3 vueltas antes de aplicar otra modificación en muelles o alineación.',
    });
  }

  if (symptoms.midCorner === 'Sobreviraje') {
    const causes: DiagnosisCause[] = [
      {
        component: 'Barra estabilizadora trasera (ARB)',
        parameterKey: 'arb_rear',
        probability: 88,
        rationale: 'La barra trasera es excesivamente rígida en comparación con la delantera, forzando a la zaga a perder adherencia primero.',
      },
      {
        component: 'Camber trasero descalibrado',
        parameterKey: 'camber_rear',
        probability: 72,
        rationale: 'El neumático trasero pierde contacto plano cuando el vehículo asienta el apoyo en curvón.',
      },
      {
        component: 'Aerodinámica trasera insuficiente',
        parameterKey: 'aero_rear',
        probability: 65,
        rationale: 'Falta de downforce en alerón posterior para anclar el eje en curvas rápidas.',
      },
      {
        component: 'Presión trasera sobre-inflada',
        parameterKey: 'tire_pressure_rear',
        probability: 45,
        rationale: 'Menor huella de contacto en el eje posterior.',
      },
    ];

    const currentArb = params.arb_rear?.value ?? 35.0;
    const recommendedArb = Math.max(params.arb_rear?.min ?? 1.0, Number((currentArb - 4.0).toFixed(1)));

    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'arb_rear',
      parameterName: 'Barra Estabilizadora Trasera',
      currentValue: currentArb,
      recommendedValue: recommendedArb,
      unit: '1.0 - 65.0',
      delta: Number((recommendedArb - currentArb).toFixed(1)),
      explanation: 'Suavizar la barra trasera para que el tren posterior absorba apoyo lateral y no rompa adherencia en el vértice.',
      actionInstruction: `Reducir la Barra Estabilizadora Trasera de ${currentArb} a ${recommendedArb} (-4.0 puntos).`,
      priorityCategory: 'Balance',
    };

    results.push({
      symptomAnalyzed: 'Sobreviraje en mitad de curva (Snap / Mid-Corner Oversteer)',
      zone: 'MITAD DE CURVA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Realiza otra prueba antes de aplicar otra modificación.',
    });
  }

  // 2. Diagnóstico de Entrada (Corner Entry)
  if (symptoms.cornerEntry === 'Subviraje') {
    const currentDecel = params.diff_front_decel?.value ?? 5;
    const causes: DiagnosisCause[] = [
      {
        component: 'Diferencial delantero en deceleración',
        parameterKey: 'diff_front_decel',
        probability: 85,
        rationale: 'El bloqueo de deceleración del diferencial delantero fuerza a ambas ruedas a rodar a la misma velocidad al soltar gas, impidiendo el giro.',
      },
      {
        component: 'Toe delantero (Convergencia)',
        parameterKey: 'toe_front',
        probability: 70,
        rationale: 'Falta de divergencia leve (Toe Out) que impulse la inserción en el primer movimiento de volante.',
      },
      {
        component: 'Reparto de frenada delantero excesivo',
        parameterKey: 'brake_balance',
        probability: 65,
        rationale: 'Frenar bloqueando parcialmente la tracción delantera priva a la rueda de capacidad direccional.',
      },
    ];

    const recommendedDecel = Math.max(0, currentDecel - 5);
    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'diff_front_decel',
      parameterName: 'Diferencial Delantero Deceleración',
      currentValue: currentDecel,
      recommendedValue: recommendedDecel,
      unit: '%',
      delta: recommendedDecel - currentDecel,
      explanation: 'Liberar el diferencial delantero en deceleración para que la rueda interior ruede libre en la inserción.',
      actionInstruction: `Bajar Diferencial Delantero Decel a ${recommendedDecel}%.`,
      priorityCategory: 'Diferencial',
    };

    results.push({
      symptomAnalyzed: 'Subviraje en entrada de curva (Entry Understeer)',
      zone: 'ENTRADA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Realiza otra prueba antes de aplicar otra modificación.',
    });
  }

  if (symptoms.cornerEntry === 'Sobreviraje' || symptoms.cornerEntry === 'Nervioso') {
    const currentDecel = params.diff_rear_decel?.value ?? 20;
    const causes: DiagnosisCause[] = [
      {
        component: 'Diferencial trasero en deceleración abierto',
        parameterKey: 'diff_rear_decel',
        probability: 82,
        rationale: 'Al soltar gas en entrada a curva, la rueda trasera interior gira sin freno y la cola rota descontrolada (lift-off oversteer).',
      },
      {
        component: 'Extensión trasera (Rebound) blanda',
        parameterKey: 'rebound_rear',
        probability: 75,
        rationale: 'La suspensión trasera se estira demasiado rápido en frenada, descargando los neumáticos traseros.',
      },
      {
        component: 'Balance de frenos atrasado',
        parameterKey: 'brake_balance',
        probability: 60,
        rationale: 'Fuerza de frenado sobrepasando la adherencia trasera.',
      },
    ];

    const recommendedDecel = Math.min(60, currentDecel + 8);
    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'diff_rear_decel',
      parameterName: 'Diferencial Trasero Deceleración',
      currentValue: currentDecel,
      recommendedValue: recommendedDecel,
      unit: '%',
      delta: 8,
      explanation: 'Incrementar el bloqueo de deceleración trasero para amarrar la zaga cuando levantas el pie del gas en el turn-in.',
      actionInstruction: `Aumentar Diferencial Trasero Decel de ${currentDecel}% a ${recommendedDecel}% (+8%).`,
      priorityCategory: 'Diferencial',
    };

    results.push({
      symptomAnalyzed: 'Zaga nerviosa / Sobreviraje en entrada (Lift-off Oversteer)',
      zone: 'ENTRADA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Realiza otra prueba antes de aplicar otra modificación.',
    });
  }

  // 3. Diagnóstico de Salida de Curva (Corner Exit)
  if (symptoms.cornerExit === 'Subviraje') {
    const currentCenter = params.diff_center_balance?.value ?? 65;
    const causes: DiagnosisCause[] = [
      {
        component: 'Reparto central AWD muy frontal o diferencial del. aceleración alto',
        parameterKey: 'diff_center_balance',
        probability: 85,
        rationale: 'La tracción delantera tira con exceso de fuerza al pisar a fondo en el ápice, empujando la trompa hacia la escapatoria.',
      },
      {
        component: 'Diferencial delantero aceleración alto',
        parameterKey: 'diff_front_accel',
        probability: 80,
        rationale: 'Ambas ruedas delanteras se traban juntas al acelerar impidiendo el radio de giro.',
      },
    ];

    const recommendedCenter = Math.min(80, currentCenter + 6);
    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'diff_center_balance',
      parameterName: 'Reparto Central AWD (% Trasero)',
      currentValue: currentCenter,
      recommendedValue: recommendedCenter,
      unit: '%',
      delta: 6,
      explanation: 'Enviar más potencia al eje trasero para inducir una leve rotación bajo gas y liberar al eje delantero para dirigir.',
      actionInstruction: `Aumentar Reparto Central Trasero de ${currentCenter}% a ${recommendedCenter}% (+6% atrás).`,
      priorityCategory: 'Diferencial',
    };

    results.push({
      symptomAnalyzed: 'Subviraje en salida con gas a fondo (Power Understeer)',
      zone: 'SALIDA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Realiza otra prueba antes de aplicar otra modificación.',
    });
  }

  if (symptoms.cornerExit === 'Power oversteer' || symptoms.cornerExit === 'Sobreviraje') {
    const currentRearAccel = params.diff_rear_accel?.value ?? 75;
    const causes: DiagnosisCause[] = [
      {
        component: 'Diferencial trasero de aceleración muy agresivo',
        parameterKey: 'diff_rear_accel',
        probability: 92,
        rationale: 'El diferencial bloquea instantáneamente ambas ruedas traseras en aceleración, rompiendo la tracción lateral en derrape no deseado.',
      },
      {
        component: 'Barra trasera demasiado rígida',
        parameterKey: 'arb_rear',
        probability: 70,
        rationale: 'No permite que la rueda exterior trasera tome carga sin deslizar.',
      },
      {
        component: 'Presión trasera excesiva',
        parameterKey: 'tire_pressure_rear',
        probability: 55,
        rationale: 'Sobrecalentamiento y menor parche longitudinal.',
      },
    ];

    const recommendedRearAccel = Math.max(35, currentRearAccel - 12);
    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'diff_rear_accel',
      parameterName: 'Diferencial Trasero Aceleración',
      currentValue: currentRearAccel,
      recommendedValue: recommendedRearAccel,
      unit: '%',
      delta: -12,
      explanation: 'Permitir que la rueda exterior gire con más libertad al acelerar para dosificar la tracción y evitar trompo súbito.',
      actionInstruction: `Reducir Diferencial Trasero Aceleración de ${currentRearAccel}% a ${recommendedRearAccel}% (-12%).`,
      priorityCategory: 'Diferencial',
    };

    results.push({
      symptomAnalyzed: 'Sobreviraje por potencia en salida (Power Oversteer)',
      zone: 'SALIDA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Realiza otra prueba antes de aplicar otra modificación.',
    });
  }

  // 4. Diagnóstico de Frenada
  if (symptoms.braking === 'Se va de frente' || symptoms.braking === 'No gira') {
    const currentBalance = params.brake_balance?.value ?? 52.0;
    const causes: DiagnosisCause[] = [
      {
        component: 'Balance de frenada con excesivo sesgo delantero',
        parameterKey: 'brake_balance',
        probability: 88,
        rationale: 'Las pinzas delanteras acaparan la frenada bloqueando la dirección o saturando el agarre antes del giro.',
      },
      {
        component: 'Presión de frenado al 100% sin ABS',
        parameterKey: 'brake_pressure',
        probability: 65,
        rationale: 'Bloqueo neumático inmediato en el tren delantero.',
      },
    ];

    const recommendedBalance = Math.max(48.0, Number((currentBalance - 2.0).toFixed(1)));
    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'brake_balance',
      parameterName: 'Balance de Frenada',
      currentValue: currentBalance,
      recommendedValue: recommendedBalance,
      unit: '%',
      delta: Number((recommendedBalance - currentBalance).toFixed(1)),
      explanation: 'Equilibrar el reparto de frenada hacia atrás para permitir que las ruedas delanteras mantengan capacidad direccional.',
      actionInstruction: `Reducir Balance de Frenada Delantero de ${currentBalance}% a ${recommendedBalance}%.`,
      priorityCategory: 'Seguridad',
    };

    results.push({
      symptomAnalyzed: 'Pérdida direccional en frenada fuerte',
      zone: 'FRENADA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Realiza otra prueba antes de aplicar otra modificación.',
    });
  }

  // 5. Diagnóstico de Suspensión
  if (symptoms.suspension === 'Rebota') {
    const currentRebound = params.rebound_front?.value ?? 10.5;
    const causes: DiagnosisCause[] = [
      {
        component: 'Amortiguadores: Extensión (Rebound) desfasada o rígida',
        parameterKey: 'rebound_front',
        probability: 85,
        rationale: 'La suspensión no deja estirar el muelle a tiempo, empaquetando la carrocería en ondulaciones sucesivas.',
      },
      {
        component: 'Muelles delanteros excesivamente duros',
        parameterKey: 'springs_front',
        probability: 75,
        rationale: 'La frecuencia natural de oscilación es demasiado alta para las irregularidades del trazado.',
      },
      {
        component: 'Compresión (Bump) excesiva',
        parameterKey: 'bump_front',
        probability: 60,
        rationale: 'El amortiguador no absorbe el golpe inicial del bache.',
      },
    ];

    const recommendedRebound = Math.max(3.0, Number((currentRebound - 1.5).toFixed(1)));
    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'rebound_front',
      parameterName: 'Extensión Delantera (Rebound)',
      currentValue: currentRebound,
      recommendedValue: recommendedRebound,
      unit: '1.0 - 20.0',
      delta: Number((recommendedRebound - currentRebound).toFixed(1)),
      explanation: 'Suavizar la extensión para que la rueda recupere contacto inmediato con el piso tras superar la ondulación.',
      actionInstruction: `Bajar Extensión Delantera de ${currentRebound} a ${recommendedRebound} (-1.5 puntos).`,
      priorityCategory: 'Suspensión',
    };

    results.push({
      symptomAnalyzed: 'El vehículo rebota en superficie irregular',
      zone: 'SUSPENSIÓN',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Realiza otra prueba antes de aplicar otra modificación.',
    });
  }

  if (symptoms.suspension === 'Toca fondo') {
    const currentHeight = params.ride_height_front?.value ?? 8.0;
    const causes: DiagnosisCause[] = [
      {
        component: 'Altura de carrocería excesivamente baja',
        parameterKey: 'ride_height_front',
        probability: 90,
        rationale: 'El recorrido útil de los amortiguadores se agota y los brazos de suspensión golpean los topes de goma mecánicos.',
      },
      {
        component: 'Muelles demasiado blandos',
        parameterKey: 'springs_front',
        probability: 70,
        rationale: 'No soportan la carga cinética en compresiones de saltos o apoyos en rasante.',
      },
    ];

    const recommendedHeight = Number((currentHeight + 1.0).toFixed(1));
    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'ride_height_front',
      parameterName: 'Altura Delantera',
      currentValue: currentHeight,
      recommendedValue: recommendedHeight,
      unit: 'cm',
      delta: 1.0,
      explanation: 'Elevar la altura delantera para recuperar recorrido libre de compresión y evitar colisión de bajos.',
      actionInstruction: `Subir Altura Delantera de ${currentHeight} cm a ${recommendedHeight} cm (+1.0 cm).`,
      priorityCategory: 'Suspensión',
    };

    results.push({
      symptomAnalyzed: 'El auto hace tope contra el suelo (Bottom Out)',
      zone: 'SUSPENSIÓN',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Realiza otra prueba antes de aplicar otra modificación.',
    });
  }

  // Si no se encontraron síntomas o todo está estable
  if (results.length === 0) {
    results.push({
      symptomAnalyzed: 'Telemetría y comportamiento nominal / Estable',
      zone: 'GLOBAL',
      possibleCauses: [
        {
          component: 'Comportamiento en equilibrio',
          parameterKey: 'arb_front',
          probability: 99,
          rationale: 'El chasis responde a las exigencias dinámicas sin síntomas críticos reportados.',
        },
      ],
      primaryIntervention: {
        parameterKey: 'none',
        parameterName: 'Mantener Reglaje Actual',
        currentValue: 0,
        recommendedValue: 0,
        unit: '',
        delta: 0,
        explanation: 'No se detectan discrepancias dinámicas críticas en los sectores analizados.',
        actionInstruction: 'Continuar rodando para acumular datos de tiempos de vuelta y degradación térmica.',
        priorityCategory: 'Balance',
      },
      nextStepWarning: 'Realiza otra prueba antes de aplicar otra modificación.',
    });
  }

  return results;
}
