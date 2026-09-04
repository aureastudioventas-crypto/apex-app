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
  nextAction: string;
  isAvailable: boolean; // Ocultar si la pieza no está instalada
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
  versionTag: string; // e.g. "BASE v1", "TEST 01", "v2.0"
  driverProfile: DriverProfile;
  hardwareProfile: HardwareProfile;
  parameters: Record<string, TuneParameter>;
  balance: VehicleBalance;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestSession {
  id: string;
  tuneId: string;
  vehicleId: string;
  date: string;
  discipline: Discipline;
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
  pilotNotes?: string;
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
  explanation: string;
  actionInstruction: string;
  priorityCategory: 'Seguridad' | 'Neumáticos' | 'Balance' | 'Suspensión' | 'Aero' | 'Diferencial' | 'Transmisión';
}

export interface DiagnosisResult {
  symptomAnalyzed: string;
  zone: string;
  possibleCauses: DiagnosisCause[];
  primaryIntervention: PrimaryIntervention;
  nextStepWarning: string;
}

export interface TuneVersionHistoryItem {
  id: string;
  tuneId: string;
  vehicleId: string;
  versionNumber: number;
  versionName: string;
  date: string;
  changesSummary: string[];
  parameterSnapshots: Record<string, number>;
  balanceSnapshot: VehicleBalance;
  originSymptom?: string;
  engineeringReason: string;
  testResult?: 'Mejoró' | 'Sin cambios' | 'Empeoró';
  pilotFeedback?: string;
}

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
