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
  // We use this key to force the FileUpload component to re-mount completely when we reset.
  const [uploadKey, setUploadKey] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setDashboardState(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load saved data", e);
    }
  }, []);

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

      setDashboardState(newState);
      
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        console.warn("Could not save to local storage (file might be too big)");
      }

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al procesar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Eliminamos window.confirm para que la acción sea inmediata
    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
        console.error(e);
    }
    setDashboardState(null);
    setUploadKey(prev => prev + 1); // Force re-mount of Upload component
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {!dashboardState ? (
        <FileUpload 
            key={uploadKey} // Force fresh state on reset
            onFileUpload={handleFileUpload} 
            isLoading={loading} 
        />
      ) : (
        <Dashboard state={dashboardState} onReset={handleReset} />
      )}
    </div>
  );
}