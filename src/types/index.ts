/**
 * APEX TUNING ENGINE — FH5
 * Tipos e interfaces centrales del sistema de ingeniería
 */

export type CarClass = 'D' | 'C' | 'B' | 'A' | 'S1' | 'S2' | 'X';
export type Drivetrain = 'FWD' | 'RWD' | 'AWD';
export type Aspiration = 'Natural' | 'Turbo' | 'Twin-Turbo' | 'Supercharged' | 'Centrífugo';
export type TransmissionType = 'Manual' | 'Manual con Embrague' | 'Secuencial';
export type VehicleStatus = 'AFINADO' | 'EN PRUEBAS' | 'BASELINE' | 'PROYECTO';

export type TireCompound =
  | 'Stock'
  | 'Street'
  | 'Sport'
  | 'Semi-Slick'
  | 'Race'
  | 'Rally'
  | 'Offroad'
  | 'Drift'
  | 'Drag'
  | 'Snow';

export type Discipline =
  | 'ROAD RACING'
  | 'STREET SCENE'
  | 'DIRT'
  | 'CROSS COUNTRY'
  | 'DRAG'
  | 'DRIFT'
  | 'CUSTOM';

export interface VehicleParts {
  // Neumáticos
  tireCompound: TireCompound;
  frontTireWidthMm: number;
  rearTireWidthMm: number;
  frontRimSizeInches: number;
  rearRimSizeInches: number;
  frontTrackWidthLevel: number; // 0 - 3 espaciadores
  rearTrackWidthLevel: number; // 0 - 3 espaciadores

  // Componentes ajustables (si false, no mostrar parámetros)
  brakesAdjustable: boolean;
  suspensionAdjustable: boolean;
  frontArbAdjustable: boolean;
  rearArbAdjustable: boolean;
  differentialAdjustable: boolean;
  transmissionAdjustable: boolean;
  frontAeroAdjustable: boolean;
  rearAeroAdjustable: boolean;
  weightReduction: 'Stock' | 'Street' | 'Sport' | 'Race';
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  carClass: CarClass;
  pi: number; // 100 - 999
  drivetrain: Drivetrain;
  engine: string;
  powerHp: number;
  torqueNm: number;
  displacementL: number;
  aspiration: Aspiration;
  weightKg: number;
  frontWeightRatio: number; // e.g. 0.52 for 52% delantero
  gearsCount: number;
  transmissionType: TransmissionType;
  parts: VehicleParts;
  status: VehicleStatus;
  currentDiscipline: Discipline;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DriverProfile {
  cornerEntry: number; // 0 (Estable) <-> 100 (Agresiva)
  rotation: number; // 0 (Baja) <-> 100 (Alta)
  cornerExit: number; // 0 (Suave) <-> 100 (Agresiva)
  oversteerTolerance: number; // 0 (Baja) <-> 100 (Alta)
  steeringResponse: number; // 0 (Suave) <-> 100 (Rápida)
  sensitivity: number; // 0 (Baja) <-> 100 (Alta)
}

export interface HardwareProfile {
  deviceType: 'CONTROLADOR' | 'VOLANTE';
  wheelModel?: string; // e.g. 'Logitech G920', 'Fanatec CSL DD', 'Thrustmaster T300'
  rotationDegrees?: number; // e.g. 540, 900
  wheelConfig?: {
    brand: string;
    model: string;
    rotationDegrees: number;
  };
  assists: {
    abs: boolean;
    tcs: boolean;
    stm: boolean;
    steering: 'Estándar' | 'Simulación';
    transmission: 'Automática' | 'Manual' | 'Manual con Embrague';
    clutch: boolean;
    drivingLine: 'Completa' | 'Solo Frenado' | 'Desactivada';
    rewind: boolean;
  };
}

export type ParameterCategory =
  | 'TIRES'
  | 'GEARING'
  | 'ALIGNMENT'
  | 'ARB'
  | 'SPRINGS'
  | 'DAMPING'
  | 'AERO'
  | 'BRAKES'
  | 'DIFFERENTIAL';

export interface EngineeringExplanation {
  what: string;
  why: string;
  expectedEffect: string;
  ifProblemPersists: string;
  nextAction: string;
}

export interface TuneParameter {
  key: string;
  category: ParameterCategory;
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  target: string;
  why: string;
  effectIncrease: string;
  effectDecrease: string;
  relatedSymptoms: string[];
  nextAction?: string;
  available: boolean; // Ocultar si la pieza no está instalada en el vehículo
  isAvailable: boolean; // Alias de compatibilidad
  source: 'BASELINE' | 'USER' | 'DIAGNOSIS' | 'MODIFIER';
  confidence: number; // 0 - 100
  engineeringExplanation: EngineeringExplanation;
}

export interface VehicleBalance {
  grip: number; // 0 - 100
  rotation: number; // 0 - 100
  stability: number; // 0 - 100
  traction: number; // 0 - 100
  coordinates: {
    x: number; // -50 (Subviraje) <-> +50 (Sobreviraje)
    y: number; // -50 (Blando/Absorción) <-> +50 (Rígido/Grip puro)
  };
}

export interface Tune {
  id: string;
  vehicleId: string;
  discipline: Discipline;
  name: string;
  version: number;
  versionTag: string; // e.g. "BASE v1.0", "TEST 01", "v2.0"
  status?: VehicleStatus;
  driverProfile: DriverProfile;
  hardwareProfile: HardwareProfile;
  parameters: Record<string, TuneParameter>;
  balance: VehicleBalance;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EngineeringRuleConditions {
  drivetrain?: Drivetrain[];
  discipline?: Discipline[];
  powerRange?: [number, number];
  weightRange?: [number, number];
  frontWeightRange?: [number, number];
  tireCompound?: TireCompound[];
  installedParts?: (keyof VehicleParts)[];
  driverProfileConditions?: Partial<Record<keyof DriverProfile, { min?: number; max?: number }>>;
  hardwareProfileConditions?: { deviceType?: ('CONTROLADOR' | 'VOLANTE')[] };
}

export interface EngineeringRule {
  id: string;
  parameterKey: string;
  conditions: EngineeringRuleConditions;
  priority: number; // 1 (más alta) a 10
  direction: 'AUMENTAR' | 'DISMINUIR' | 'PROPORCIONAL' | 'FIJO';
  magnitude: number;
  rationale: string;
  sideEffects: string;
  relatedSymptoms: string[];
}

export interface DisciplineProfile {
  name: string;
  objective: string;
  priorities: string[];
  priorityParameters: string[];
  preferredBehavior: string;
  characteristics: string;
  parameterModifiers?: Record<string, { delta?: number; multiplier?: number; rationale: string }>;
}

export interface TestSession {
  id: string;
  tuneId: string;
  vehicleId: string;
  versionId?: string;
  discipline: Discipline;
  date: string;
  trackName: string;
  surface: 'Asfalto liso' | 'Asfalto irregular' | 'Tierra suelta' | 'Barro' | 'Arena' | 'Mixto';
  conditions: 'Seco' | 'Húmedo' | 'Lluvia' | 'Tormenta' | 'Caluroso';
  approxSpeed: 'Baja' | 'Media' | 'Alta';
  symptoms: {
    cornerEntry?: 'Subviraje' | 'Sobreviraje' | 'Nervioso' | 'Estable';
    midCorner?: 'Subviraje' | 'Sobreviraje' | 'Estable';
    cornerExit?: 'Subviraje' | 'Sobreviraje' | 'Wheelspin' | 'Power oversteer' | 'Estable';
    braking?: 'Se va de frente' | 'Se mueve de atrás' | 'No gira' | 'Inestable' | 'Estable';
    suspension?: 'Rebota' | 'Toca fondo' | 'Demasiado rígido' | 'Demasiado blando' | 'Pierde contacto';
    straight?: 'Nervioso' | 'Estable' | 'Lento';
  };
  driverComment?: string;
  pilotNotes?: string;
  diagnosis?: DiagnosisResult[];
  intervention?: PrimaryIntervention;
  result?: 'EMPEORÓ' | 'SIN CAMBIO' | 'MEJORÓ' | 'RESUELTO';
}

export interface DiagnosisCause {
  component: string;
  parameterKey: string;
  probability: number; // 0 - 100
  rationale: string;
}

export interface PrimaryIntervention {
  parameterKey: string;
  parameterName: string;
  currentValue: number;
  recommendedValue: number;
  unit: string;
  delta: number;
  direction: 'AUMENTAR' | 'DISMINUIR' | 'MANTENER';
  reason: string;
  expectedEffect: string;
  risk: string;
  priority: 'Seguridad' | 'Neumáticos' | 'Balance' | 'Suspensión' | 'Aero' | 'Diferencial' | 'Transmisión';
  retestInstruction: string;
  // Aliases de compatibilidad
  actionInstruction?: string;
  priorityCategory?: 'Seguridad' | 'Neumáticos' | 'Balance' | 'Suspensión' | 'Aero' | 'Diferencial' | 'Transmisión';
  explanation?: string;
}

export interface DiagnosisResult {
  symptomAnalyzed: string;
  zone: string;
  possibleCauses: DiagnosisCause[];
  primaryIntervention: PrimaryIntervention;
  nextStepWarning: string;
}

export type TestResultOutcome = 'EMPEORÓ' | 'SIN CAMBIO' | 'MEJORÓ' | 'RESUELTO';

export interface TuneVersion {
  id: string;
  tuneId: string;
  vehicleId: string;
  discipline: Discipline;
  versionNumber: number;
  versionTag: string; // e.g. "v1.0", "v1.1 - Fix ARB"
  parentVersionId: string | null;
  date: string;
  parameterSnapshots: Record<string, number>;
  balanceSnapshot: VehicleBalance;
  changes: string[];
  originSymptom: string;
  engineeringReason: string;
  testResult?: TestResultOutcome;
  driverComment?: string;
  // Aliases de compatibilidad
  versionName?: string;
  changesSummary?: string[];
  pilotFeedback?: string;
}

export type TuneVersionHistoryItem = TuneVersion;

export interface MatrixItem {
  id: string;
  name: string;
  category: ParameterCategory;
  unit: string;
  min: number;
  max: number;
  step: number;
  target: string;
  effectIncrease: string;
  effectDecrease: string;
  priority: number;
  dependencies: string[];
  drivetrainModifiers: {
    FWD: string;
    RWD: string;
    AWD: string;
  };
  disciplineModifiers: Record<Discipline, string>;
  symptoms: string[];
}

export interface ValidationIssue {
  parameterKey: string;
  type: 'ERROR' | 'WARNING';
  message: string;
  currentValue?: number;
  allowedRange?: [number, number];
  unit?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}
