/**
 * APEX TUNING ENGINE — FH5
 * MOTOR DE DIAGNÓSTICO BASADO EN PROBABILIDAD Y PRIORIDAD V1.1
 *
 * Flujo de Diagnóstico:
 * SÍNTOMA -> CAUSAS CANDIDATAS -> PROBABILIDAD -> PRIORIDAD -> INTERVENCIÓN PRIMARIA ÚNICA -> EFECTO ESPERADO -> RE-TEST
 *
 * Principio: Separación estricta entre Baseline (punto de partida) y Diagnóstico (evolución reactiva).
 * Lenguaje de ingeniería: Sin afirmaciones absolutas ("siempre", "obligatorio"). Se emplean términos como
 * "punto inicial recomendado", "tendencia observada", "intervención prioritaria", "verificar en 2-3 vueltas".
 */

import {
  TestSession,
  Tune,
  Vehicle,
  DiagnosisResult,
  DiagnosisCause,
  PrimaryIntervention,
} from '../types';

export function diagnoseTestSession(
  session: TestSession,
  currentTune: Tune,
  vehicle?: Vehicle
): DiagnosisResult[] {
  const results: DiagnosisResult[] = [];
  const symptoms = session.symptoms;
  const params = currentTune.parameters;
  const drivetrain = vehicle?.drivetrain || 'AWD';

  // 1. Diagnóstico de Mitad de Curva (Mid Corner)
  if (symptoms.midCorner === 'Subviraje') {
    const causes: DiagnosisCause[] = [
      {
        component: 'Barra estabilizadora delantera (ARB)',
        parameterKey: 'arb_front',
        probability: 90,
        rationale: 'Excesiva rigidez torsional lateral en el eje delantero tiende a saturar el neumático exterior, reduciendo el agarre lateral disponible en apoyo.',
      },
      {
        component: 'Camber delantero insuficiente',
        parameterKey: 'camber_front',
        probability: 80,
        rationale: 'Con la carrocería inclinada en apoyo, la banda de rodadura no trabaja en su ángulo óptimo respecto al piso.',
      },
      {
        component: 'Muelles delanteros con rigidez elevada',
        parameterKey: 'springs_front',
        probability: 60,
        rationale: 'La suspensión delantera limita la transferencia de carga hacia la rueda exterior reduciendo el agarre mecánico.',
      },
      {
        component: 'Presión de neumático delantero alta',
        parameterKey: 'tire_pressure_front',
        probability: 50,
        rationale: 'Presión por encima del rango óptimo reduce el área efectiva del parche de contacto.',
      },
      {
        component: 'Aerodinámica delantera reducida',
        parameterKey: 'aero_front',
        probability: 35,
        rationale: 'En curvas de velocidad media-alta (>130 km/h), la falta de carga vertical limita el agarre del tren delantero.',
      },
    ];

    const currentArb = params.arb_front?.value ?? 30.0;
    const minArb = params.arb_front?.min ?? 1.0;
    const recommendedArb = Math.max(minArb, Number((currentArb - 3.0).toFixed(1)));
    const delta = Number((recommendedArb - currentArb).toFixed(1));

    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'arb_front',
      parameterName: 'Barra Estabilizadora Delantera',
      currentValue: currentArb,
      recommendedValue: recommendedArb,
      unit: '1.0 - 65.0',
      delta,
      direction: 'DISMINUIR',
      reason: 'Reducir la rigidez torsional lateral del eje delantero para aumentar el agarre relativo en el neumático exterior durante el apoyo.',
      expectedEffect: 'Mayor inserción y menor tendencia a abrirse de trayectoria a mitad del giro.',
      risk: 'Si se suaviza en exceso, la dirección puede perder inmediatez de respuesta.',
      priority: 'Balance',
      retestInstruction: 'Realizar una tanda de prueba de 2 a 3 vueltas completas antes de alterar muelles o alineación.',
      // Retrocompatibilidad
      explanation: 'Reducir la rigidez torsional delantera para permitir mayor transferencia de carga al neumático exterior.',
      actionInstruction: `Disminuir Barra Delantera de ${currentArb} a ${recommendedArb} (${delta} puntos).`,
      priorityCategory: 'Balance',
    };

    results.push({
      symptomAnalyzed: 'Subviraje a mitad de curva (Mid-Corner Understeer)',
      zone: 'MITAD DE CURVA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Evaluar el comportamiento en 2 vueltas limpias antes de tocar un segundo parámetro.',
    });
  }

  if (symptoms.midCorner === 'Sobreviraje') {
    const causes: DiagnosisCause[] = [
      {
        component: 'Barra estabilizadora trasera (ARB)',
        parameterKey: 'arb_rear',
        probability: 88,
        rationale: 'La barra trasera presenta rigidez desproporcionada respecto a la delantera, induciendo saturación prematura de agarre lateral en la zaga.',
      },
      {
        component: 'Camber trasero descalibrado',
        parameterKey: 'camber_rear',
        probability: 72,
        rationale: 'El neumático posterior no apoya con suficiente caída negativa para contrarrestar el balanceo del chasis.',
      },
      {
        component: 'Aerodinámica trasera insuficiente',
        parameterKey: 'aero_rear',
        probability: 65,
        rationale: 'En curvas rápidas, la falta de carga vertical en el alerón suelta el tren posterior.',
      },
      {
        component: 'Presión trasera sobre-inflada',
        parameterKey: 'tire_pressure_rear',
        probability: 45,
        rationale: 'Parche de contacto posterior estrecho y propenso a deslizar.',
      },
    ];

    const currentArb = params.arb_rear?.value ?? 35.0;
    const minArb = params.arb_rear?.min ?? 1.0;
    const recommendedArb = Math.max(minArb, Number((currentArb - 3.5).toFixed(1)));
    const delta = Number((recommendedArb - currentArb).toFixed(1));

    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'arb_rear',
      parameterName: 'Barra Estabilizadora Trasera',
      currentValue: currentArb,
      recommendedValue: recommendedArb,
      unit: '1.0 - 65.0',
      delta,
      direction: 'DISMINUIR',
      reason: 'Suavizar la barra trasera para que el tren posterior conserve mayor adherencia lateral durante el apoyo máximo.',
      expectedEffect: 'Tren trasero más asentado y dócil en apoyos prolongados.',
      risk: 'Una reducción excesiva puede restar agilidad de giro en curvas lentas.',
      priority: 'Balance',
      retestInstruction: 'Comprobar estabilidad en curvones medios antes de ajustar muelles traseros.',
      explanation: 'Suavizar la barra trasera para asentar el eje posterior y evitar deslizamiento en el vértice.',
      actionInstruction: `Reducir Barra Trasera de ${currentArb} a ${recommendedArb} (${delta} puntos).`,
      priorityCategory: 'Balance',
    };

    results.push({
      symptomAnalyzed: 'Sobreviraje a mitad de curva (Snap / Mid-Corner Oversteer)',
      zone: 'MITAD DE CURVA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Realizar prueba de 2 vueltas verificando que la cola no amague derrape en apoyo.',
    });
  }

  // 2. Diagnóstico de Entrada (Corner Entry)
  if (symptoms.cornerEntry === 'Subviraje') {
    const isAwdOrFwd = drivetrain === 'AWD' || drivetrain === 'FWD';
    const currentDecel = params.diff_front_decel?.value ?? 5;

    const causes: DiagnosisCause[] = [
      {
        component: isAwdOrFwd ? 'Diferencial delantero en deceleración' : 'Alineación delantera (Toe)',
        parameterKey: isAwdOrFwd ? 'diff_front_decel' : 'toe_front',
        probability: isAwdOrFwd ? 85 : 78,
        rationale: isAwdOrFwd
          ? 'El bloqueo del diferencial delantero al decelerar fuerza a ambas ruedas a girar a velocidad similar, oponiéndose al giro de entrada.'
          : 'Falta de divergencia leve en el tren delantero para favorecer la respuesta inicial al mover el volante.',
      },
      {
        component: 'Reparto de frenada delantero excesivo',
        parameterKey: 'brake_balance',
        probability: 70,
        rationale: 'Frenar con exceso de presión frontal satura la capacidad direccional de los neumáticos delanteros.',
      },
      {
        component: 'Toe delantero (Convergencia)',
        parameterKey: 'toe_front',
        probability: 65,
        rationale: 'Convergencia positiva estabiliza la recta pero ralentiza la inserción al vértice.',
      },
    ];

    let primaryIntervention: PrimaryIntervention;

    if (isAwdOrFwd && params.diff_front_decel?.available) {
      const recommendedDecel = Math.max(0, currentDecel - 5);
      const delta = recommendedDecel - currentDecel;
      primaryIntervention = {
        parameterKey: 'diff_front_decel',
        parameterName: 'Diferencial Delantero Deceleración',
        currentValue: currentDecel,
        recommendedValue: recommendedDecel,
        unit: '%',
        delta,
        direction: delta < 0 ? 'DISMINUIR' : 'MANTENER',
        reason: 'Liberar el diferencial delantero al desacelerar para que la rueda interior gire con mayor libertad en la entrada.',
        expectedEffect: 'El morro entra con mayor facilidad al soltar el pedal del freno o gas.',
        risk: 'Valores muy bajos pueden provocar leve inestabilidad en frenadas sobre asfalto irregular.',
        priority: 'Diferencial',
        retestInstruction: 'Observar si el coche apunta al ápice con menor esfuerzo en el volante.',
        explanation: 'Reducir el bloqueo de deceleración delantero para facilitar el giro de inserción.',
        actionInstruction: `Ajustar Diferencial Delantero Decel a ${recommendedDecel}%.`,
        priorityCategory: 'Diferencial',
      };
    } else {
      const currentToe = params.toe_front?.value ?? 0.0;
      const recommendedToe = Number((currentToe - 0.1).toFixed(1));
      const delta = Number((recommendedToe - currentToe).toFixed(1));
      primaryIntervention = {
        parameterKey: 'toe_front',
        parameterName: 'Toe Delantero (Convergencia)',
        currentValue: currentToe,
        recommendedValue: recommendedToe,
        unit: '°',
        delta,
        direction: 'DISMINUIR',
        reason: 'Aplicar ligera divergencia (-0.1°) para dinamizar la respuesta inicial del eje directriz.',
        expectedEffect: 'Entrada más reactiva al primer toque de volante.',
        risk: 'Exceso de divergencia puede generar ligereza en recta a velocidades superiores a 200 km/h.',
        priority: 'Balance',
        retestInstruction: 'Evaluar la estabilidad en recta antes y después del ajuste.',
        explanation: 'Aplicar leve divergencia delantera para respuesta ágil.',
        actionInstruction: `Modificar Toe Delantero a ${recommendedToe}°.`,
        priorityCategory: 'Balance',
      };
    }

    results.push({
      symptomAnalyzed: 'Subviraje en entrada de curva (Entry Understeer)',
      zone: 'ENTRADA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Comprobar en la primera curva tras recta si la inserción es limpia.',
    });
  }

  if (symptoms.cornerEntry === 'Sobreviraje' || symptoms.cornerEntry === 'Nervioso') {
    const currentDecel = params.diff_rear_decel?.value ?? 20;
    const causes: DiagnosisCause[] = [
      {
        component: 'Diferencial trasero en deceleración bajo',
        parameterKey: 'diff_rear_decel',
        probability: 82,
        rationale: 'Al soltar el acelerador en entrada, la zaga queda excesivamente libre y la inercia provoca sobreviraje por descompresión.',
      },
      {
        component: 'Extensión trasera (Rebound) blanda',
        parameterKey: 'rebound_rear',
        probability: 75,
        rationale: 'Los amortiguadores traseros se extienden con excesiva rapidez en frenada descargando el eje posterior.',
      },
      {
        component: 'Reparto de frenos con sesgo hacia atrás',
        parameterKey: 'brake_balance',
        probability: 68,
        rationale: 'Fuerza excesiva en frenos traseros induce pérdida de agarre en el eje posterior al desacelerar.',
      },
    ];

    const recommendedDecel = Math.min(65, currentDecel + 6);
    const delta = recommendedDecel - currentDecel;

    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'diff_rear_decel',
      parameterName: 'Diferencial Trasero Deceleración',
      currentValue: currentDecel,
      recommendedValue: recommendedDecel,
      unit: '%',
      delta,
      direction: 'AUMENTAR',
      reason: 'Aumentar el bloqueo de deceleración trasero para calmar la zaga al levantar el acelerador o bajar marchas.',
      expectedEffect: 'Mayor estabilidad y compostura en el tren posterior durante el turn-in.',
      risk: 'Un valor excesivo puede inducir subviraje en la fase inicial del giro.',
      priority: 'Diferencial',
      retestInstruction: 'Dar 2 vueltas evaluando si la cola permanece estable al soltar el gas en frenada.',
      explanation: 'Aumentar el bloqueo de deceleración trasero para fijar la trayectoria.',
      actionInstruction: `Subir Diferencial Trasero Decel de ${currentDecel}% a ${recommendedDecel}% (+${delta}%).`,
      priorityCategory: 'Diferencial',
    };

    results.push({
      symptomAnalyzed: 'Zaga inestable / Sobreviraje en entrada (Lift-off Oversteer)',
      zone: 'ENTRADA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Comprobar que el coche no presente subviraje como efecto secundario.',
    });
  }

  // 3. Diagnóstico de Salida de Curva (Corner Exit)
  if (symptoms.cornerExit === 'Subviraje') {
    const isAwd = drivetrain === 'AWD';
    const currentCenter = params.diff_center_balance?.value ?? 68;

    const causes: DiagnosisCause[] = [
      {
        component: isAwd ? 'Reparto central AWD con exceso de par delantero' : 'Diferencial trasero / muelles',
        parameterKey: isAwd ? 'diff_center_balance' : 'diff_rear_accel',
        probability: 85,
        rationale: isAwd
          ? 'El eje delantero tracciona con demasiado par al abrir gas, provocando que los neumáticos directrices patinen y abran la trayectoria.'
          : 'El diferencial delantero o diferencial abierto limita la rotación acelerada hacia la salida.',
      },
      {
        component: 'Diferencial delantero aceleración elevado',
        parameterKey: 'diff_front_accel',
        probability: 78,
        rationale: 'Ambas ruedas delanteras giran a la misma velocidad bajo carga impidiendo cerrar el radio de curva.',
      },
    ];

    let primaryIntervention: PrimaryIntervention;

    if (isAwd && params.diff_center_balance?.available) {
      const recommendedCenter = Math.min(80, currentCenter + 5);
      const delta = recommendedCenter - currentCenter;
      primaryIntervention = {
        parameterKey: 'diff_center_balance',
        parameterName: 'Reparto Central AWD (% Trasero)',
        currentValue: currentCenter,
        recommendedValue: recommendedCenter,
        unit: '%',
        delta,
        direction: 'AUMENTAR',
        reason: 'Enviar mayor proporción de potencia al eje trasero para inducir una leve rotación con el acelerador y liberar tracción en el eje directriz.',
        expectedEffect: 'El auto cierra la curva al pisar gas en lugar de empujar hacia afuera.',
        risk: 'Si el motor tiene alta potencia, puede provocar sobreviraje de potencia si se sube en exceso.',
        priority: 'Diferencial',
        retestInstruction: 'Acelerar a fondo en el vértice y verificar si la trayectoria se mantiene.',
        explanation: 'Aumentar el reparto de potencia hacia el eje posterior.',
        actionInstruction: `Aumentar Reparto Central a ${recommendedCenter}% trasero (+${delta}%).`,
        priorityCategory: 'Diferencial',
      };
    } else {
      const currentFrontArb = params.arb_front?.value ?? 25.0;
      const minArb = params.arb_front?.min ?? 1.0;
      const recommended = Math.max(minArb, Number((currentFrontArb - 2.5).toFixed(1)));
      const delta = Number((recommended - currentFrontArb).toFixed(1));
      primaryIntervention = {
        parameterKey: 'arb_front',
        parameterName: 'Barra Estabilizadora Delantera',
        currentValue: currentFrontArb,
        recommendedValue: recommended,
        unit: '1.0 - 65.0',
        delta,
        direction: 'DISMINUIR',
        reason: 'Reducir la barra delantera para incrementar el agarre mecánico del morro al traccionar.',
        expectedEffect: 'Mayor guiado direccional al acelerar en la salida.',
        risk: 'Leve aumento del balanceo del chasis.',
        priority: 'Balance',
        retestInstruction: 'Verificar la trayectoria en curva media de aceleración.',
        explanation: 'Suavizar barra delantera para ganar agarre direccional.',
        actionInstruction: `Reducir Barra Delantera a ${recommended}.`,
        priorityCategory: 'Balance',
      };
    }

    results.push({
      symptomAnalyzed: 'Subviraje en aceleración de salida (Power Understeer)',
      zone: 'SALIDA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Verificar en curvas de segunda y tercera marcha.',
    });
  }

  if (symptoms.cornerExit === 'Power oversteer' || symptoms.cornerExit === 'Sobreviraje') {
    const currentRearAccel = params.diff_rear_accel?.value ?? 65;
    const causes: DiagnosisCause[] = [
      {
        component: 'Diferencial trasero de aceleración agresivo',
        parameterKey: 'diff_rear_accel',
        probability: 92,
        rationale: 'El diferencial bloquea de forma rígida ambas ruedas traseras al acelerar, rompiendo la adherencia lateral en derrape imprevisto.',
      },
      {
        component: 'Barra estabilizadora trasera rígida',
        parameterKey: 'arb_rear',
        probability: 70,
        rationale: 'No permite que el neumático trasero exterior absorba la carga de aceleración sin deslizar.',
      },
      {
        component: 'Presión de neumático trasero elevada',
        parameterKey: 'tire_pressure_rear',
        probability: 52,
        rationale: 'Reduce la huella de tracción longitudinal y sobrecalienta el centro de la banda de rodadura.',
      },
    ];

    const recommendedRearAccel = Math.max(30, currentRearAccel - 10);
    const delta = recommendedRearAccel - currentRearAccel;

    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'diff_rear_accel',
      parameterName: 'Diferencial Trasero Aceleración',
      currentValue: currentRearAccel,
      recommendedValue: recommendedRearAccel,
      unit: '%',
      delta,
      direction: 'DISMINUIR',
      reason: 'Permitir que la rueda exterior trasera rote con mayor libertad al acelerar en apoyo, evitando derrapes súbitos.',
      expectedEffect: 'Tracción dócil y predecible al abrir gas en el ápice.',
      risk: 'Una reducción excesiva puede causar patinamiento en la rueda interior en curvas muy lentas.',
      priority: 'Diferencial',
      retestInstruction: 'Abrir gas progresivamente en salida y medir la estabilidad de la zaga.',
      explanation: 'Reducir el porcentaje de bloqueo trasero en aceleración.',
      actionInstruction: `Reducir Diferencial Trasero Aceleración de ${currentRearAccel}% a ${recommendedRearAccel}% (${delta}%).`,
      priorityCategory: 'Diferencial',
    };

    results.push({
      symptomAnalyzed: 'Sobreviraje por potencia en salida (Power Oversteer)',
      zone: 'SALIDA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Realizar 2 vueltas comprobando la tracción al salir de curvas lentas y medias.',
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
        rationale: 'Las pinzas delanteras saturan la adherencia del neumático impidiendo que mantenga capacidad de guiado durante la deceleración.',
      },
      {
        component: 'Presión de frenado elevada sin ABS',
        parameterKey: 'brake_pressure',
        probability: 65,
        rationale: 'Bloqueo temprano de ruedas delanteras que anula el control direccional.',
      },
    ];

    const recommendedBalance = Math.max(48.0, Number((currentBalance - 1.5).toFixed(1)));
    const delta = Number((recommendedBalance - currentBalance).toFixed(1));

    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'brake_balance',
      parameterName: 'Balance de Frenada',
      currentValue: currentBalance,
      recommendedValue: recommendedBalance,
      unit: '%',
      delta,
      direction: 'DISMINUIR',
      reason: 'Mover el balance ligeramente hacia atrás para reducir la sobrecarga en el eje directriz y conservar capacidad de giro.',
      expectedEffect: 'Capacidad de realizar trail-braking sin que el vehículo se niegue a girar.',
      risk: 'Si se traslada demasiado hacia atrás, la zaga puede desestabilizarse en frenadas a alta velocidad.',
      priority: 'Seguridad',
      retestInstruction: 'Efectuar 3 frenadas al final de la recta principal evaluando el comportamiento direccional.',
      explanation: 'Desplazar el reparto de frenada hacia el eje trasero.',
      actionInstruction: `Ajustar Balance de Frenada Delantero de ${currentBalance}% a ${recommendedBalance}%.`,
      priorityCategory: 'Seguridad',
    };

    results.push({
      symptomAnalyzed: 'Pérdida direccional en frenada fuerte',
      zone: 'FRENADA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Asegurar que la zaga no amague descolocarse en frenadas en línea recta.',
    });
  }

  if (symptoms.braking === 'Se mueve de atrás' || symptoms.braking === 'Inestable') {
    const currentBalance = params.brake_balance?.value ?? 50.0;
    const causes: DiagnosisCause[] = [
      {
        component: 'Balance de frenada con excesiva carga trasera',
        parameterKey: 'brake_balance',
        probability: 86,
        rationale: 'Los frenos traseros bloquean o saturan antes que los delanteros, provocando conato de trompo en frenada recta.',
      },
      {
        component: 'Extensión trasera (Rebound) blanda',
        parameterKey: 'rebound_rear',
        probability: 72,
        rationale: 'La carrocería cabecea hacia adelante con rapidez, descargando peso del eje trasero.',
      },
    ];

    const recommendedBalance = Math.min(56.0, Number((currentBalance + 2.0).toFixed(1)));
    const delta = Number((recommendedBalance - currentBalance).toFixed(1));

    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'brake_balance',
      parameterName: 'Balance de Frenada',
      currentValue: currentBalance,
      recommendedValue: recommendedBalance,
      unit: '%',
      delta,
      direction: 'AUMENTAR',
      reason: 'Aumentar la carga de frenada en el eje delantero para garantizar que las ruedas delanteras frenen antes que las traseras.',
      expectedEffect: 'Frenada en línea recta completamente estable y predecible.',
      risk: 'Un sesgo excesivo hacia el frente puede dificultar el giro frenando.',
      priority: 'Seguridad',
      retestInstruction: 'Frenar fuertemente en recta desde 200 km/h y verificar que la zaga se mantenga alineada.',
      explanation: 'Aumentar el reparto delantero de frenos.',
      actionInstruction: `Subir Balance de Frenada Delantero a ${recommendedBalance}%.`,
      priorityCategory: 'Seguridad',
    };

    results.push({
      symptomAnalyzed: 'Inestabilidad de la zaga en frenada fuerte',
      zone: 'FRENADA',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Verificar la estabilidad antes de tocar amortiguación trasera.',
    });
  }

  // 5. Diagnóstico de Suspensión
  if (symptoms.suspension === 'Rebota') {
    const currentRebound = params.rebound_front?.value ?? 10.5;
    const causes: DiagnosisCause[] = [
      {
        component: 'Amortiguadores: Extensión (Rebound) rígida',
        parameterKey: 'rebound_front',
        probability: 85,
        rationale: 'La suspensión no permite que el muelle se expanda a tiempo, acumulando compresión y provocando que el neumático despegue del asfalto.',
      },
      {
        component: 'Muelles delanteros con rigidez excesiva',
        parameterKey: 'springs_front',
        probability: 74,
        rationale: 'Frecuencia de oscilación muy rígida para las irregularidades de la pista.',
      },
      {
        component: 'Compresión (Bump) alta',
        parameterKey: 'bump_front',
        probability: 60,
        rationale: 'El amortiguador transmite el impacto inicial del bache directamente al chasis.',
      },
    ];

    const recommendedRebound = Math.max(2.0, Number((currentRebound - 1.2).toFixed(1)));
    const delta = Number((recommendedRebound - currentRebound).toFixed(1));

    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'rebound_front',
      parameterName: 'Extensión Delantera (Rebound)',
      currentValue: currentRebound,
      recommendedValue: recommendedRebound,
      unit: '1.0 - 20.0',
      delta,
      direction: 'DISMINUIR',
      reason: 'Suavizar la extensión para que la rueda recupere contacto continuo con la superficie tras superar ondulaciones.',
      expectedEffect: 'Chasis más asentado sobre pianos y asfalto roto.',
      risk: 'Una reducción desmedida puede provocar oscilaciones continuas del morro.',
      priority: 'Suspensión',
      retestInstruction: 'Rodar sobre una sección de asfalto irregular o bordillo interior.',
      explanation: 'Suavizar amortiguación de extensión delantera.',
      actionInstruction: `Reducir Extensión Delantera de ${currentRebound} a ${recommendedRebound} (${delta} puntos).`,
      priorityCategory: 'Suspensión',
    };

    results.push({
      symptomAnalyzed: 'El vehículo rebota en superficie irregular',
      zone: 'SUSPENSIÓN',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Comprobar absorción sin comprometer el control de cabeceo.',
    });
  }

  if (symptoms.suspension === 'Toca fondo') {
    const currentHeight = params.ride_height_front?.value ?? 8.0;
    const causes: DiagnosisCause[] = [
      {
        component: 'Altura de carrocería baja',
        parameterKey: 'ride_height_front',
        probability: 90,
        rationale: 'El recorrido libre de suspensión se agota ante compresiones fuertes, golpeando topes mecánicos o rozando el suelo.',
      },
      {
        component: 'Muelles con rigidez insuficiente',
        parameterKey: 'springs_front',
        probability: 72,
        rationale: 'Los muelles no sostienen la carga cinética en compresiones profundas.',
      },
    ];

    const recommendedHeight = Number((currentHeight + 0.8).toFixed(1));
    const delta = Number((recommendedHeight - currentHeight).toFixed(1));

    const primaryIntervention: PrimaryIntervention = {
      parameterKey: 'ride_height_front',
      parameterName: 'Altura Delantera',
      currentValue: currentHeight,
      recommendedValue: recommendedHeight,
      unit: 'cm',
      delta,
      direction: 'AUMENTAR',
      reason: 'Elevar ligeramente la altura para restablecer recorrido de compresión útil y prevenir impacto contra el suelo.',
      expectedEffect: 'Eliminación del golpe de chasis en compresiones fuertes.',
      risk: 'Elevar la altura incrementa ligeramente la altura del centro de gravedad.',
      priority: 'Suspensión',
      retestInstruction: 'Pasar por la zona de compresión máxima donde ocurría el fondo.',
      explanation: 'Subir altura de suspensión delantera.',
      actionInstruction: `Subir Altura Delantera a ${recommendedHeight} cm (+${delta} cm).`,
      priorityCategory: 'Suspensión',
    };

    results.push({
      symptomAnalyzed: 'El auto hace tope contra el suelo (Bottom Out)',
      zone: 'SUSPENSIÓN',
      possibleCauses: causes,
      primaryIntervention,
      nextStepWarning: 'Coordinar con la altura trasera si el rake se ve alterado.',
    });
  }

  // 6. Si no hay síntomas reportados o el comportamiento es estable
  if (results.length === 0) {
    results.push({
      symptomAnalyzed: 'Comportamiento en equilibrio / Sin discrepancias críticas',
      zone: 'GLOBAL',
      possibleCauses: [
        {
          component: 'Chasis en equilibrio',
          parameterKey: 'arb_front',
          probability: 98,
          rationale: 'Los parámetros actuales operan dentro de los márgenes previstos para la disciplina seleccionada.',
        },
      ],
      primaryIntervention: {
        parameterKey: 'none',
        parameterName: 'Mantener Reglaje Actual',
        currentValue: 0,
        recommendedValue: 0,
        unit: '',
        delta: 0,
        direction: 'MANTENER',
        reason: 'No se observan anomalías cinemáticas que justifiquen alterar el equilibrio alcanzado.',
        expectedEffect: 'Continuidad de sensaciones y consistencia en tiempos de vuelta.',
        risk: 'Modificar parámetros sin un síntoma claro descalibra el balance base.',
        priority: 'Balance',
        retestInstruction: 'Completar tandas de 3 a 5 vueltas para evaluar consistencia y degradación.',
        explanation: 'Continuar rodando para acumular referencias cronometradas.',
        actionInstruction: 'Mantener parámetros actuales.',
        priorityCategory: 'Balance',
      },
      nextStepWarning: 'Registrar nuevos síntomas cuando se presenten en situaciones específicas de pista.',
    });
  }

  return results;
}
