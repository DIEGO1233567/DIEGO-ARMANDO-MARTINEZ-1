import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onFileUpload(file);
      } else {
        setError('Por favor sube un archivo CSV válido.');
      }
    }
  }, [onFileUpload]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv')) {
         onFileUpload(file);
      } else {
        setError('Por favor sube un archivo CSV válido.');
      }
    }
  };

  const onContainerClick = () => {
      if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset value to allow selecting same file again
          fileInputRef.current.click();
      }
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-20 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Bienvenido a InsightDeck</h1>
        <p className="text-slate-500">Sube tu reporte mensual (CSV) para generar el dashboard ejecutivo.</p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onContainerClick}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 scale-102 shadow-xl' 
            : 'border-slate-300 bg-white hover:border-slate-400 hover:shadow-lg'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="hidden" // Hidden input, controlled by JS
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          ) : (
            <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
              <Upload size={32} />
            </div>
          )}
          
          <div>
            <p className="text-lg font-medium text-slate-700">
              {isLoading ? 'Analizando datos...' : 'Arrastra tu archivo aquí'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              o haz click para explorar
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center justify-center text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}

      <div className="mt-12 grid grid-cols-3 gap-4 text-center text-xs text-slate-400">
        <div className="flex flex-col items-center">
          <div className="mb-2 p-2 bg-slate-100 rounded-full"><FileText size={16}/></div>
          <span>Soporta CSV</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="mb-2 p-2 bg-slate-100 rounded-full"><CheckCircle size={16}/></div>
          <span>Análisis Automático</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="mb-2 p-2 bg-slate-100 rounded-full"><Upload size={16}/></div>
          <span>100% Seguro</span>
        </div>
      </div>
    </div>
  );
};