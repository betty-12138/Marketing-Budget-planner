
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { Card } from './ui/Card';

interface Props {
  transactions: Transaction[];
  currentYear: number;
}

export const YearlyDashboard: React.FC<Props> = ({ transactions, currentYear }) => {
  
  // existing chart data logic
  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(currentYear, i, 1);
      return {
        name: d.toLocaleString('default', { month: 'short' }),
        fullDate: d.toISOString().slice(0, 7), // YYYY-MM
        planned: 0,
        actual: 0
      };
    });

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === currentYear) {
        const monthIndex = tDate.getMonth();
        if (t.type === TransactionType.PLANNED) {
          months[monthIndex].planned += t.amount;
        } else {
          months[monthIndex].actual += t.amount;
        }
      }
    });

    return months;
  }, [transactions, currentYear]);

  // Matrix Data Logic
  const matrixData = useMemo(() => {
      const categories = Array.from(new Set(transactions.map(t => t.category))).sort();
      const months = Array.from({ length: 12 }, (_, i) => i);
      
      return categories.map(cat => {
          const monthlyBudgets = months.map(m => {
              const total = transactions
                  .filter(t => t.type === TransactionType.PLANNED && t.category === cat)
                  .filter(t => {
                      const d = new Date(t.date);
                      return d.getFullYear() === currentYear && d.getMonth() === m;
                  })
                  .reduce((acc, curr) => acc + curr.amount, 0);
              return total;
          });
          const totalYear = monthlyBudgets.reduce((a,b) => a+b, 0);
          return { category: cat, months: monthlyBudgets, total: totalYear };
      });
  }, [transactions, currentYear]);

  const totalBudget = chartData.reduce((acc, curr) => acc + curr.planned, 0);
  const totalActual = chartData.reduce((acc, curr) => acc + curr.actual, 0);
  const percentUsed = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider">Annual Budget</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">${totalBudget.toLocaleString()}</p>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wider">Total Spent (YTD)</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">${totalActual.toLocaleString()}</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wider">Budget Utilization</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{percentUsed.toFixed(1)}%</p>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
            <div 
              className={`h-1.5 rounded-full ${percentUsed > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            ></div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card title={`${currentYear} Financial Overview`}>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="planned" name="Planned Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="actual" name="Actual Spend" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.actual > entry.planned ? '#f43f5e' : '#4f46e5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Planning Matrix Table */}
      <Card title="Yearly Budget Matrix (Planned)" className="overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="bg-slate-100 text-slate-600 uppercase text-xs tracking-wider">
                        <th className="p-3 font-semibold border-b border-slate-200 sticky left-0 bg-slate-100 z-10">Category</th>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                            <th key={m} className="p-3 font-semibold text-right border-b border-slate-200 min-w-[80px]">{m}</th>
                        ))}
                        <th className="p-3 font-bold text-right border-b border-slate-200 bg-slate-100 sticky right-0">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {matrixData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50">{row.category}</td>
                            {row.months.map((amt, idx) => (
                                <td key={idx} className={`p-3 text-right ${amt === 0 ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {amt > 0 ? amt.toLocaleString() : '-'}
                                </td>
                            ))}
                            <td className="p-3 text-right font-bold text-indigo-700 bg-slate-50 sticky right-0">
                                {row.total.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold text-slate-800">
                        <td className="p-3 sticky left-0 bg-slate-50">Grand Total</td>
                        {Array.from({length: 12}, (_, i) => {
                            const monthTotal = matrixData.reduce((acc, curr) => acc + curr.months[i], 0);
                            return (
                                <td key={i} className="p-3 text-right">{monthTotal.toLocaleString()}</td>
                            );
                        })}
                        <td className="p-3 text-right sticky right-0 bg-slate-100">{totalBudget.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};
