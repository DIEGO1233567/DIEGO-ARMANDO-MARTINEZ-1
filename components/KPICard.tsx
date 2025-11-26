import React from 'react';
import { formatCurrency } from '../utils/dataUtils';
import { ThemeMode } from '../types';

interface KPICardProps {
  title: string;
  value: number;
  type: 'currency' | 'number';
  mode: ThemeMode;
  variant?: 'total' | 'count' | 'income' | 'expense'; // Explicit variant for styling
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, type, mode, variant = 'total' }) => {
  const formattedValue = type === 'currency' ? formatCurrency(value) : value;

  // --- CORPORATE MODE STYLES (Based on Image) ---
  // White card, Shadow, Colored Top Border
  
  let topBorderColor = 'border-slate-200';
  let valueColor = 'text-slate-800';

  if (mode === 'corporate') {
      switch (variant) {
          case 'total':
              topBorderColor = 'border-[#003366]'; // Navy
              valueColor = 'text-[#003366]';
              break;
          case 'count':
              topBorderColor = 'border-slate-400'; // Gray
              valueColor = 'text-slate-700';
              break;
          case 'income':
              topBorderColor = 'border-[#198754]'; // Green
              valueColor = 'text-[#198754]';
              break;
          case 'expense':
              topBorderColor = 'border-[#dc3545]'; // Red
              valueColor = 'text-[#dc3545]';
              break;
      }
  } else {
      // Operative Mode (Legacy logic or Standard)
      if (type === 'currency' && value !== 0) {
        valueColor = value < 0 ? 'text-emerald-600' : 'text-red-600';
      }
  }

  // Base Card Styles
  const cardClasses = mode === 'corporate'
    ? `bg-white border-t-4 ${topBorderColor} shadow-md`
    : 'bg-white border border-slate-200 shadow-sm';

  const labelClasses = mode === 'corporate'
    ? 'text-slate-400 uppercase tracking-widest text-[10px] font-semibold'
    : 'text-slate-500 uppercase tracking-wide text-xs font-bold';

  const valueClasses = `text-3xl font-bold mt-1 ${valueColor}`;

  return (
    <div className={`rounded-lg p-5 transition-all duration-300 h-full flex flex-col justify-center ${cardClasses}`}>
      <p className={labelClasses}>{title}</p>
      <h3 className={valueClasses}>
        {formattedValue}
      </h3>
      {mode === 'corporate' && type === 'currency' && (
          <span className="text-[10px] text-slate-400 font-medium mt-1">MXN</span>
      )}
    </div>
  );
};