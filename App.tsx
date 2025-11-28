import React, { useState, useEffect } from 'react';
import { DashboardState } from './types';
import { parseFinancialCSV } from './utils/dataUtils';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { format } from 'date-fns';

const LOCAL_STORAGE_KEY = 'financial_dashboard_v2';

export default function App() {
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [uploadKey, setUploadKey] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Simple validation check
          if (parsed && Array.isArray(parsed.data)) {
             setDashboardState(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to load saved data", e);
      } finally {
        // Delay slightly to prevent flash if loading is instant
        setTimeout(() => setIsInitializing(false), 100);
      }
    };
    loadData();
  }, []);

  // Helper to strip unnecessary data before saving to fit in LocalStorage
  const minifyState = (state: DashboardState): DashboardState => {
      return {
          ...state,
          data: state.data.map(row => {
              // Create a copy without originalRow to save massive space (~60-70% reduction)
              const { originalRow, ...rest } = row; 
              
              // Sparse matrix compression for details (remove zeros)
              const compressedDetails: Record<string, number> = {};
              for (const [key, val] of Object.entries(rest.details)) {
                  if (val !== 0) compressedDetails[key] = val;
              }

              return { ...rest, details: compressedDetails };
          })
      };
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const { data, segments, types } = await parseFinancialCSV(file);
      
      const newState: DashboardState = {
        data,
        segments,
        types,
        isLoaded: true,
        datasetName: file.name.replace('.csv', ''),
        lastUpdated: format(new Date(), "dd 'de' MMM, yyyy HH:mm"),
      };

      // Just set state, DO NOT save to local storage automatically
      setDashboardState(newState);
      
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al procesar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = () => {
    if (!dashboardState) return;

    try {
        const optimizedState = minifyState(dashboardState);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(optimizedState));
        alert("¡Dashboard guardado exitosamente! Esta versión será la predeterminada para todos los usuarios.");
    } catch (e: any) {
        console.warn("Storage error:", e);
        if (e.name === 'QuotaExceededError') {
             alert("El archivo es demasiado grande para guardarse en la memoria del navegador.");
        } else {
             alert("Error al guardar el dashboard.");
        }
    }
  };

  const handleReset = () => {
    // We do NOT remove the item from local storage. 
    // We just clear the current view state to allow uploading a new file.
    // If the user refreshes without saving, they will see the old dashboard.
    setDashboardState(null);
    setUploadKey(prev => prev + 1);
  };

  if (isInitializing) {
      // White screen or minimal loader while checking storage to prevent flash of content
      return <div className="min-h-screen bg-slate-50"></div>; 
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {!dashboardState ? (
        <FileUpload 
            key={uploadKey} 
            onFileUpload={handleFileUpload} 
            isLoading={loading} 
        />
      ) : (
        <Dashboard 
            state={dashboardState} 
            onReset={handleReset} 
            onSave={handleManualSave}
        />
      )}
    </div>
  );
}