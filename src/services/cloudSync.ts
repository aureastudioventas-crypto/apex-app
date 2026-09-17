import { createClient, type User } from '@supabase/supabase-js';
import { Vehicle, Tune, TestSession, TuneVersionHistoryItem } from '../types';
import { StorageService } from './storage';
import { getAuthRedirectUrl } from './authRedirect';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lzrclnobhyryswvhoslc.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_TF8nuNgx-hb_fTHfC_cbrw_f7X_JfU_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export type SyncStatus = 'offline' | 'signed-out' | 'syncing' | 'synced' | 'error';
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function stamp(value: unknown): number {
  const date = typeof value === 'object' && value !== null && 'updatedAt' in value ? (value as { updatedAt?: string }).updatedAt : undefined;
  return date ? Date.parse(date) || 0 : 0;
}

export const CloudSync = {
  async getUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  },
  async sendMagicLink(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: getAuthRedirectUrl() } });
    if (error) throw error;
  },
  async signOut(): Promise<void> { const { error } = await supabase.auth.signOut(); if (error) throw error; },
  scheduleSync(): void {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => { this.sync().catch(() => undefined); }, 700);
  },
  async sync(): Promise<{ status: SyncStatus; user: User | null }> {
    const user = await this.getUser();
    if (!user) return { status: 'signed-out', user: null };
    const localVehicles = StorageService.getVehicles().filter(v => !v.isDemo);
    const localTunes = Object.values(StorageService.getTunes());
    const localSessions = StorageService.getTestSessions();
    const localHistory = StorageService.getHistory();
    const { data: cloudVehicles, error: vehicleReadError } = await supabase.from('vehicles').select('id,data,updated_at').eq('owner_id', user.id);
    if (vehicleReadError) throw vehicleReadError;
    const { data: cloudTunes, error: tuneReadError } = await supabase.from('tunes').select('id,vehicle_id,discipline,data,updated_at').eq('owner_id', user.id);
    if (tuneReadError) throw tuneReadError;
    const cloudVehicleMap = new Map((cloudVehicles || []).map(row => [row.id, row]));
    const cloudTuneMap = new Map((cloudTunes || []).map(row => [`${row.vehicle_id}__${row.discipline}`, row]));
    const vehiclesToUpload = localVehicles.filter(v => { const cloud = cloudVehicleMap.get(v.id); return !cloud || stamp(v) >= Date.parse(cloud.updated_at || '') || !cloud.data; });
    if (vehiclesToUpload.length) {
      const { error } = await supabase.from('vehicles').upsert(vehiclesToUpload.map(v => ({ id: v.id, owner_id: user.id, data: v, created_at: v.createdAt || new Date().toISOString(), updated_at: v.updatedAt || new Date().toISOString() })));
      if (error) throw error;
    }
    const tunesToUpload = localTunes.filter(t => { const cloud = cloudTuneMap.get(`${t.vehicleId}__${t.discipline}`); return !cloud || stamp(t) >= Date.parse(cloud.updated_at || ''); });
    if (tunesToUpload.length) {
      const { error } = await supabase.from('tunes').upsert(tunesToUpload.map(t => ({ id: t.id, owner_id: user.id, vehicle_id: t.vehicleId, discipline: t.discipline, data: t, created_at: t.createdAt || new Date().toISOString(), updated_at: t.updatedAt || new Date().toISOString() })));
      if (error) throw error;
    }
    if (localSessions.length) {
      const { error } = await supabase.from('test_sessions').upsert(localSessions.map((s: TestSession) => ({ id: s.id, owner_id: user.id, vehicle_id: s.vehicleId || null, data: s, created_at: new Date().toISOString() })));
      if (error) throw error;
    }
    if (localHistory.length) {
      const { error } = await supabase.from('tune_history').upsert(localHistory.map((h: TuneVersionHistoryItem) => ({ id: h.id, owner_id: user.id, tune_id: h.tuneId, vehicle_id: h.vehicleId, data: h, created_at: new Date().toISOString() })));
      if (error) throw error;
    }
    const { data: finalVehicles, error: finalVehicleError } = await supabase.from('vehicles').select('data').eq('owner_id', user.id);
    if (finalVehicleError) throw finalVehicleError;
    const { data: finalTunes, error: finalTuneError } = await supabase.from('tunes').select('data').eq('owner_id', user.id);
    if (finalTuneError) throw finalTuneError;
    const { data: finalHistory, error: finalHistoryError } = await supabase.from('tune_history').select('data').eq('owner_id', user.id);
    if (finalHistoryError) throw finalHistoryError;
    const { data: finalSessions, error: finalSessionError } = await supabase.from('test_sessions').select('data').eq('owner_id', user.id);
    if (finalSessionError) throw finalSessionError;
    StorageService.replaceSyncedData({
      vehicles: (finalVehicles || []).map(r => r.data as Vehicle).filter(v => !v.isDemo),
      tunes: (finalTunes || []).map(r => r.data as Tune).filter(t => !t.versionTag?.startsWith('DEMO /')),
      history: (finalHistory || []).map(r => r.data as TuneVersionHistoryItem).filter(h => !h.versionTag?.startsWith('DEMO /')),
      sessions: (finalSessions || []).map(r => r.data as TestSession),
    });
    return { status: 'synced', user };
  },
};
