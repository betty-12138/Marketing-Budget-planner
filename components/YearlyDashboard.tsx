
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Tooltip as RechartsTooltip } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { Card } from './ui/Card';

interface Props {
  transactions: Transaction[];
  currentYear: number;
}

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#ec4899', '#f97316'];

export const YearlyDashboard: React.FC<Props> = ({ transactions, currentYear }) => {
  
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

  // Aggregate Category Data for Pie Chart
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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider">Annual Budget</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">¥{totalBudget.toLocaleString()}</p>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wider">Total Spent (YTD)</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">¥{totalActual.toLocaleString()}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bar Chart */}
          <Card title={`${currentYear} Financial Overview`} className="lg:col-span-2">
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                  <Bar dataKey="planned" name="Planned Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20}>
                      <LabelList dataKey="planned" position="top" formatter={(val: number) => val > 0 ? `¥${(val/1000).toFixed(0)}k` : ''} style={{ fontSize: '10px', fill: '#64748b' }} />
                  </Bar>
                  <Bar dataKey="actual" name="Actual Spend" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.actual > entry.planned ? '#f43f5e' : '#4f46e5'} />
                    ))}
                    <LabelList dataKey="actual" position="top" formatter={(val: number) => val > 0 ? `¥${(val/1000).toFixed(0)}k` : ''} style={{ fontSize: '10px', fill: '#4f46e5', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pie Chart */}
          <Card title="Spend by Category">
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
