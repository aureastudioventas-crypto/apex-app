import React, { useEffect, useState } from 'react';
import { Cloud, LogOut, RefreshCw } from 'lucide-react';
import { CloudSync, SyncStatus } from '../services/cloudSync';

export function SyncPanel({ onSynced }: { onSynced: () => void }) {
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>('offline');
  const [message, setMessage] = useState('');

  const refresh = async () => {
    const user = await CloudSync.getUser();
    setUserEmail(user?.email ?? null);
    if (!user) { setStatus('signed-out'); return; }
    setStatus('syncing');
    try { await CloudSync.sync(); setStatus('synced'); onSynced(); }
    catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'No se pudo sincronizar.'); }
  };

  useEffect(() => {
    refresh();
    const { data: listener } = CloudSync.supabase.auth.onAuthStateChange(() => { refresh(); });
    return () => listener.subscription.unsubscribe();
  }, []);

  const sendLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus('syncing'); setMessage('');
    try { await CloudSync.sendMagicLink(email); setMessage('Enlace enviado. Ábrelo en este dispositivo para activar la misma cuenta.'); }
    catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'No se pudo enviar el enlace.'); }
  };

  const syncNow = async () => { setStatus('syncing'); setMessage(''); try { await CloudSync.sync(); setStatus('synced'); onSynced(); } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'No se pudo sincronizar.'); } };
  const signOut = async () => { await CloudSync.signOut(); setUserEmail(null); setStatus('signed-out'); };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(92vw,360px)] rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2 mb-2"><Cloud size={18} className="text-cyan-400"/><strong>Sincronización APEX</strong></div>
      {userEmail ? (
        <>
          <div className="text-xs text-slate-400 mb-3 break-all">Cuenta: {userEmail}</div>
          <div className="flex gap-2">
            <button onClick={syncNow} disabled={status === 'syncing'} className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"><RefreshCw size={14} className="inline mr-1"/> {status === 'syncing' ? 'Sincronizando…' : 'Sincronizar'}</button>
            <button onClick={signOut} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300"><LogOut size={14}/></button>
          </div>
        </>
      ) : (
        <form onSubmit={sendLink}>
          <p className="text-xs text-slate-400 mb-3">Usa el mismo correo en PC y teléfono. No necesitas contraseña: recibirás un enlace de acceso.</p>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="tu-correo@ejemplo.com" className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"/>
          <button disabled={status === 'syncing'} className="w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{status === 'syncing' ? 'Enviando…' : 'Activar sincronización'}</button>
        </form>
      )}
      {status === 'synced' && <div className="mt-2 text-xs text-emerald-400">✓ Datos sincronizados entre dispositivos.</div>}
      {message && <div className="mt-2 text-xs text-slate-300">{message}</div>}
    </div>
  );
}
