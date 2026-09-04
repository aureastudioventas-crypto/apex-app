/**
 * APEX TUNING ENGINE — FH5
 * Sistema Inteligente de Ingeniería de Reglajes para Forza Horizon 5
 */

import React, { useState, useEffect } from 'react';
import { Vehicle, Tune, TuneVersionHistoryItem, Discipline } from './types';
import { StorageService } from './services/storage';
import { generateBaselineTune } from './engine/baselineEngine';
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

  // Modals state
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [isTracksideOpen, setIsTracksideOpen] = useState(false);
  const [isCreateVehicleOpen, setIsCreateVehicleOpen] = useState(false);

  // Initialize data on mount
  const loadInitialData = () => {
    const loadedVehicles = StorageService.getVehicles();
    setVehicles(loadedVehicles);

    let loadedTunes = StorageService.getTunes();
    const activeVeh = loadedVehicles[0];

    // Ensure all vehicles have at least one tune
    let updatedTunes = { ...loadedTunes };
    let tunesUpdated = false;

    loadedVehicles.forEach((veh) => {
      if (!updatedTunes[veh.id]) {
        const baseline = generateBaselineTune(veh, veh.currentDiscipline || 'ROAD RACING');
        updatedTunes[veh.id] = baseline;
        StorageService.saveTune(baseline);
        tunesUpdated = true;
      }
    });

    if (tunesUpdated) {
      setTunes(updatedTunes);
    } else {
      setTunes(loadedTunes);
    }

    if (activeVeh) {
      setActiveVehicleId(activeVeh.id);
      const hist = StorageService.getHistoryForVehicle(activeVeh.id);
      setHistoryItems(hist);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Sync history when active vehicle changes
  useEffect(() => {
    if (activeVehicleId) {
      const hist = StorageService.getHistoryForVehicle(activeVehicleId);
      setHistoryItems(hist);
    }
  }, [activeVehicleId]);

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || vehicles[0] || null;
  const activeTune = activeVehicle ? tunes[activeVehicle.id] || null : null;

  // Handler: Select Vehicle
  const handleSelectVehicle = (id: string) => {
    setActiveVehicleId(id);
    const v = vehicles.find((veh) => veh.id === id);
    if (v && !tunes[id]) {
      const baseline = generateBaselineTune(v, v.currentDiscipline || 'ROAD RACING');
      setTunes((prev) => ({ ...prev, [id]: baseline }));
      StorageService.saveTune(baseline);
    }
  };

  // Handler: Update Tune (and save to storage)
  const handleUpdateTune = (updatedTune: Tune) => {
    setTunes((prev) => ({
      ...prev,
      [updatedTune.vehicleId]: updatedTune,
    }));
    StorageService.saveTune(updatedTune);
  };

  // Handler: Save as New Version in History
  const handleSaveNewVersion = (tuneToSave: Tune, versionName: string, notes: string) => {
    const nextVer = Number((tuneToSave.version + 0.1).toFixed(1));
    const paramSnapshots: Record<string, number> = {};
    Object.keys(tuneToSave.parameters).forEach((k) => {
      paramSnapshots[k] = tuneToSave.parameters[k].value;
    });

    const historyItem: TuneVersionHistoryItem = {
      id: `ver-${Date.now()}`,
      tuneId: tuneToSave.id,
      vehicleId: tuneToSave.vehicleId,
      versionNumber: nextVer,
      versionName: versionName || `v${nextVer}`,
      date: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      engineeringReason: notes || 'Optimización dinámica en Tune Studio',
      balanceSnapshot: tuneToSave.balance,
      parameterSnapshots: paramSnapshots,
      changesSummary: [notes || 'Actualización de reglaje'],
    };

    StorageService.addHistoryItem(historyItem);
    setHistoryItems((prev) => [historyItem, ...prev]);

    // Also update tune versionTag
    const newTune: Tune = {
      ...tuneToSave,
      version: nextVer,
      versionTag: versionName || `v${nextVer}`,
      updatedAt: new Date().toISOString(),
    };
    handleUpdateTune(newTune);
  };

  // Handler: Revert to Version
  const handleRevertToVersion = (historyItem: TuneVersionHistoryItem) => {
    if (!activeTune) return;

    const restoredParams = { ...activeTune.parameters };
    Object.keys(historyItem.parameterSnapshots || {}).forEach((k) => {
      if (restoredParams[k]) {
        restoredParams[k] = {
          ...restoredParams[k],
          value: historyItem.parameterSnapshots[k],
        };
      }
    });

    const restoredTune: Tune = {
      ...activeTune,
      versionTag: `${historyItem.versionName} (Revertido)`,
      parameters: restoredParams,
      balance: historyItem.balanceSnapshot,
      updatedAt: new Date().toISOString(),
    };

    handleUpdateTune(restoredTune);
    setCurrentTab('tuner');
  };

  // Handler: Save or Create Vehicle
  const handleSaveVehicle = (veh: Vehicle) => {
    StorageService.saveVehicle(veh);
    const updatedVehicles = StorageService.getVehicles();
    setVehicles(updatedVehicles);
    setActiveVehicleId(veh.id);

    // Generate baseline for this vehicle if not exists
    if (!tunes[veh.id]) {
      const baseline = generateBaselineTune(veh, veh.currentDiscipline || 'ROAD RACING');
      handleUpdateTune(baseline);
    }
  };

  // Handler: Delete Vehicle
  const handleDeleteVehicle = (vehId: string) => {
    StorageService.deleteVehicle(vehId);
    const updatedVehicles = StorageService.getVehicles();
    setVehicles(updatedVehicles);
    if (activeVehicleId === vehId && updatedVehicles.length > 0) {
      setActiveVehicleId(updatedVehicles[0].id);
    }
  };

  // Quick fix from Trackside Modal
  const handleTracksideQuickFix = (paramKey: string, newValue: number) => {
    if (!activeTune) return;
    const updatedParams = { ...activeTune.parameters };
    if (updatedParams[paramKey]) {
      updatedParams[paramKey] = {
        ...updatedParams[paramKey],
        value: newValue,
      };
      const updatedTune: Tune = {
        ...activeTune,
        parameters: updatedParams,
        updatedAt: new Date().toISOString(),
      };
      handleUpdateTune(updatedTune);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Persistent Engineering Header */}
      <Header
        activeTab={currentTab}
        onTabChange={setCurrentTab}
        activeVehicle={activeVehicle}
        activeTune={activeTune}
        onOpenGemini={() => setIsGeminiOpen(true)}
        onOpenTrackside={() => setIsTracksideOpen(true)}
      />

      {/* Main App Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-16">
        {currentTab === 'garage' && (
          <GaragePage
            vehicles={vehicles}
            tunes={tunes}
            activeVehicleId={activeVehicleId}
            onSelectVehicle={handleSelectVehicle}
            onNavigateTab={setCurrentTab}
            onOpenCreateVehicleModal={() => setIsCreateVehicleOpen(true)}
          />
        )}

        {currentTab === 'vehicles' && (
          <VehiclesPage
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onSelectVehicle={handleSelectVehicle}
            onSaveVehicle={handleSaveVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onNavigateTab={setCurrentTab}
            isCreateModalOpen={isCreateVehicleOpen}
            setIsCreateModalOpen={setIsCreateVehicleOpen}
          />
        )}

        {currentTab === 'tuner' && activeVehicle && activeTune && (
          <TuneStudioPage
            vehicle={activeVehicle}
            tune={activeTune}
            onUpdateTune={handleUpdateTune}
            onSaveNewVersion={handleSaveNewVersion}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'test' && activeVehicle && activeTune && (
          <TestDiagnosisPage
            vehicle={activeVehicle}
            tune={activeTune}
            onUpdateTune={handleUpdateTune}
            onSaveNewVersion={handleSaveNewVersion}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'history' && activeVehicle && activeTune && (
          <HistoryPage
            vehicle={activeVehicle}
            currentTune={activeTune}
            historyItems={historyItems}
            onRevertToVersion={handleRevertToVersion}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'matrix' && <MatrixPage />}

        {currentTab === 'settings' && (
          <SettingsPage onDataReset={loadInitialData} />
        )}
      </main>

      {/* Global Drawers & Modals */}
      <GeminiDrawer
        isOpen={isGeminiOpen}
        onClose={() => setIsGeminiOpen(false)}
        activeVehicle={activeVehicle}
        activeTune={activeTune}
      />

      <TracksideModal
        isOpen={isTracksideOpen}
        onClose={() => setIsTracksideOpen(false)}
        activeVehicle={activeVehicle}
        activeTune={activeTune}
        onApplyQuickFix={handleTracksideQuickFix}
      />
    </div>
  );
}
