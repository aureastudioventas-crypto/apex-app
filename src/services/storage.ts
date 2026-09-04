/**
 * APEX TUNING ENGINE — FH5
 * SERVICIO DE ALMACENAMIENTO LOCAL V1.1 (Persistencia Determinista)
 *
 * Soporta almacenamiento multiversión y multidisciplina por vehículo sin sobrescrituras accidentales.
 * Marca explícitamente los datos demo como "DEMO / BASELINE EXPERIMENTAL".
 */

import { Vehicle, Tune, Discipline, TestSession, TuneVersionHistoryItem } from '../types';
import { DEMO_VEHICLES } from '../data/demoVehicles';
import { generateBaselineTune } from '../engine/baselineEngine';

const STORAGE_KEYS = {
  VEHICLES: 'apex_fh5_vehicles_v1',
  TUNES: 'apex_fh5_tunes_v1',
  SESSIONS: 'apex_fh5_sessions_v1',
  HISTORY: 'apex_fh5_history_v1',
  ACTIVE_VEHICLE_ID: 'apex_fh5_active_veh_id',
};

const DEFAULT_DRIVER_PROFILE = {
  cornerEntry: 50,
  rotation: 55,
  cornerExit: 50,
  oversteerTolerance: 50,
  steeringResponse: 60,
  sensitivity: 50,
};

const DEFAULT_HARDWARE_PROFILE = {
  deviceType: 'CONTROLADOR' as const,
  assists: {
    abs: true,
    tcs: false,
    stm: false,
    steering: 'Simulación' as const,
    transmission: 'Manual' as const,
    clutch: false,
    drivingLine: 'Solo Frenado' as const,
    rewind: true,
  },
};

export const StorageService = {
  getVehicles(): Vehicle[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      if (!data) {
        this.initDemoData();
        return DEMO_VEHICLES;
      }
      return JSON.parse(data);
    } catch {
      return DEMO_VEHICLES;
    }
  },

  saveVehicle(vehicle: Vehicle): void {
    const list = this.getVehicles();
    const idx = list.findIndex((v) => v.id === vehicle.id);
    if (idx >= 0) {
      list[idx] = { ...vehicle, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...vehicle, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(list));
  },

  deleteVehicle(id: string): void {
    const list = this.getVehicles().filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(list));

    // También limpiar tunes asociados
    const tunes = this.getTunes();
    const filteredTunes: Record<string, Tune> = {};
    (Object.entries(tunes) as [string, Tune][]).forEach(([key, t]) => {
      if (t.vehicleId !== id) {
        filteredTunes[key] = t;
      }
    });
    localStorage.setItem(STORAGE_KEYS.TUNES, JSON.stringify(filteredTunes));
  },

  getActiveVehicleId(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE_ID);
    if (saved) return saved;
    const vehicles = this.getVehicles();
    return vehicles[0]?.id || 'bmw-x5m-2011';
  },

  setActiveVehicleId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_VEHICLE_ID, id);
  },

  getTunes(): Record<string, Tune> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TUNES);
      return data ? (JSON.parse(data) as Record<string, Tune>) : {};
    } catch {
      return {};
    }
  },

  /**
   * Obtiene todos los reglajes asociados a un vehículo específico.
   */
  getTunesForVehicle(vehicleId: string): Tune[] {
    const tunesMap = this.getTunes();
    return (Object.values(tunesMap) as Tune[]).filter((t) => t.vehicleId === vehicleId);
  },

  /**
   * Obtiene un reglaje por su ID único.
   */
  getTuneById(tuneId: string): Tune | null {
    const tunesMap = this.getTunes();
    if (tunesMap[tuneId]) return tunesMap[tuneId];
    // Buscar si está indexado con otra clave
    const found = (Object.values(tunesMap) as Tune[]).find((t) => t.id === tuneId);
    return found || null;
  },

  /**
   * Obtiene el reglaje para un vehículo y disciplina específicos.
   * Si no existe, genera uno baseline determinista sin sobreescribir otras disciplinas.
   */
  getTune(vehicleId: string, discipline: Discipline): Tune | null {
    const tunesMap = this.getTunes();

    // 1. Buscar coincidencia exacta de vehicleId + discipline
    const existing = (Object.values(tunesMap) as Tune[]).find(
      (t) => t.vehicleId === vehicleId && t.discipline === discipline
    );
    if (existing) return existing;

    // 2. Si no existe, buscar el vehículo para generar un baseline determinista
    const vehicles = this.getVehicles();
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return null;

    const newTune = generateBaselineTune(
      vehicle,
      discipline,
      DEFAULT_DRIVER_PROFILE,
      DEFAULT_HARDWARE_PROFILE
    );
    this.saveTune(newTune);
    return newTune;
  },

  /**
   * Retrocompatibilidad con la firma anterior getTuneForVehicle(vehicleId).
   */
  getTuneForVehicle(vehicleId: string): Tune | null {
    const vehicles = this.getVehicles();
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    const discipline = vehicle?.currentDiscipline || 'ROAD RACING';
    return this.getTune(vehicleId, discipline);
  },

  /**
   * Guarda un reglaje indexado por su ID único.
   * No sobrescribe los reglajes de otras disciplinas del mismo vehículo.
   */
  saveTune(tune: Tune): void {
    const tunes = this.getTunes();
    // Guardar indexado por id único
    tunes[tune.id] = { ...tune, updatedAt: new Date().toISOString() };

    // Mantener también enlace de búsqueda rápida por clave compuesta si aplica
    const compositeKey = `${tune.vehicleId}__${tune.discipline}`;
    tunes[compositeKey] = tunes[tune.id];

    localStorage.setItem(STORAGE_KEYS.TUNES, JSON.stringify(tunes));
  },

  /**
   * Elimina un reglaje por su ID.
   */
  deleteTune(tuneId: string): void {
    const tunes = this.getTunes();
    const tuneToDelete = tunes[tuneId] || (Object.values(tunes) as Tune[]).find((t) => t.id === tuneId);

    delete tunes[tuneId];
    if (tuneToDelete) {
      delete tunes[`${tuneToDelete.vehicleId}__${tuneToDelete.discipline}`];
    }
    localStorage.setItem(STORAGE_KEYS.TUNES, JSON.stringify(tunes));
  },

  getTestSessions(): TestSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveTestSession(session: TestSession): void {
    const sessions = this.getTestSessions();
    sessions.unshift(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  getHistory(tuneId?: string): TuneVersionHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const all: TuneVersionHistoryItem[] = data ? JSON.parse(data) : [];
      if (tuneId) return all.filter((h) => h.tuneId === tuneId);
      return all;
    } catch {
      return [];
    }
  },

  getHistoryForVehicle(vehicleId: string): TuneVersionHistoryItem[] {
    const all = this.getHistory();
    return all.filter((h) => h.vehicleId === vehicleId);
  },

  saveHistoryItem(item: TuneVersionHistoryItem): void {
    const history = this.getHistory();
    history.unshift(item);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  addHistoryItem(item: TuneVersionHistoryItem): void {
    this.saveHistoryItem(item);
  },

  /**
   * Inicializa datos demo claramente marcados como DEMO / BASELINE EXPERIMENTAL.
   */
  initDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(DEMO_VEHICLES));

    const tunes: Record<string, Tune> = {};
    const sampleHistory: TuneVersionHistoryItem[] = [];

    DEMO_VEHICLES.forEach((veh) => {
      const baseTune = generateBaselineTune(
        veh,
        veh.currentDiscipline,
        DEFAULT_DRIVER_PROFILE,
        DEFAULT_HARDWARE_PROFILE
      );
      // Asignar etiquetas explícitas de demo
      baseTune.versionTag = 'DEMO / BASELINE EXPERIMENTAL';
      baseTune.notes = 'DEMO / BASELINE EXPERIMENTAL: Punto inicial calculado por ingeniería. No representa un setup final de competición.';

      tunes[baseTune.id] = baseTune;
      tunes[`${veh.id}__${veh.currentDiscipline}`] = baseTune;
      // Compatibilidad con claves legacy
      tunes[veh.id] = baseTune;

      const snapshots: Record<string, number> = {};
      Object.entries(baseTune.parameters).forEach(([k, v]) => {
        snapshots[k] = v.value;
      });

      sampleHistory.push({
        id: `hist-${veh.id}-1`,
        tuneId: baseTune.id,
        vehicleId: veh.id,
        discipline: veh.currentDiscipline,
        versionNumber: 1,
        versionTag: 'DEMO / BASELINE EXPERIMENTAL',
        parentVersionId: null,
        date: new Date().toLocaleDateString('es-ES'),
        changes: ['Generación inicial de reglaje baseline determinista.'],
        parameterSnapshots: snapshots,
        balanceSnapshot: baseTune.balance,
        originSymptom: 'Creación de vehículo demo',
        engineeringReason: `DEMO / BASELINE EXPERIMENTAL: Calibrado para ${veh.weightKg} kg con distribución ${(veh.frontWeightRatio * 100).toFixed(0)}% en ${veh.currentDiscipline}.`,
        testResult: 'SIN CAMBIO',
        versionName: 'DEMO / BASELINE EXPERIMENTAL (v1.0)',
        changesSummary: ['Generación inicial de reglaje baseline determinista.'],
      });
    });

    localStorage.setItem(STORAGE_KEYS.TUNES, JSON.stringify(tunes));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sampleHistory));
  },

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.VEHICLES);
    localStorage.removeItem(STORAGE_KEYS.TUNES);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_VEHICLE_ID);
    this.initDemoData();
  },
};
