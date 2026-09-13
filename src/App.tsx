/**
 * APEX TUNING ENGINE — FH5
 * Sistema Inteligente de Ingeniería de Reglajes para Forza Horizon 5
 */

import React, { useState, useEffect } from 'react';
import { Vehicle, Tune, TuneVersionHistoryItem } from './types';
import { StorageService } from './services/storage';
import { generateMaster37BaselineTune } from './engine/master37BaselineEngine';
import { Header } from './components/Header';
import { GaragePage } from './pages/GaragePage';
import { VehiclesPage } from './pages/VehiclesPage';
import { TuneStudioPage } from './pages/TuneStudioPage';
import { TestDiagnosisPage } from './pages/TestDiagnosisPage';
import { HistoryPage } from './pages/HistoryPage';
import { MatrixPage } from './pages/MatrixPage';
import { SettingsPage } from './pages/SettingsPage';
import { GeminiDrawer } from './components/GeminiDrawer';
import { TracksideModal } from './components/TracksideModal';

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tunes, setTunes] = useState<Record<string, Tune>>({});
  const [activeVehicleId, setActiveVehicleId] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>('garage');
  const [historyItems, setHistoryItems] = useState<TuneVersionHistoryItem[]>([]);
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [isTracksideOpen, setIsTracksideOpen] = useState(false);
  const [isCreateVehicleOpen, setIsCreateVehicleOpen] = useState(false);

  const loadInitialData = () => {
    const loadedVehicles = StorageService.getVehicles();
    setVehicles(loadedVehicles);
    const loadedTunes = StorageService.getTunes();
    const activeVeh = loadedVehicles[0];
    const updatedTunes = { ...loadedTunes };
    let tunesUpdated = false;

    loadedVehicles.forEach((veh) => {
      const compositeKey = `${veh.id}__${veh.currentDiscipline || 'ROAD RACING'}`;
      if (!updatedTunes[compositeKey]) {
        const baseline = generateMaster37BaselineTune(veh, veh.currentDiscipline || 'ROAD RACING');
        updatedTunes[compositeKey] = baseline;
        StorageService.saveTune(baseline);
        tunesUpdated = true;
      }
    });

    setTunes(tunesUpdated ? updatedTunes : loadedTunes);
    if (activeVeh) {
      setActiveVehicleId(activeVeh.id);
      setHistoryItems(StorageService.getHistoryForVehicle(activeVeh.id));
    }
  };

  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => {
    if (activeVehicleId) setHistoryItems(StorageService.getHistoryForVehicle(activeVehicleId));
  }, [activeVehicleId]);

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || vehicles[0] || null;
  const activeTune = activeVehicle ? tunes[`${activeVehicle.id}__${activeVehicle.currentDiscipline}`] || null : null;

  const handleSelectVehicle = (id: string) => {
    setActiveVehicleId(id);
    StorageService.setActiveVehicleId(id);
    const v = vehicles.find((veh) => veh.id === id);
    if (v) {
      const disc = v.currentDiscipline || 'ROAD RACING';
      const compositeKey = `${v.id}__${disc}`;
      const tuneLoaded = tunes[compositeKey] || StorageService.getTune(v.id, disc);
      if (tuneLoaded) setTunes((prev) => ({ ...prev, [compositeKey]: tuneLoaded }));
    }
  };

  const handleUpdateTune = (updatedTune: Tune) => {
    const compositeKey = `${updatedTune.vehicleId}__${updatedTune.discipline}`;
    setTunes((prev) => ({ ...prev, [compositeKey]: updatedTune, [updatedTune.id]: updatedTune }));
    StorageService.saveTune(updatedTune);
  };

  const handleSaveNewVersion = (tuneToSave: Tune, versionName: string, notes: string) => {
    const nextVer = Number((tuneToSave.version + 0.1).toFixed(1));
    const paramSnapshots: Record<string, number> = {};
    Object.keys(tuneToSave.parameters).forEach((k) => { paramSnapshots[k] = tuneToSave.parameters[k].value; });
    const historyItem: TuneVersionHistoryItem = {
      id: `ver-${Date.now()}`, tuneId: tuneToSave.id, vehicleId: tuneToSave.vehicleId, discipline: tuneToSave.discipline,
      versionNumber: nextVer, versionName: versionName || `v${nextVer}`, versionTag: versionName || `v${nextVer}`, parentVersionId: null,
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      changes: [notes || 'Actualización de reglaje'], originSymptom: 'Afinación en Tune Studio', engineeringReason: notes || 'Optimización dinámica en Tune Studio',
      balanceSnapshot: tuneToSave.balance, parameterSnapshots: paramSnapshots, changesSummary: [notes || 'Actualización de reglaje'],
    };
    StorageService.addHistoryItem(historyItem);
    setHistoryItems((prev) => [historyItem, ...prev]);
    handleUpdateTune({ ...tuneToSave, version: nextVer, versionTag: versionName || `v${nextVer}`, updatedAt: new Date().toISOString() });
  };

  const handleRevertToVersion = (historyItem: TuneVersionHistoryItem) => {
    if (!activeTune) return;
    const restoredParams = { ...activeTune.parameters };
    Object.keys(historyItem.parameterSnapshots || {}).forEach((k) => {
      if (restoredParams[k]) restoredParams[k] = { ...restoredParams[k], value: historyItem.parameterSnapshots[k] };
    });
    handleUpdateTune({ ...activeTune, versionTag: `${historyItem.versionName} (Revertido)`, parameters: restoredParams, balance: historyItem.balanceSnapshot, updatedAt: new Date().toISOString() });
    setCurrentTab('tuner');
  };

  const handleSaveVehicle = (veh: Vehicle) => {
    StorageService.saveVehicle(veh);
    setVehicles(StorageService.getVehicles());
    setActiveVehicleId(veh.id);
    const compositeKey = `${veh.id}__${veh.currentDiscipline || 'ROAD RACING'}`;
    if (!tunes[compositeKey]) handleUpdateTune(generateMaster37BaselineTune(veh, veh.currentDiscipline || 'ROAD RACING'));
  };

  const handleDeleteVehicle = (vehId: string) => {
    StorageService.deleteVehicle(vehId);
    const updatedVehicles = StorageService.getVehicles();
    setVehicles(updatedVehicles);
    if (activeVehicleId === vehId && updatedVehicles.length > 0) setActiveVehicleId(updatedVehicles[0].id);
  };

  const handleTracksideQuickFix = (paramKey: string, newValue: number) => {
    if (!activeTune || !activeTune.parameters[paramKey]) return;
    const updatedParams = { ...activeTune.parameters, [paramKey]: { ...activeTune.parameters[paramKey], value: newValue } };
    handleUpdateTune({ ...activeTune, parameters: updatedParams, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      <Header activeTab={currentTab} onTabChange={setCurrentTab} activeVehicle={activeVehicle} activeTune={activeTune} onOpenGemini={() => setIsGeminiOpen(true)} onOpenTrackside={() => setIsTracksideOpen(true)} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-16">
        {currentTab === 'garage' && <GaragePage vehicles={vehicles} tunes={tunes} activeVehicleId={activeVehicleId} onSelectVehicle={handleSelectVehicle} onNavigateTab={setCurrentTab} onOpenCreateVehicleModal={() => setIsCreateVehicleOpen(true)} />}
        {currentTab === 'vehicles' && <VehiclesPage vehicles={vehicles} activeVehicleId={activeVehicleId} onSelectVehicle={handleSelectVehicle} onSaveVehicle={handleSaveVehicle} onDeleteVehicle={handleDeleteVehicle} onNavigateTab={setCurrentTab} isCreateModalOpen={isCreateVehicleOpen} setIsCreateModalOpen={setIsCreateVehicleOpen} />}
        {currentTab === 'tuner' && activeVehicle && activeTune && <TuneStudioPage vehicle={activeVehicle} tune={activeTune} onUpdateTune={handleUpdateTune} onSaveNewVersion={handleSaveNewVersion} onNavigateTab={setCurrentTab} />}
        {currentTab === 'test' && activeVehicle && activeTune && <TestDiagnosisPage vehicle={activeVehicle} tune={activeTune} onUpdateTune={handleUpdateTune} onSaveNewVersion={handleSaveNewVersion} onNavigateTab={setCurrentTab} />}
        {currentTab === 'history' && activeVehicle && activeTune && <HistoryPage vehicle={activeVehicle} currentTune={activeTune} historyItems={historyItems} onRevertToVersion={handleRevertToVersion} onNavigateTab={setCurrentTab} />}
        {currentTab === 'matrix' && <MatrixPage />}
        {currentTab === 'settings' && <SettingsPage onDataReset={loadInitialData} />}
      </main>
      <GeminiDrawer isOpen={isGeminiOpen} onClose={() => setIsGeminiOpen(false)} activeVehicle={activeVehicle} activeTune={activeTune} />
      <TracksideModal isOpen={isTracksideOpen} onClose={() => setIsTracksideOpen(false)} activeVehicle={activeVehicle} activeTune={activeTune} onApplyQuickFix={handleTracksideQuickFix} />
    </div>
  );
}
