import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatCurrency, formatShortNumber } from '../utils/dataUtils';
import { ThemeMode } from '../types';

interface ChartProps {
    data: any[];
    mode: ThemeMode;
}

// Exact colors from the reference image Donut Chart
const CORP_COLORS = [
    '#111827', // Black/Dark Navy (Alto impacto)
    '#3b82f6', // Bright Blue
    '#64748b', // Slate 500
    '#94a3b8', // Slate 400
    '#cbd5e1'  // Slate 300
];

const OP_COLORS = ['#e0004d', '#f43f5e', '#ec4899', '#8b5cf6', '#6366f1'];

export const FinancialBarChart: React.FC<ChartProps> = ({ data, mode }) => {
  return (
    <div className="h-full w-full flex flex-col pt-2">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">Impacto por Unidad</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}} 
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
            />
            <YAxis 
                tickFormatter={formatShortNumber} 
                tick={{fontSize: 10, fill: '#64748b'}}
            />
            <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Monto']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                cursor={{fill: 'rgba(0,0,0,0.05)'}}
            />
            <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={35}>
                {data.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        // Specific rule: Negative (Income) is Green, Positive (Expense) is Red
                        fill={entry.value < 0 ? '#198754' : '#dc3545'} 
                    />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const FinancialDonutChart: React.FC<ChartProps> = ({ data, mode }) => {
    const colors = mode === 'corporate' ? CORP_COLORS : OP_COLORS;

    return (
        <div className="h-full w-full flex flex-col pt-2">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">Distribución por Tipo</h3>
           <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend 
                        layout="vertical" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="square"
                        wrapperStyle={{fontSize: '10px', paddingTop: '20px'}}
                        formatter={(value) => <span className="text-slate-600 ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
           </div>
        </div>
    );
};