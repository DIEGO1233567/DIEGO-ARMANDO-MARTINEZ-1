import React, { useMemo, useState } from 'react';
import { DashboardState, ThemeMode } from '../types';
import { KPICard } from './KPICard';
import { FinancialBarChart, FinancialDonutChart } from './Charts'; 
import { DataGrid } from './DataGrid';
import { RefreshCw, Filter, Menu, AlertCircle } from 'lucide-react';

interface DashboardProps {
  state: DashboardState;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onReset }) => {
  const { data, segments, types } = state;
  const [mode, setMode] = useState<ThemeMode>('operative');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Filters
  const [selectedSegment, setSelectedSegment] = useState<string>('Todos');
  const [selectedType, setSelectedType] = useState<string>('Todos');

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    return data.filter(row => {
      // Type Filter
      const matchType = selectedType === 'Todos' || row.type === selectedType;
      
      // Division Filter
      let matchSegment = true;
      if (selectedSegment !== 'Todos') {
          matchSegment = Math.abs(row.details[selectedSegment] || 0) > 0.001;
      }
      
      return matchSegment && matchType;
    });
  }, [data, selectedSegment, selectedType]);

  // --- KPI Calculations ---
  const kpis = useMemo(() => {
    let total = 0;
    let income = 0;
    let expense = 0;
    
    // Aggregate by Unit for Chart
    const unitTotals: Record<string, number> = {};
    segments.forEach(s => unitTotals[s] = 0);

    filteredData.forEach(row => {
      const val = selectedSegment === 'Todos' ? row.amount : (row.details[selectedSegment] || 0);
      
      total += val;
      if (val < 0) income += val;
      else expense += val;

      if (selectedSegment === 'Todos') {
          segments.forEach(seg => {
              unitTotals[seg] = (unitTotals[seg] || 0) + (row.details[seg] || 0);
          });
      } else {
          unitTotals[selectedSegment] = (unitTotals[selectedSegment] || 0) + val;
      }
    });

    return { total, income, expense, count: filteredData.length, unitTotals };
  }, [filteredData, selectedSegment, segments]);

  // --- Chart Data ---
  const segmentChartData = useMemo(() => {
     if (selectedSegment !== 'Todos') {
         return [{ name: selectedSegment, value: kpis.unitTotals[selectedSegment] || 0 }];
     }
     
     return Object.entries(kpis.unitTotals)
        .filter(([_, val]) => Math.abs(val as number) > 0.1)
        .map(([name, value]) => ({ name, value: value as number }));
  }, [kpis.unitTotals, selectedSegment]);

  const typeChartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.forEach(row => {
        grouped[row.type] = (grouped[row.type] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // --- Theme Styles ---
  const bgMain = mode === 'corporate' ? 'bg-[#f0f2f5]' : 'bg-[#f4f6f9]';
  
  // Header Styles EXACT MATCH TO IMAGE
  const headerClasses = mode === 'corporate' 
    ? 'bg-[#003366] text-white border-b-[3px] border-[#FFC107]' // Navy + Yellow Border
    : 'bg-white text-[#2c3e50] border-b-4 border-[#e0004d]';
  
  const sidebarBg = 'bg-white text-slate-600';
  const sidebarBorder = mode === 'corporate' ? 'border-t-[4px] border-[#003366]' : '';

  return (
    <div className={`min-h-screen flex flex-col ${bgMain} transition-colors duration-500`}>
      
      {/* HEADER */}
      <header className={`${headerClasses} sticky top-0 z-40 shadow-lg h-20 transition-colors duration-300`}>
        <div className="px-6 h-full flex items-center justify-between">
            <div className="flex items-center">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="mr-4 lg:hidden">
                    <Menu size={24} />
                </button>
                <div className="flex flex-col justify-center">
                    <h1 className="text-2xl font-bold leading-none">
                        Cierre Financiero <span className={mode === 'corporate' ? 'text-white' : 'text-[#2c3e50]'}>2025</span>
                    </h1>
                    <span className="text-sm opacity-80 font-light mt-1">Estado de Resultados</span>
                </div>
            </div>
            
            <div className="flex items-center space-x-3">
                {/* View Switch Pill */}
                <div className={`flex items-center p-1 rounded-full ${mode === 'corporate' ? 'bg-[#002b4d]' : 'bg-slate-100'}`}>
                    <button 
                        onClick={() => setMode('operative')}
                        className={`px-4 py-1.5 text-xs rounded-full font-bold transition-all ${mode === 'operative' ? 'bg-[#e0004d] text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Operativo
                    </button>
                    <button 
                        onClick={() => setMode('corporate')}
                        className={`px-4 py-1.5 text-xs rounded-full font-bold transition-all ${mode === 'corporate' ? 'bg-[#FFC107] text-[#003366] shadow' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Corporativo
                    </button>
                </div>

                {/* Reset Button */}
                <button 
                    onClick={onReset}
                    className="flex items-center px-4 py-2 bg-[#6c757d] text-white text-xs font-bold rounded hover:bg-slate-600 transition-colors shadow-sm ml-4"
                >
                    <RefreshCw size={14} className="mr-2" /> Nuevo Archivo
                </button>
            </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative max-w-[1600px] mx-auto w-full pt-6 px-6">
        {/* SIDEBAR */}
        <aside className={`${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full hidden'} fixed lg:relative z-30 h-fit rounded-lg shadow-sm transition-all duration-300 ${sidebarBg} ${sidebarBorder} flex flex-col mb-8 lg:mb-0 lg:mr-6`}>
             <div className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-90 flex items-center mb-4 text-slate-800">
                    <Filter size={14} className="mr-2" /> Filtros
                </h3>
                <hr className="border-slate-200 mb-5"/>

                <div className="mb-5">
                    <label className="block text-sm font-bold text-slate-700 mb-2">División de Negocio</label>
                    <select 
                        value={selectedSegment} 
                        onChange={(e) => setSelectedSegment(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                        disabled={segments.length === 0}
                    >
                        <option value="Todos">Consolidado (Total)</option>
                        {segments.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo</label>
                    <select 
                        value={selectedType} 
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                        disabled={types.length === 0}
                    >
                        <option value="Todos">Todos</option>
                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <button 
                    onClick={() => { setSelectedSegment('Todos'); setSelectedType('Todos'); }}
                    className={`w-full py-2.5 rounded border border-current text-sm font-bold flex items-center justify-center transition-colors mb-6 ${mode === 'corporate' ? 'text-[#003366] hover:bg-slate-100' : 'text-[#e0004d] hover:bg-red-50'}`}
                >
                    <RefreshCw size={14} className="mr-2" /> Restablecer Filtros
                </button>

                {/* Control Figures Box */}
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs text-slate-600">
                    <strong className="block mb-1 text-slate-800">Cifras Control (Metas):</strong>
                    <div className="flex flex-col space-y-1">
                        <span>Total: -630 MDP</span>
                        <span>LIV: -773 | SBB: -178</span>
                    </div>
                </div>
             </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
            
            {/* KPI Grid - MATCHED TO IMAGE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                {/* Total: Navy Border */}
                <KPICard title="Total Filtrado" value={kpis.total} type="currency" mode={mode} variant="total" />
                {/* Partidas: Gray Border */}
                <KPICard title="Partidas" value={kpis.count} type="number" mode={mode} variant="count" />
                {/* Ingresos: Green Border */}
                <KPICard title="Ingresos (-)" value={kpis.income} type="currency" mode={mode} variant="income" />
                {/* Gastos: Red Border */}
                <KPICard title="Gastos (+)" value={kpis.expense} type="currency" mode={mode} variant="expense" />
            </div>

            {filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                    <AlertCircle size={48} className="mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold">
                        {segments.length === 0 ? "No se detectaron columnas de negocio en el archivo." : "No hay datos que coincidan con los filtros"}
                    </h3>
                </div>
            ) : (
                <>
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-100 h-[400px]">
                            <FinancialBarChart data={segmentChartData} mode={mode} />
                        </div>

                         <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 h-[400px]">
                            <FinancialDonutChart data={typeChartData} mode={mode} />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                         <div className={`px-6 py-4 flex justify-between items-center ${mode === 'corporate' ? 'bg-[#003366] text-white' : 'bg-slate-50 border-b border-slate-200'}`}>
                            <h3 className="font-bold">Detalle de Partidas</h3>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${mode === 'corporate' ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>
                                {selectedSegment === 'Todos' ? 'CONSOLIDADO' : selectedSegment.toUpperCase()}
                            </span>
                        </div>
                        <DataGrid data={filteredData} mode={mode} selectedSegment={selectedSegment} />
                    </div>
                </>
            )}
        </main>
      </div>
    </div>
  );
};