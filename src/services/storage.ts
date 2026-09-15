import { Vehicle, Tune, Discipline, TestSession, TuneVersionHistoryItem } from '../types';
import { generateMaster37BaselineTune } from '../engine/master37BaselineEngine';

const STORAGE_KEYS = {
  VEHICLES: 'apex_fh5_vehicles_v1', TUNES: 'apex_fh5_tunes_v1', SESSIONS: 'apex_fh5_sessions_v1', HISTORY: 'apex_fh5_history_v1', ACTIVE_VEHICLE_ID: 'apex_fh5_active_veh_id', TUNE_SCHEMA: 'apex_fh5_tune_schema_version',
};
const TUNE_SCHEMA_VERSION = 2;
const DEFAULT_DRIVER_PROFILE = { cornerEntry: 50, rotation: 50, cornerExit: 50, oversteerTolerance: 50, steeringResponse: 50, sensitivity: 50 };
const DEFAULT_HARDWARE_PROFILE = { deviceType: 'CONTROLADOR' as const, wheelModel: 'Logitech G920', rotationDegrees: 900, assists: { abs: true, tcs: false, stm: false, steering: 'Simulación' as const, transmission: 'Manual' as const, clutch: false, drivingLine: 'Solo Frenado' as const, rewind: true } };
function canonicalKey(tune: Tune): string { return `${tune.vehicleId}__${tune.discipline}`; }
function tuneValues(tunes: Record<string, Tune>): Tune[] { return Object.values(tunes); }
function migrateTuneMap(raw: Record<string, Tune>): Record<string, Tune> {
  const byIdentity: Record<string, Tune> = {};
  Object.values(raw || {}).forEach((candidate) => {
    if (!candidate || typeof candidate !== 'object' || !candidate.id || !candidate.vehicleId || !candidate.discipline || candidate.versionTag?.startsWith('DEMO /')) return;
    const key = canonicalKey(candidate); const existing = byIdentity[key];
    if (!existing || new Date(candidate.updatedAt || candidate.createdAt || 0).getTime() >= new Date(existing.updatedAt || existing.createdAt || 0).getTime()) byIdentity[key] = candidate;
  });
  return byIdentity;
}
function cleanVehicles(vehicles: Vehicle[]): Vehicle[] { return (vehicles || []).filter(v => !v.isDemo); }

export const StorageService = {
  getVehicles(): Vehicle[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      if (!data) return [];
      const vehicles = cleanVehicles(JSON.parse(data));
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
      return vehicles;
    } catch { return []; }
  },
  saveVehicle(vehicle: Vehicle): void {
    if (vehicle.isDemo) return;
    const list = this.getVehicles(); const idx = list.findIndex(v => v.id === vehicle.id); const now = new Date().toISOString();
    if (idx >= 0) list[idx] = { ...vehicle, updatedAt: now }; else list.unshift({ ...vehicle, createdAt: now, updatedAt: now });
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(list));
  },
  deleteVehicle(id: string): void {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(this.getVehicles().filter(v => v.id !== id)));
    const tunes = tuneValues(this.getTunes()).filter(t => t.vehicleId !== id).reduce((m, t) => { m[canonicalKey(t)] = t; return m; }, {} as Record<string,Tune>);
    localStorage.setItem(STORAGE_KEYS.TUNES, JSON.stringify(tunes));
  },
  getActiveVehicleId(): string { return localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE_ID) || this.getVehicles()[0]?.id || ''; },
  setActiveVehicleId(id: string): void { localStorage.setItem(STORAGE_KEYS.ACTIVE_VEHICLE_ID, id); },
  getTunes(): Record<string, Tune> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TUNES); const parsed = raw ? JSON.parse(raw) as Record<string,Tune> : {};
      const schema = Number(localStorage.getItem(STORAGE_KEYS.TUNE_SCHEMA) || 0);
      const migrated = migrateTuneMap(parsed);
      if (schema !== TUNE_SCHEMA_VERSION || Object.keys(parsed).some(k => !k.includes('__'))) { localStorage.setItem(STORAGE_KEYS.TUNES, JSON.stringify(migrated)); localStorage.setItem(STORAGE_KEYS.TUNE_SCHEMA, String(TUNE_SCHEMA_VERSION)); return migrated; }
      return migrated;
    } catch { return {}; }
  },
  getTunesForVehicle(vehicleId: string): Tune[] { return tuneValues(this.getTunes()).filter(t => t.vehicleId === vehicleId); },
  getTuneById(tuneId: string): Tune | null { return tuneValues(this.getTunes()).find(t => t.id === tuneId) || null; },
  getTune(vehicleId: string, discipline: Discipline): Tune | null {
    const tunes = this.getTunes(); const key = `${vehicleId}__${discipline}`; if (tunes[key]) return tunes[key];
    const vehicle = this.getVehicles().find(v => v.id === vehicleId); if (!vehicle) return null;
    const tune = generateMaster37BaselineTune(vehicle, discipline, DEFAULT_DRIVER_PROFILE, DEFAULT_HARDWARE_PROFILE); this.saveTune(tune); return tune;
  },
  getTuneForVehicle(vehicleId: string): Tune | null { const v = this.getVehicles().find(x => x.id === vehicleId); return this.getTune(vehicleId, v?.currentDiscipline || 'ROAD RACING'); },
  saveTune(tune: Tune): void { if (tune.versionTag?.startsWith('DEMO /')) return; const tunes = this.getTunes(); const saved = { ...tune, updatedAt: new Date().toISOString() }; tunes[canonicalKey(saved)] = saved; localStorage.setItem(STORAGE_KEYS.TUNES, JSON.stringify(tunes)); localStorage.setItem(STORAGE_KEYS.TUNE_SCHEMA, String(TUNE_SCHEMA_VERSION)); },
  deleteTune(tuneId: string): void { const tunes = this.getTunes(); const target = tuneValues(tunes).find(t => t.id === tuneId); if (target) delete tunes[canonicalKey(target)]; localStorage.setItem(STORAGE_KEYS.TUNES, JSON.stringify(tunes)); },
  getTestSessions(): TestSession[] { try { const d=localStorage.getItem(STORAGE_KEYS.SESSIONS); return d ? JSON.parse(d) : []; } catch { return []; } },
  saveTestSession(session: TestSession): void { const sessions=this.getTestSessions(); sessions.unshift(session); localStorage.setItem(STORAGE_KEYS.SESSIONS,JSON.stringify(sessions)); },
  getHistory(tuneId?: string): TuneVersionHistoryItem[] { try { const d=localStorage.getItem(STORAGE_KEYS.HISTORY); const all: TuneVersionHistoryItem[]=d?JSON.parse(d):[]; return tuneId?all.filter(h=>h.tuneId===tuneId):all; } catch { return []; } },
  getHistoryForVehicle(vehicleId: string): TuneVersionHistoryItem[] { return this.getHistory().filter(h=>h.vehicleId===vehicleId); },
  saveHistoryItem(item: TuneVersionHistoryItem): void { const h=this.getHistory(); h.unshift(item); localStorage.setItem(STORAGE_KEYS.HISTORY,JSON.stringify(h)); },
  addHistoryItem(item: TuneVersionHistoryItem): void { this.saveHistoryItem(item); },
  replaceSyncedData(snapshot: { vehicles: Vehicle[]; tunes: Tune[]; history: TuneVersionHistoryItem[]; sessions: TestSession[] }): void {
    const vehicles = cleanVehicles(snapshot.vehicles);
    const tunes: Record<string,Tune> = {}; snapshot.tunes.filter(t => !t.versionTag?.startsWith('DEMO /')).forEach(t => { tunes[canonicalKey(t)] = t; });
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    localStorage.setItem(STORAGE_KEYS.TUNES, JSON.stringify(tunes));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(snapshot.history.filter(h => !h.versionTag?.startsWith('DEMO /'))));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(snapshot.sessions));
    localStorage.setItem(STORAGE_KEYS.TUNE_SCHEMA, String(TUNE_SCHEMA_VERSION));
  },
  initDemoData(): void { /* Intentionally disabled: production garage starts empty. */ },
  resetAll(): void { Object.values(STORAGE_KEYS).forEach(k=>localStorage.removeItem(k)); },
};
