/**
 * APEX TUNING ENGINE — FH5
 * MATRIZ DE INGENIERÍA MOTORSPORT (Master Knowledge Base V1.1)
 * Base de reglas estructurada evaluable por código para Forza Horizon 5
 *
 * Principios:
 * - Lenguaje de ingeniería limpio: sin afirmaciones absolutas ("siempre", "obligatorio", "regla de oro").
 * - Estructura de reglas `EngineeringRule` condicionada y evaluable por código.
 * - Soporte para las 12 áreas principales de reglaje con BASELINE, RANGO, EFECTO, SÍNTOMAS, DEPENDENCIAS.
 */

import {
  MatrixItem,
  Discipline,
  DisciplineProfile,
  EngineeringRule,
  EngineeringRuleConditions,
} from '../types';

export const DISCIPLINE_PROFILES: Record<Discipline, DisciplineProfile> = {
  'ROAD RACING': {
    name: 'Road Racing (Circuito Asfalto)',
    objective: 'Maximizar agarre mecánico y aerodinámico en asfalto, garantizando estabilidad en frenadas y rotación neutra en vértices.',
    priorities: [
      '1. Grip mecánico y parche de contacto en temperatura óptima',
      '2. Balance lateral y neutralidad de trayectoria',
      '3. Estabilidad en frenada a alta velocidad',
      '4. Rotación ágil en el vértice de curva',
      '5. Tracción progresiva en salida',
      '6. Eficiencia aerodinámica de arrastre',
    ],
    priorityParameters: ['camber_front', 'arb_front', 'arb_rear', 'springs_front', 'aero_rear', 'diff_center_balance'],
    preferredBehavior: 'Dirección precisa y lineal, apoyo plano sin balanceo excesivo de carrocería y tracción sin sobresaltos.',
    characteristics: 'Suspensiones firmes, altura baja, caída negativa moderada-alta, extensión controlada.',
    parameterModifiers: {
      arb_rear: { delta: 3.0, rationale: 'Favorecer rotación en curva cerrada' },
      brake_balance: { delta: 2.0, rationale: 'Priorizar desaceleración en línea recta' },
    },
  },
  'STREET SCENE': {
    name: 'Street Scene (Calles y Tráfico)',
    objective: 'Agilidad reactiva y tolerancia a imperfecciones del asfalto urbano, juntas de dilatación y cambios de pendiente imprevistos.',
    priorities: [
      '1. Absorción de imperfecciones y baches urbanos',
      '2. Reactividad de dirección y transiciones rápidas de apoyo',
      '3. Tracción en superficies de adherencia variable',
      '4. Recuperación rápida tras compresión fuerte',
      '5. Estabilidad en frenadas mixtas',
      '6. Rotación progresiva',
    ],
    priorityParameters: ['bump_front', 'bump_rear', 'ride_height_front', 'arb_rear', 'tire_pressure_rear'],
    preferredBehavior: 'Carrocería dócil que absorbe ondulaciones sin despegar neumáticos del pavimento y dirección ágil.',
    characteristics: 'Muelles 10-15% más tolerantes que circuito, compresión ligeramente más suave, altura libre 1.5 cm superior.',
    parameterModifiers: {
      ride_height_front: { delta: 1.5, rationale: 'Prevenir impactos de bajos en desniveles' },
      bump_front: { multiplier: 0.9, rationale: 'Mejorar absorción de baches rápidos' },
    },
  },
  'DIRT': {
    name: 'Dirt Racing (Tierra y Grava)',
    objective: 'Optimizar tracción y flotación sobre superficies de baja adherencia, permitiendo deslizamiento controlado para encarar giros.',
    priorities: [
      '1. Tracción longitudinal en tierra y grava',
      '2. Recorrido útil de suspensión sin hacer tope',
      '3. Amortiguación de rebote en ondulaciones continuas',
      '4. Rotación inducida mediante transferencia de masas',
      '5. Caster y convergencia adecuados para auto-centrado',
      '6. Diferenciales con bloqueo moderado-alto para arrastre simultáneo',
    ],
    priorityParameters: ['ride_height_front', 'springs_front', 'bump_front', 'diff_front_accel', 'diff_rear_accel'],
    preferredBehavior: 'Vehículo ágil que permite iniciar derrapes de entrada controlados y salir traccionando con ambos ejes.',
    characteristics: 'Presiones 23-26 psi, muelles un 30% más suaves, altura generosa, diferenciales con mayor porcentaje de aceleración.',
    parameterModifiers: {
      diff_rear_accel: { delta: 15.0, rationale: 'Asegurar empuje simultáneo en suelo suelto' },
      ride_height_front: { delta: 7.0, rationale: 'Recorrido libre para rocas y ondulaciones' },
    },
  },
  'CROSS COUNTRY': {
    name: 'Cross Country (Todo Terreno Extremo)',
    objective: 'Absorción masiva de energía cinética en caídas de saltos, tracción continua en lodo o arena y estabilidad direccional.',
    priorities: [
      '1. Recorrido de suspensión libre y amortiguación anti-tope',
      '2. Absorción masiva de energía cinética en aterrizajes',
      '3. Tracción total AWD equilibrada en fango y arena',
      '4. Estabilidad direccional al superar obstáculos naturales',
      '5. Control de aterrizaje sin oscilación descontrolada',
      '6. Dirección predecible y retorno firme',
    ],
    priorityParameters: ['ride_height_front', 'ride_height_rear', 'rebound_front', 'bump_front', 'springs_front'],
    preferredBehavior: 'El chasis disipa el impacto de saltos severos sin rebotar ni desviar la trayectoria; la suspensión utiliza el recorrido útil.',
    characteristics: 'Altura libre generosa, muelles suaves con amplio recorrido, compresión firme para evitar fondo, rebote adaptado a caídas.',
    parameterModifiers: {
      ride_height_front: { delta: 12.0, rationale: 'Librar peñascos y absorción de caídas' },
      bump_front: { multiplier: 1.15, rationale: 'Disipar impacto de compresión vertical' },
    },
  },
  'DRAG': {
    name: 'Drag (Aceleración Recta)',
    objective: 'Transferencia instantánea de masa al eje motriz, eliminación de patinamiento parásito inicial y relaciones de cambio cerradas.',
    priorities: [
      '1. Tracción longitudinal pura en arrancada',
      '2. Transferencia de masa al eje de tracción principal',
      '3. Diferencial completamente bloqueado para aceleración simétrica',
      '4. Mínima resistencia aerodinámica de avance (downforce neutro)',
      '5. Presiones traseras reducidas para maximizar huella',
      '6. Marchas escalonadas en el punto de potencia máxima',
    ],
    priorityParameters: ['diff_rear_accel', 'tire_pressure_rear', 'springs_rear', 'rebound_front', 'aero_rear'],
    preferredBehavior: 'Lanzamiento contundente sin desviación de trayectoria ni patinamiento innecesario.',
    characteristics: 'Diferencial de aceleración al 100%, presiones traseras bajas (15-20 psi), muelles traseros firmes con suspensión delantera blanda en extensión.',
    parameterModifiers: {
      diff_rear_accel: { delta: 35.0, rationale: 'Bloqueo simétrico bajo máxima aceleración' },
      tire_pressure_rear: { delta: -10.0, rationale: 'Maximizar superficie de tracción' },
    },
  },
  'DRIFT': {
    name: 'Drift (Deslizamiento Controlado)',
    objective: 'Facilidad para descolocar el tren trasero a voluntad, mantener ángulos de derrape sostenidos y modular transiciones con el acelerador.',
    priorities: [
      '1. Desencadenamiento rápido y progresivo de sobreviraje',
      '2. Ángulo de ataque y auto-alineación rápida de dirección',
      '3. Velocidad de avance continuo durante el derrape',
      '4. Transición fluida de inercias entre giros enlazados',
      '5. Bloqueo predecible de ruedas traseras',
      '6. Agarre direccional delantero constante en contravolante',
    ],
    priorityParameters: ['caster', 'camber_front', 'diff_rear_accel', 'diff_rear_decel', 'tire_pressure_rear'],
    preferredBehavior: 'La zaga rompe adherencia con suavidad; la dirección asiste el contravolante gracias al avance alto y camber agresivo.',
    characteristics: 'Caster a 7.0°, camber delantero entre -3.5° y -4.8°, presiones traseras altas (35-42 psi), diferencial trasero con bloqueo cercano al 100%.',
    parameterModifiers: {
      caster: { delta: 0.8, rationale: 'Facilitar auto-centrado en transiciones' },
      camber_front: { delta: -2.2, rationale: 'Mantener neumático directriz plano en contravolante' },
    },
  },
  'CUSTOM': {
    name: 'Reglaje Personalizado',
    objective: 'Equilibrio específico configurado a medida según los requerimientos observados por el piloto.',
    priorities: [
      '1. Balance dinámico adaptativo',
      '2. Respuesta a demandas del piloto',
      '3. Eficiencia en curva',
      '4. Estabilidad en frenada',
      '5. Tracción progresiva',
      '6. Sensibilidad a hardware',
    ],
    priorityParameters: ['arb_front', 'arb_rear', 'springs_front', 'diff_rear_accel'],
    preferredBehavior: 'Comportamiento ajustado a los parámetros del perfil del piloto y hardware empleado.',
    characteristics: 'Configuración calibrada según preferencias.',
  },
};

/**
 * REGLAS ESTRUCTURADAS DE INGENIERÍA
 * Reglas evaluables por código con condiciones formales.
 */
export const ENGINEERING_RULES: EngineeringRule[] = [
  {
    id: 'RULE_ARB_AWD_UNDERSTEER',
    parameterKey: 'arb_rear',
    conditions: {
      drivetrain: ['AWD'],
      discipline: ['ROAD RACING', 'STREET SCENE'],
    },
    priority: 1,
    direction: 'AUMENTAR',
    magnitude: 3.5,
    rationale: 'En tracción integral, incrementar la rigidez de la barra estabilizadora trasera respecto a la delantera induce rotación mecánica en el vértice compensando el empuje frontal.',
    sideEffects: 'Un incremento desproporcionado puede generar inestabilidad de la zaga al pasar pianos altos.',
    relatedSymptoms: ['Subviraje en mitad de curva', 'Falta de rotación en vértice'],
  },
  {
    id: 'RULE_ARB_FWD_ROTATION',
    parameterKey: 'arb_rear',
    conditions: {
      drivetrain: ['FWD'],
    },
    priority: 1,
    direction: 'AUMENTAR',
    magnitude: 6.0,
    rationale: 'En tracción delantera, endurecer la barra trasera ayuda a que el eje posterior participe en la rotación liberando de sobrecarga al eje motriz directriz.',
    sideEffects: 'La zaga se vuelve más sensible si se corta gas de golpe en apoyos rápidos.',
    relatedSymptoms: ['Subviraje general', 'Dirección pesada en apoyo'],
  },
  {
    id: 'RULE_BUMP_RATIO',
    parameterKey: 'bump_front',
    conditions: {
      discipline: ['ROAD RACING', 'STREET SCENE', 'DIRT'],
    },
    priority: 2,
    direction: 'PROPORCIONAL',
    magnitude: 0.60,
    rationale: 'Se recomienda situar la amortiguación de compresión (Bump) entre el 50% y el 65% del valor de extensión (Rebound) para un equilibrio idóneo entre absorción y sostén.',
    sideEffects: 'Compresiones por encima del 75% provocan rebote lateral al pisar bordillos de circuito.',
    relatedSymptoms: ['Inestabilidad al pisar bordillos', 'Pérdida de tracción en baches'],
  },
  {
    id: 'RULE_BRAKE_BIAS_FRONT',
    parameterKey: 'brake_balance',
    conditions: {
      drivetrain: ['RWD', 'AWD'],
      discipline: ['ROAD RACING', 'STREET SCENE'],
    },
    priority: 2,
    direction: 'FIJO',
    magnitude: 52.0,
    rationale: 'Un reparto de frenada entre 51% y 53% delantero asegura que las ruedas delanteras asuman la mayor deceleración sin desestabilizar la zaga.',
    sideEffects: 'Valores superiores a 54% reducen la capacidad de rotación al aplicar trail-braking.',
    relatedSymptoms: ['Trompo en frenada recta', 'Inestabilidad al desacelerar a alta velocidad'],
  },
  {
    id: 'RULE_DIFF_CENTER_AWD_BIAS',
    parameterKey: 'diff_center_balance',
    conditions: {
      drivetrain: ['AWD'],
      discipline: ['ROAD RACING', 'STREET SCENE'],
    },
    priority: 3,
    direction: 'FIJO',
    magnitude: 68.0,
    rationale: 'Dirigir entre 65% y 72% del par al eje posterior combina la agilidad de comportamiento de propulsión con la tracción de salida de la tracción total.',
    sideEffects: 'Con motores superiores a 700 CV, un reparto trasero elevado requiere control progresivo del gas.',
    relatedSymptoms: ['Auto subvira por empuje AWD', 'Poco ángulo de giro al acelerar'],
  },
  {
    id: 'RULE_TIRE_PRESSURE_ASPHALT',
    parameterKey: 'tire_pressure_front',
    conditions: {
      discipline: ['ROAD RACING', 'STREET SCENE'],
    },
    priority: 3,
    direction: 'FIJO',
    magnitude: 28.5,
    rationale: 'Presiones en el rango 28.0 - 29.5 psi en caliente ofrecen el área óptima de huella y estabilidad del flanco.',
    sideEffects: 'Presiones inferiores a 26.0 psi generan imprecisión y flaneo de dirección.',
    relatedSymptoms: ['Sobrecalentamiento de neumáticos', 'Respuesta de dirección imprecisa'],
  },
  {
    id: 'RULE_CROSS_COUNTRY_HEIGHT',
    parameterKey: 'ride_height_front',
    conditions: {
      discipline: ['CROSS COUNTRY'],
    },
    priority: 1,
    direction: 'AUMENTAR',
    magnitude: 24.0,
    rationale: 'En Cross Country es prioritario contar con el máximo recorrido libre de suspensión para disipar caídas de saltos y evitar colisiones de chasis.',
    sideEffects: 'Eleva el centro de gravedad por lo que se debe compensar con muelles progresivos.',
    relatedSymptoms: ['El auto toca fondo (Bottom out)', 'Chasis roza con el terreno'],
  },
  {
    id: 'RULE_DRIFT_CASTER_CAMBER',
    parameterKey: 'caster',
    conditions: {
      discipline: ['DRIFT'],
    },
    priority: 1,
    direction: 'FIJO',
    magnitude: 7.0,
    rationale: 'Un ángulo de avance (caster) cercano a 7.0° proporciona la fuerza centrífuga necesaria para el auto-retorno rápido de la dirección en transiciones de derrape.',
    sideEffects: 'Aumenta el esfuerzo requerido para sostener giros lentos.',
    relatedSymptoms: ['Falta de auto-retorno al contravolantear', 'Dirección lenta en transiciones'],
  },
];

/**
 * 12 ÁREAS PRINCIPALES DE TUNING EN FH5
 * Cada elemento con BASELINE, RANGO, EFECTO, SÍNTOMAS y DEPENDENCIAS.
 */
export const MASTER_MATRIX: MatrixItem[] = [
  {
    id: 'TIRE_PRESSURE',
    name: 'Presión de Neumáticos',
    category: 'TIRES',
    unit: 'psi',
    min: 15.0,
    max: 55.0,
    step: 0.5,
    priority: 2,
    target: 'Maximizar el parche de contacto en temperatura óptima de trabajo y regular la rigidez del flanco.',
    effectIncrease: 'Menor deformación lateral del neumático, respuesta más inmediata al volante pero menor huella de contacto y calentamiento más lento.',
    effectDecrease: 'Mayor huella de contacto longitudinal y lateral, absorbe mejor irregularidades pero el neumático se calienta más rápido.',
    dependencies: ['tireCompound', 'weightKg', 'frontWeightRatio'],
    drivetrainModifiers: {
      FWD: 'Delanteros con 1.0 - 2.0 psi menos que traseros para favorecer tracción y frenada.',
      RWD: 'Traseros ajustados ligeramente más bajos (27.5 - 28.5 psi) para tracción longitudinal en aceleración.',
      AWD: 'Presiones balanceadas (delante 28.5 psi, detrás 28.0 psi) para distribución uniforme de temperatura.',
    },
    disciplineModifiers: {
      'ROAD RACING': '28.0 - 29.5 psi. Precisión óptima en asfalto liso.',
      'STREET SCENE': '27.0 - 28.5 psi para mitigar impactos en desniveles urbanos.',
      'DIRT': '24.0 - 26.0 psi para permitir que el neumático trabaje sobre superficie suelta.',
      'CROSS COUNTRY': '21.0 - 23.5 psi para amortiguación de caídas y tracción en fango.',
      'DRAG': 'Delanteros a 45-50 psi (mínima fricción), traseros a 15-20 psi (máxima huella).',
      'DRIFT': 'Delanteros a 28-30 psi (máximo grip direccional), traseros a 35-42 psi (facilitar rotación).',
      'CUSTOM': 'Punto inicial a 28.5 psi en ambos ejes.',
    },
    symptoms: ['Pérdida de grip en curva sostenida', 'Sobrecalentamiento irregular de gomas', 'Dirección imprecisa'],
  },
  {
    id: 'CAMBER',
    name: 'Camber (Caída)',
    category: 'ALIGNMENT',
    unit: '°',
    min: -5.0,
    max: 0.0,
    step: 0.1,
    priority: 2,
    target: 'Garantizar que la banda de rodadura trabaje plana contra el piso cuando el chasis apoya con fuerza centrífuga en curva.',
    effectIncrease: 'Mayor agarre lateral en apoyos fuertes a expensas de la frenada recta y tracción longitudinal.',
    effectDecrease: 'Mejor frenada en línea recta y tracción de salida, pero menor capacidad de apoyo en curvas rápidas.',
    dependencies: ['suspensionAdjustable', 'frontWeightRatio', 'springs_front'],
    drivetrainModifiers: {
      FWD: 'Caída delantera moderada-alta (-1.8° a -2.4°) para compensar deformación bajo par motriz y frenada.',
      RWD: 'Caída trasera moderada (-1.0° a -1.4°) para conservar tracción al acelerar con ruedas rectas.',
      AWD: 'Balance simétrico con ligero sesgo delantero (-1.8° del / -1.2° tras).',
    },
    disciplineModifiers: {
      'ROAD RACING': 'Delantero -1.8° a -2.2°, Trasero -1.2° a -1.5°.',
      'STREET SCENE': 'Delantero -1.6° a -1.9°, Trasero -1.0° a -1.3°.',
      'DIRT': 'Delantero -0.8° a -1.2°, Trasero -0.5° a -0.8°.',
      'CROSS COUNTRY': 'Delantero -0.4° a -0.6°, Trasero -0.3° a -0.5°.',
      'DRAG': '0.0° en ambos ejes para que toda la banda apoye plano en aceleración recta.',
      'DRIFT': 'Delantero entre -3.5° y -4.8° para mantener agarre en contravolante; trasero -0.5° a -1.0°.',
      'CUSTOM': 'Configuración de carretera según masa.',
    },
    symptoms: ['Subviraje a mitad de curva', 'Desgaste térmico irregular en telemetría', 'Inestabilidad en apoyo prolongado'],
  },
  {
    id: 'TOE',
    name: 'Toe (Convergencia / Divergencia)',
    category: 'ALIGNMENT',
    unit: '°',
    min: -5.0,
    max: 5.0,
    step: 0.1,
    priority: 8,
    target: 'Afinar la rapidez de inserción en curva (Turn-in) y la estabilidad direccional en recta a alta velocidad.',
    effectIncrease: 'Convergencia positiva estabiliza la recta pero ralentiza la dirección; divergencia (Toe Out) agiliza la inserción.',
    effectDecrease: 'Divergencia excesiva puede generar nerviosismo en línea recta.',
    dependencies: ['suspensionAdjustable'],
    drivetrainModifiers: {
      FWD: 'Ligera divergencia delantera (-0.1° Out) para inducir giro inicial ágil.',
      RWD: 'Ligera convergencia trasera (-0.1° In) para asentar la zaga en aceleraciones.',
      AWD: '0.0° neutro o -0.1° para minimizar arrastre parásito.',
    },
    disciplineModifiers: {
      'ROAD RACING': 'Delantero 0.0° a -0.1° Out, Trasero 0.0° a -0.1° In.',
      'STREET SCENE': '0.0° neutro en ambos ejes.',
      'DIRT': 'Delantero -0.1° Out para inserción rápida.',
      'CROSS COUNTRY': '0.0° neutro para estabilidad en baches.',
      'DRAG': '0.0° absoluto para cero fricción lateral.',
      'DRIFT': 'Delantero -0.2° a -0.4° Out y Trasero 0.0° a -0.1° In.',
      'CUSTOM': 'Neutro 0.0°.',
    },
    symptoms: ['Auto nervioso en recta a más de 200 km/h', 'Dirección perezosa al comenzar el giro'],
  },
  {
    id: 'CASTER',
    name: 'Caster (Ángulo de Avance)',
    category: 'ALIGNMENT',
    unit: '°',
    min: 1.0,
    max: 7.0,
    step: 0.1,
    priority: 8,
    target: 'Generar caída dinámica al girar las ruedas y proveer la fuerza de auto-centrado del volante.',
    effectIncrease: 'Mayor adherencia al girar el volante cerrado, estabilidad en alta velocidad y retorno firme de dirección.',
    effectDecrease: 'Dirección más suave a baja velocidad pero menor estabilidad lineal.',
    dependencies: ['suspensionAdjustable'],
    drivetrainModifiers: {
      FWD: '5.5° - 6.0° para tracción direccional sin sobrecargar la dirección.',
      RWD: '5.8° - 6.5° para agilidad y estabilidad.',
      AWD: '5.8° - 6.4° para absorción en aceleración.',
    },
    disciplineModifiers: {
      'ROAD RACING': '6.0° - 6.5°.',
      'STREET SCENE': '5.8° - 6.2°.',
      'DIRT': '5.2° - 5.8°.',
      'CROSS COUNTRY': '5.0° - 5.5°.',
      'DRAG': '7.0° para estabilidad en recta.',
      'DRIFT': '7.0° para facilitar el auto-retorno rápido del volante.',
      'CUSTOM': '6.0°.',
    },
    symptoms: ['Falta de auto-centrado del volante', 'Sensación de flotabilidad en recta'],
  },
  {
    id: 'ARB',
    name: 'Barras Estabilizadoras (Anti-Roll Bars)',
    category: 'ARB',
    unit: '1.0 - 65.0',
    min: 1.0,
    max: 65.0,
    step: 0.1,
    priority: 3,
    target: 'Controlar el reparto de transferencia de carga lateral entre ejes delantero y trasero en curva sostenida.',
    effectIncrease: 'Mayor rigidez en un eje disminuye el agarre relativo de ese extremo, reduciendo el balanceo pero alterando el balance.',
    effectDecrease: 'Menor rigidez permite mayor transferencia de carga hacia la rueda exterior, incrementando el agarre de ese eje.',
    dependencies: ['frontArbAdjustable', 'rearArbAdjustable', 'frontWeightRatio'],
    drivetrainModifiers: {
      FWD: 'Barra delantera blanda (15.0 - 25.0) y trasera firme (35.0 - 45.0) para obligar a rotar al eje posterior.',
      RWD: 'Barra delantera equilibrada (22.0 - 32.0) y trasera afinada para evitar sobreviraje súbito en salida.',
      AWD: 'En tracción integral se recomienda iniciar con la barra trasera más rígida para mitigar el subviraje endémico.',
    },
    disciplineModifiers: {
      'ROAD RACING': 'Delantera 18.0 - 28.0, Trasera 24.0 - 38.0.',
      'STREET SCENE': 'Delantera 16.0 - 24.0, Trasera 22.0 - 34.0.',
      'DIRT': 'Delantera 10.0 - 18.0, Trasera 14.0 - 24.0.',
      'CROSS COUNTRY': 'Delantera 2.0 - 8.0, Trasera 2.0 - 10.0 (barras suaves para articulación independiente).',
      'DRAG': 'Delantera 1.0, Trasera 65.0 (minimizar torsión del chasis en arrancada).',
      'DRIFT': 'Delantera 32.0 - 42.0, Trasera 18.0 - 26.0.',
      'CUSTOM': 'Punto inicial equilibrado según masa.',
    },
    symptoms: ['Subviraje a mitad de curva', 'Sobreviraje en apoyo prolongado', 'Balanceo lateral excesivo'],
  },
  {
    id: 'SPRING',
    name: 'Muelles (Rigidez de Suspensión)',
    category: 'SPRINGS',
    unit: 'kgf/mm',
    min: 10.0,
    max: 300.0,
    step: 0.5,
    priority: 4,
    target: 'Sostener la masa del vehículo y regular la frecuencia natural de cabeceo y balanceo.',
    effectIncrease: 'Respuesta más directa en cambios de apoyo y menor cabeceo, pero menor absorción en asfalto roto.',
    effectDecrease: 'Mayor grip mecánico en superficies rugosas pero mayor cabeceo y riesgo de hacer tope.',
    dependencies: ['suspensionAdjustable', 'weightKg', 'frontWeightRatio'],
    drivetrainModifiers: {
      FWD: 'Rigidez proporcional al reparto de masa delantero.',
      RWD: 'Muelles traseros calculados para sostener la transferencia en aceleración sin perder geometría.',
      AWD: 'Distribución equilibrada según reparto estático de peso.',
    },
    disciplineModifiers: {
      'ROAD RACING': 'Frecuencia firme ajustada a la masa del chasis.',
      'STREET SCENE': '10% a 15% más tolerantes que circuito.',
      'DIRT': '25% a 35% más suaves para contacto continuo en grava.',
      'CROSS COUNTRY': 'Muelles suaves con amplio recorrido útil para amortiguar saltos.',
      'DRAG': 'Delanteros suaves (facilitan transferir masa), traseros firmes.',
      'DRIFT': 'Moderadamente rígidos para reacciones directas.',
      'CUSTOM': 'Calculado según peso y reparto.',
    },
    symptoms: ['El auto toca fondo (Bottom out)', 'Rebote descontrolado en curvas rápidas', 'Cabeceo excesivo en frenada'],
  },
  {
    id: 'RIDE_HEIGHT',
    name: 'Altura de Carrocería',
    category: 'SPRINGS',
    unit: 'cm',
    min: 5.0,
    max: 35.0,
    step: 0.1,
    priority: 4,
    target: 'Situar el centro de gravedad en cota baja garantizando recorrido libre sin rozar los bajos.',
    effectIncrease: 'Mayor recorrido de suspensión para sortear desniveles sin golpear el suelo.',
    effectDecrease: 'Menor transferencia de inercias y mejor efecto aerodinámico, pero riesgo de rozar.',
    dependencies: ['suspensionAdjustable'],
    drivetrainModifiers: {
      FWD: 'Altura nivelada o ligero sesgo delantero (-0.5 cm).',
      RWD: 'Altura equilibrada para no desalinear semiejes traseros.',
      AWD: 'Altura similar en ambos ejes con +0.3 a +0.5 cm atrás para compensar aceleración.',
    },
    disciplineModifiers: {
      'ROAD RACING': 'Cerca del mínimo funcional (8.0 - 11.0 cm) que no golpee bordillos.',
      'STREET SCENE': '9.0 - 13.0 cm.',
      'DIRT': '14.0 - 19.0 cm.',
      'CROSS COUNTRY': 'Cercana al máximo (22.0 - 30.0 cm) para salvar irregularidades.',
      'DRAG': 'Delantera intermedia, trasera lo más baja posible.',
      'DRIFT': 'Baja (8.0 - 11.0 cm).',
      'CUSTOM': 'Cota intermedia estándar.',
    },
    symptoms: ['Chasis roza con el asfalto', 'Pérdida de control al pasar sobre badenes'],
  },
  {
    id: 'REBOUND',
    name: 'Extensión de Amortiguadores (Rebound)',
    category: 'DAMPING',
    unit: '1.0 - 20.0',
    min: 1.0,
    max: 20.0,
    step: 0.1,
    priority: 4,
    target: 'Disipar la velocidad con la que el muelle se expande tras una compresión, frenando oscilaciones del chasis.',
    effectIncrease: 'El vehículo asienta con firmeza tras ondulaciones, pero si es excesivo la suspensión se empaqueta abajo.',
    effectDecrease: 'La rueda recupera contacto rápido con la superficie, pero si es muy bajo el auto puede rebotar.',
    dependencies: ['suspensionAdjustable', 'springs_front', 'springs_rear'],
    drivetrainModifiers: {
      FWD: 'Extensión delantera firme (10.0 - 12.5) para asentar el eje tractor.',
      RWD: 'Extensión trasera equilibrada (9.5 - 12.0).',
      AWD: 'Distribución balanceada con sesgo al eje de mayor peso.',
    },
    disciplineModifiers: {
      'ROAD RACING': '9.5 - 13.0.',
      'STREET SCENE': '8.5 - 11.5.',
      'DIRT': '6.5 - 9.0 para extensión rápida en baches continuos.',
      'CROSS COUNTRY': '5.5 - 8.0 para disipar energía en caídas.',
      'DRAG': 'Delantero suave (1.0 - 3.0), trasero firme (16.0 - 19.0).',
      'DRIFT': '9.0 - 12.0.',
      'CUSTOM': '10.0 base.',
    },
    symptoms: ['El vehículo rebota repetidamente tras un bache', 'Pérdida de agarre en crestas de asfalto'],
  },
  {
    id: 'BUMP',
    name: 'Compresión de Amortiguadores (Bump)',
    category: 'DAMPING',
    unit: '1.0 - 20.0',
    min: 1.0,
    max: 20.0,
    step: 0.1,
    priority: 4,
    target: 'Disipar la velocidad de compresión de la suspensión ante impactos o transferencias dinámicas.',
    effectIncrease: 'Soporta mejor la carga inicial en frenada o entrada a curva, pero puede rebotar sobre pianos duros.',
    effectDecrease: 'Absorbe pianos y ondulaciones con suavidad pero puede cabecear con rapidez en transiciones.',
    dependencies: ['suspensionAdjustable', 'rebound_front', 'rebound_rear'],
    drivetrainModifiers: {
      FWD: 'Relación recomendada: Compresión (Bump) entre 50% y 70% del valor de Extensión (Rebound).',
      RWD: 'Bump delantero firme y trasero permisivo para absorber sentada en aceleración.',
      AWD: '55% - 65% del Rebound en ambos ejes.',
    },
    disciplineModifiers: {
      'ROAD RACING': '5.5 - 8.0 (55% a 65% de Rebound).',
      'STREET SCENE': '4.8 - 6.8.',
      'DIRT': '3.8 - 5.5.',
      'CROSS COUNTRY': '4.5 - 7.0 para frenar topes en caídas.',
      'DRAG': 'Delantero firme (16.0 - 19.0), trasero suave (1.0 - 3.0).',
      'DRIFT': '5.0 - 7.5.',
      'CUSTOM': '60% del valor de Rebound.',
    },
    symptoms: ['El auto salta hacia los lados al pisar un bordillo', 'Hundimiento rápido en frenada'],
  },
  {
    id: 'AERO',
    name: 'Aerodinámica (Carga Aerodinámica / Downforce)',
    category: 'AERO',
    unit: 'kgf',
    min: 20.0,
    max: 500.0,
    step: 1.0,
    priority: 5,
    target: 'Generar fuerza vertical a velocidad media-alta para multiplicar la adherencia sin agregar masa inercial.',
    effectIncrease: 'Mayor adherencia lateral y estabilidad en curvas rápidas (>130 km/h), con incremento de resistencia al avance.',
    effectDecrease: 'Mayor velocidad punta en rectas largas pero menor agarre en virajes rápidos.',
    dependencies: ['frontAeroAdjustable', 'rearAeroAdjustable'],
    drivetrainModifiers: {
      FWD: 'Downforce delantero moderado-alto para contrarrestar subviraje rápido.',
      RWD: 'Aero trasero importante para mantener asentadas las ruedas de tracción.',
      AWD: 'Downforce equilibrado para sostener neutralidad.',
    },
    disciplineModifiers: {
      'ROAD RACING': 'Delantera 55% - 80%, Trasera 65% - 85% del rango.',
      'STREET SCENE': 'Carga moderada para balance en rectas y giros.',
      'DIRT': 'Carga moderada.',
      'CROSS COUNTRY': 'Carga mínima o nula.',
      'DRAG': 'Mínima absoluta para reducir resistencia aerodinámica.',
      'DRIFT': 'Mínima para no limitar la rotación de la zaga a velocidad.',
      'CUSTOM': 'Moderada.',
    },
    symptoms: ['El auto flota o derrapa a más de 180 km/h', 'Velocidad máxima reducida en rectas largas'],
  },
  {
    id: 'BRAKE',
    name: 'Balance y Presión de Frenos',
    category: 'BRAKES',
    unit: '%',
    min: 30.0,
    max: 70.0,
    step: 1.0,
    priority: 1,
    target: 'Distribuir la fuerza de detención entre ejes delantero y trasero para detener el vehículo con estabilidad.',
    effectIncrease: 'Más del 50% traslada fuerza al eje delantero (mitiga trompos pero induce subviraje); más presión aumenta la mordida.',
    effectDecrease: 'Menos del 50% traslada fuerza al eje trasero (facilita rotación al entrar frenando pero arriesga trompos).',
    dependencies: ['brakesAdjustable'],
    drivetrainModifiers: {
      FWD: 'Balance 52% - 54% delantero para acompañar la transferencia de masa.',
      RWD: 'Balance 50% - 52% para estabilidad sin bloqueo posterior.',
      AWD: 'Balance 51% - 53% delantero estándar en FH5.',
    },
    disciplineModifiers: {
      'ROAD RACING': 'Balance 51% - 53% Delantero, Presión 100%.',
      'STREET SCENE': 'Balance 51% Delantero, Presión 100%.',
      'DIRT': 'Balance 49% - 51%.',
      'CROSS COUNTRY': 'Balance 50% - 52%, Presión 95% - 100%.',
      'DRAG': 'Configuración estándar.',
      'DRIFT': 'Balance 46% - 49% para iniciar derrapes tocando freno.',
      'CUSTOM': 'Balance 51%, Presión 100%.',
    },
    symptoms: ['El auto se abre de frente al frenar fuerte', 'La cola amaga trompo en frenadas rectas'],
  },
  {
    id: 'DIFFERENTIAL',
    name: 'Diferenciales (Aceleración, Deceleración y Reparto AWD)',
    category: 'DIFFERENTIAL',
    unit: '%',
    min: 0.0,
    max: 100.0,
    step: 1.0,
    priority: 6,
    target: 'Permitir que las ruedas de un eje traccionen juntas sin impedir la diferencia de velocidad requerida al girar.',
    effectIncrease: 'Mayor bloqueo al acelerar otorga tracción simétrica pero puede empujar de frente (power understeer) o provocar sobreviraje brusco.',
    effectDecrease: 'Diferencial abierto permite giros dóciles pero la rueda interior puede patinar perdiendo aceleración.',
    dependencies: ['differentialAdjustable', 'drivetrain'],
    drivetrainModifiers: {
      FWD: 'Aceleración delantera 35% - 45%, Deceleración 0% - 5% para no trabar la dirección al soltar gas.',
      RWD: 'Aceleración trasera 45% - 68% para tracción progresiva; Deceleración 15% - 28% para estabilidad.',
      AWD: 'Delantero Accel: 25-40%, Del Decel: 0-10%. Trasero Accel: 55-80%, Tras Decel: 15-30%. Reparto central: 65% - 72% atrás.',
    },
    disciplineModifiers: {
      'ROAD RACING': 'AWD con 65-72% de potencia al eje trasero para agilidad tipo propulsión con apoyo delantero.',
      'STREET SCENE': 'Similar a circuito con bloqueo de decel adaptado.',
      'DIRT': 'Aceleración superior (50-70% delante, 75-90% detrás) para traccionar en superficie suelta.',
      'CROSS COUNTRY': 'Aceleración delantera 60-80%, trasera 80-95%, reparto central 50/50 o 55/45 para empuje total.',
      'DRAG': '100% aceleración en ejes motrices.',
      'DRIFT': 'Trasero 95% - 100% aceleración y 85% - 95% deceleración para bloqueo constante.',
      'CUSTOM': 'Balance según tren motriz.',
    },
    symptoms: ['Pérdida de tracción en rueda interior al salir de curva', 'Trompo súbito al pisar a fondo en el vértice'],
  },
  {
    id: 'GEARING',
    name: 'Transmisión y Relación Final',
    category: 'GEARING',
    unit: 'ratio',
    min: 0.5,
    max: 6.0,
    step: 0.01,
    priority: 7,
    target: 'Mantener el régimen de motor en la zona de potencia y par óptimo a cualquier velocidad de la pista.',
    effectIncrease: 'Relación más corta ofrece aceleración más enérgica pero menor velocidad máxima por marcha.',
    effectDecrease: 'Relación más larga otorga marchas estiradas y mayor velocidad máxima potencial pero menor aceleración.',
    dependencies: ['transmissionAdjustable', 'powerHp', 'torqueNm'],
    drivetrainModifiers: {
      FWD: 'Primeras marchas más largas para evitar patinamiento por exceso de par en el eje directriz.',
      RWD: 'Escalonamiento progresivo para no saturar las ruedas traseras en marchas cortas.',
      AWD: 'Primera marcha adaptada para despegues inmediatos gracias a la tracción total.',
    },
    disciplineModifiers: {
      'ROAD RACING': 'Final drive calibrado para rozar el corte de revoluciones en la marcha más alta al final de la recta principal.',
      'STREET SCENE': 'Marchas intermedias optimizadas para recuperaciones entre 60 y 180 km/h.',
      'DIRT': 'Relaciones cerradas para mantener el motor en zona de par alto en curvas lentas.',
      'CROSS COUNTRY': 'Marchas bajas con par abundante para dunas o agua sin perder inercia.',
      'DRAG': 'Escalonamiento para cruzar la meta al régimen de potencia máxima en la marcha más alta.',
      'DRIFT': 'Tercera y cuarta marcha con margen utilizable a medio régimen para sostener derrapes.',
      'CUSTOM': 'Escalonamiento armónico estándar.',
    },
    symptoms: ['El vehículo pierde empuje en pendientes', 'Corta inyección antes de terminar las rectas'],
  },
];

/**
 * CONSULTAS Y SERVICIOS DE LA MATRIZ DE INGENIERÍA
 */
export function getMasterMatrix(): MatrixItem[] {
  return MASTER_MATRIX;
}

export function getMatrixItem(id: string): MatrixItem | undefined {
  return MASTER_MATRIX.find((item) => item.id === id);
}

export function getDisciplineProfile(discipline: Discipline): DisciplineProfile {
  return DISCIPLINE_PROFILES[discipline] || DISCIPLINE_PROFILES['ROAD RACING'];
}

export function getEngineeringRules(conditions?: EngineeringRuleConditions): EngineeringRule[] {
  if (!conditions) return ENGINEERING_RULES;

  return ENGINEERING_RULES.filter((rule) => {
    const rc = rule.conditions;

    if (conditions.drivetrain && rc.drivetrain) {
      const match = conditions.drivetrain.some((d) => rc.drivetrain?.includes(d));
      if (!match) return false;
    }

    if (conditions.discipline && rc.discipline) {
      const match = conditions.discipline.some((d) => rc.discipline?.includes(d));
      if (!match) return false;
    }

    return true;
  });
}
