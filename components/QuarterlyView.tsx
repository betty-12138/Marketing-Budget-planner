
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { Card } from './ui/Card';

interface Props {
  transactions: Transaction[];
  currentYear: number;
}

export const QuarterlyView: React.FC<Props> = ({ transactions, currentYear }) => {
  
  const quarterlyData = useMemo(() => {
    // Initialize Quarters
    const quarters = [
        { name: 'Q1 (Jan-Mar)', planned: 0, actual: 0, months: [0, 1, 2] },
        { name: 'Q2 (Apr-Jun)', planned: 0, actual: 0, months: [3, 4, 5] },
        { name: 'Q3 (Jul-Sep)', planned: 0, actual: 0, months: [6, 7, 8] },
        { name: 'Q4 (Oct-Dec)', planned: 0, actual: 0, months: [9, 10, 11] },
    ];

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === currentYear) {
        const month = tDate.getMonth();
        // Find which quarter this month belongs to
        const quarterIdx = quarters.findIndex(q => q.months.includes(month));
        
        if (quarterIdx !== -1) {
            if (t.type === TransactionType.PLANNED) {
                quarters[quarterIdx].planned += t.amount;
            } else {
                quarters[quarterIdx].actual += t.amount;
            }
        }
      }
    });

    return quarters;
  }, [transactions, currentYear]);

  return (
    <div className="space-y-8">
      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quarterlyData.map((q, idx) => {
            const variance = q.planned - q.actual;
            const percentUsed = q.planned > 0 ? (q.actual / q.planned) * 100 : 0;
            const isOverBudget = q.actual > q.planned;
            
            return (
                <Card key={idx} className="relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded text-sm">
                            {q.name.split(' ')[0]}
                        </div>
                        <span className={`text-xs font-bold ${isOverBudget ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {Math.round(percentUsed)}% Used
                        </span>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase">Budget</p>
                            <p className="text-lg font-bold text-slate-800">¥{q.planned.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase">Actual</p>
                            <p className={`text-lg font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-800'}`}>
                                ¥{q.actual.toLocaleString()}
                            </p>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                             <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Remaining</span>
                                <span className={`font-bold ${variance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    ¥{variance.toLocaleString()}
                                </span>
                             </div>
                        </div>
                    </div>
                </Card>
            );
        })}
      </div>

      {/* Main Quarterly Chart */}
      <Card title={`${currentYear} Quarterly Performance`}>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={quarterlyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barGap={10}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `¥${value/1000}k`} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="planned" name="Planned Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={40}>
                 <LabelList dataKey="planned" position="top" formatter={(val: number) => val > 0 ? `¥${(val/1000).toFixed(1)}k` : ''} style={{ fontSize: '12px', fill: '#64748b' }} />
              </Bar>
              <Bar dataKey="actual" name="Actual Spend" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40}>
                {quarterlyData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.actual > entry.planned ? '#f43f5e' : '#4f46e5'} />
                ))}
                <LabelList dataKey="actual" position="top" formatter={(val: number) => val > 0 ? `¥${(val/1000).toFixed(1)}k` : ''} style={{ fontSize: '12px', fill: '#4f46e5', fontWeight: 'bold' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
