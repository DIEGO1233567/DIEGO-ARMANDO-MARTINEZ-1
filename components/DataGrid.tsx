import React, { useState } from 'react';
import { FinancialRow, ThemeMode } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/dataUtils';

interface DataGridProps {
  data: FinancialRow[];
  mode: ThemeMode;
  selectedSegment: string;
}

export const DataGrid: React.FC<DataGridProps> = ({ data, mode, selectedSegment }) => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  // Sort by Absolute Value Descending based on the ACTIVE column
  const sortedData = [...data].sort((a, b) => {
    const valA = selectedSegment === 'Todos' ? a.amount : (a.details[selectedSegment] || 0);
    const valB = selectedSegment === 'Todos' ? b.amount : (b.details[selectedSegment] || 0);
    return Math.abs(valB) - Math.abs(valA);
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const isCorp = mode === 'corporate';

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold tracking-wider w-[5%]">#</th>
              <th className="px-6 py-3 font-semibold tracking-wider w-[45%]">Concepto</th>
              <th className="px-6 py-3 font-semibold tracking-wider w-[10%]">Tipo</th>
              <th className="px-6 py-3 font-semibold tracking-wider w-[15%]">Segmento</th>
              <th className="px-6 py-3 font-semibold tracking-wider w-[5%] text-center">Impacto</th>
              <th className="px-6 py-3 font-semibold tracking-wider w-[20%] text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.map((row, idx) => {
               // Determine value to show based on filter
               const displayValue = selectedSegment === 'Todos' ? row.amount : (row.details[selectedSegment] || 0);

               // Corporate Pills vs Operative Text
               const isPositive = displayValue >= 0; // Gasto (Red)
               
               let amountHtml;
               if (isCorp) {
                   // Money Pills
                   const pillClass = isPositive 
                        ? 'bg-[#f8d7da] text-[#842029]' // Red/Pink
                        : 'bg-[#d1e7dd] text-[#0f5132]'; // Green
                   amountHtml = (
                       <span className={`inline-block px-3 py-1 rounded-2xl font-mono font-bold text-xs w-full text-right ${pillClass}`}>
                           {formatCurrency(displayValue)}
                       </span>
                   );
               } else {
                   // Text Colors
                   const textClass = isPositive ? 'text-[#dc3545]' : 'text-[#28a745]';
                   amountHtml = (
                       <span className={`font-bold ${textClass}`}>
                           {formatCurrency(displayValue)}
                       </span>
                   );
               }

               return (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-slate-400 text-xs">{(page - 1) * rowsPerPage + idx + 1}</td>
                    <td className="px-6 py-3 font-medium text-slate-700">{row.concept}</td>
                    <td className="px-6 py-3">
                        <span className="inline-block px-2 py-1 rounded border border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-sm whitespace-nowrap">
                            {row.type}
                        </span>
                    </td>
                    <td className="px-6 py-3"><span className="px-2 py-1 bg-[#e2e6ea] rounded text-xs text-black">{row.segment}</span></td>
                    <td className="px-6 py-3 text-center">
                        {row.impactType && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${row.impactType === 'BG' ? 'bg-[#17a2b8]' : 'bg-[#6c757d]'}`}>
                                {row.impactType}
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-3 text-right">{amountHtml}</td>
                  </tr>
               );
            })}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-white">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 text-slate-500"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Página {page} de {totalPages}
          </span>
          <button 
             onClick={() => setPage(p => Math.min(totalPages, p + 1))}
             disabled={page === totalPages}
             className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 text-slate-500"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};