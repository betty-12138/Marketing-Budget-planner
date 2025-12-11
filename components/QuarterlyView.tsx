
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell, PieChart, Pie, Tooltip as RechartsTooltip } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { Card } from './ui/Card';

interface Props {
  transactions: Transaction[];
  currentYear: number;
}

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#ec4899', '#f97316'];

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

  // Aggregate Category Data for Pie Chart (Full Year context)
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate.getFullYear() === currentYear && t.type === TransactionType.ACTUAL) {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        }
    });
    return Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [transactions, currentYear]);

  // Custom Label Renderer for Pie Chart
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, value } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';

    // Only render label if the slice is significant enough (e.g. > 2%)
    if (percent < 0.02) return null;

    return (
      <g>
         <path d={`M${cx + outerRadius * Math.cos(-midAngle * RADIAN)},${cy + outerRadius * Math.sin(-midAngle * RADIAN)}L${x},${y}`} stroke={COLORS[index % COLORS.length]} fill="none" opacity={0.6} />
         <text x={x + (x > cx ? 5 : -5)} y={y} textAnchor={textAnchor} dominantBaseline="central">
            <tspan x={x + (x > cx ? 5 : -5)} dy="-0.6em" fill="#1e293b" fontSize="12" fontWeight="bold">{`${(percent * 100).toFixed(1)}%`}</tspan>
            <tspan x={x + (x > cx ? 5 : -5)} dy="1.4em" fill="#64748b" fontSize="11">{`¥${value.toLocaleString()}`}</tspan>
         </text>
      </g>
    );
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quarterly Chart */}
          <Card title={`${currentYear} Quarterly Performance`} className="lg:col-span-2">
            <div className="h-[450px] w-full">
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

           {/* Pie Chart */}
           <Card title={`${currentYear} Spend by Category`}>
              <div className="h-[450px] w-full flex flex-col items-center justify-center">
                  {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={categoryData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                  nameKey="name"
                                  label={renderCustomizedLabel}
                                  labelLine={false}
                              >
                                  {categoryData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <RechartsTooltip 
                                  formatter={(value: number) => `¥${value.toLocaleString()}`}
                                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              />
                              <Legend verticalAlign="bottom" height={100} iconType="circle" wrapperStyle={{ overflowY: 'auto' }} />
                          </PieChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="text-slate-400 text-sm">No expenses recorded for this year.</div>
                  )}
              </div>
          </Card>
      </div>
    </div>
  );
};
