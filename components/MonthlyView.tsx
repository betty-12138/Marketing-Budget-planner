
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Transaction, TransactionType, AIAnalysisResult, CategorySummary, MonthlySummary, User } from '../types';
import { Card } from './ui/Card';
import { analyzeBudget } from '../services/geminiService';
import { Sparkles, Edit2, Trash2 } from 'lucide-react';
import { ExpenseForm } from './ExpenseForm';

interface Props {
  currentUser: User;
  transactions: Transaction[];
  currentDate: Date;
  availableCategories: string[];
  onAddTransaction: (t: Omit<Transaction, 'id'> | Omit<Transaction, 'id'>[]) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#ec4899', '#f97316'];

export const MonthlyView: React.FC<Props> = ({ 
    currentUser,
    transactions, 
    currentDate, 
    availableCategories, 
    onAddTransaction,
    onUpdateTransaction,
    onDeleteTransaction
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult>({ summary: '', recommendations: [], status: 'idle' });
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Permissions
  const canEditBudget = currentUser.role === 'ADMIN' || currentUser.permissions.canEditBudget;
  const canManageTransactions = currentUser.role === 'ADMIN' || currentUser.permissions.canManageTransactions;

  // Filter transactions for the current month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  }, [transactions, currentDate]);

  const categoryData = useMemo(() => {
    const data: CategorySummary[] = availableCategories.map(cat => ({
      category: cat,
      planned: 0,
      actual: 0
    }));

    monthlyTransactions.forEach(t => {
      const idx = data.findIndex(d => d.category === t.category);
      if (idx !== -1) {
        if (t.type === TransactionType.PLANNED) {
          data[idx].planned += t.amount;
        } else {
          data[idx].actual += t.amount;
        }
      }
    });

    return data.sort((a, b) => (b.actual + b.planned) - (a.actual + a.planned));
  }, [monthlyTransactions, availableCategories]);

  const totals: MonthlySummary = useMemo(() => {
      const planned = categoryData.reduce((acc, curr) => acc + curr.planned, 0);
      const actual = categoryData.reduce((acc, curr) => acc + curr.actual, 0);
      return {
          month: currentDate.toISOString().slice(0, 7),
          planned,
          actual,
          variance: planned - actual
      };
  }, [categoryData, currentDate]);

  const handleRunAnalysis = async () => {
    setAiAnalysis(prev => ({ ...prev, status: 'loading' }));
    const result = await analyzeBudget(
        currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        totals,
        categoryData,
        monthlyTransactions.filter(t => t.type === TransactionType.ACTUAL)
    );
    setAiAnalysis({ ...result, status: 'success' });
  };

  return (
    <div className="space-y-6">
      
      {/* Budget Edit Modal */}
      {editingBudgetCategory && canEditBudget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <ExpenseForm 
                    currentUser={currentUser}
                    onAdd={(t) => {
                        onAddTransaction(t);
                        setEditingBudgetCategory(null);
                    }}
                    categories={availableCategories}
                    initialType={TransactionType.PLANNED}
                    initialCategory={editingBudgetCategory}
                    initialDate={currentDate}
                    onClose={() => setEditingBudgetCategory(null)}
                />
            </div>
        </div>
      )}

      {/* Transaction Edit Modal */}
      {editingTransaction && canManageTransactions && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <ExpenseForm 
                    currentUser={currentUser}
                    onAdd={() => {}}
                    onUpdate={(t) => {
                        onUpdateTransaction({ ...editingTransaction, ...t });
                        setEditingTransaction(null);
                    }}
                    categories={availableCategories}
                    initialType={editingTransaction.type}
                    initialData={editingTransaction}
                    onClose={() => setEditingTransaction(null)}
                />
            </div>
        </div>
      )}

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-sm">Monthly Budget</span>
                <div className="text-2xl font-bold text-slate-800">¥{totals.planned.toLocaleString()}</div>
             </div>
             <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-sm">Actual Spend</span>
                <div className={`text-2xl font-bold ${totals.actual > totals.planned ? 'text-rose-600' : 'text-slate-800'}`}>
                    ¥{totals.actual.toLocaleString()}
                </div>
             </div>
             <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-sm">Remaining</span>
                <div className={`text-2xl font-bold ${totals.variance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ¥{totals.variance.toLocaleString()}
                </div>
             </div>
        </div>
        <div className="md:col-span-1">
             <button 
                onClick={handleRunAnalysis}
                disabled={aiAnalysis.status === 'loading'}
                className="w-full h-full min-h-[80px] bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center p-4 disabled:opacity-70"
            >
                <Sparkles className={`w-6 h-6 mb-1 ${aiAnalysis.status === 'loading' ? 'animate-spin' : ''}`} />
                <span className="font-medium text-sm">
                    {aiAnalysis.status === 'loading' ? 'Analyzing...' : 'AI Insights'}
                </span>
            </button>
        </div>
      </div>

      {/* AI Panel */}
      {aiAnalysis.status === 'success' && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 animate-fade-in">
              <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Sparkles size={20} />
                  </div>
                  <div>
                      <h4 className="font-semibold text-indigo-900 mb-1">Budget Intelligence</h4>
                      <p className="text-indigo-800 text-sm mb-3">{aiAnalysis.summary}</p>
                      <ul className="space-y-1">
                          {aiAnalysis.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-indigo-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                  {rec}
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Table */}
        <Card title="Category Breakdown" className="lg:col-span-2">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                        <tr>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 text-right">Budget</th>
                            <th className="px-4 py-3 text-right">Actual</th>
                            <th className="px-4 py-3 text-right">Status</th>
                            {canEditBudget && <th className="px-4 py-3 w-10"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {categoryData.map((cat, i) => {
                            const percent = cat.planned > 0 ? (cat.actual / cat.planned) * 100 : 0;
                            const isOver = cat.actual > cat.planned;
                            return (
                                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-3 font-medium text-slate-700">{cat.category}</td>
                                    <td className="px-4 py-3 text-right text-slate-500">
                                        ¥{cat.planned.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-900">¥{cat.actual.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-24 bg-slate-200 rounded-full h-1.5">
                                                <div 
                                                    className={`h-1.5 rounded-full ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-bold ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {Math.round(percent)}%
                                            </span>
                                        </div>
                                    </td>
                                    {canEditBudget && (
                                        <td className="px-2 py-3 text-right">
                                            <button 
                                                onClick={() => setEditingBudgetCategory(cat.category)}
                                                className="text-slate-300 hover:text-indigo-600 p-1 rounded transition-colors"
                                                title="Adjust Budget"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>

        {/* Chart */}
        <Card title="Spend Distribution">
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryData.filter(c => c.actual > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="actual"
                            nameKey="category"
                        >
                            {categoryData.filter(c => c.actual > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip 
                             formatter={(value: number) => `¥${value.toLocaleString()}`}
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>
      
      {/* Transaction List */}
      <Card title="Recent Transactions">
          <div className="overflow-x-auto">
              <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <tr>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Description</th>
                          <th className="px-4 py-3 text-left">User</th>
                          <th className="px-4 py-3 text-left">Category</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          {canManageTransactions && <th className="px-4 py-3 text-right">Actions</th>}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {monthlyTransactions
                        .filter(t => t.type === TransactionType.ACTUAL)
                        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(t => (
                          <tr key={t.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{t.date}</td>
                              <td className="px-4 py-3 text-slate-900 font-medium">{t.description}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{t.createdBy}</td>
                              <td className="px-4 py-3">
                                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                                      {t.category}
                                  </span>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-900">¥{t.amount.toLocaleString()}</td>
                              {canManageTransactions && (
                                  <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                          <button 
                                            onClick={() => setEditingTransaction(t)}
                                            className="p-1 text-slate-400 hover:text-indigo-600"
                                          >
                                              <Edit2 size={14} />
                                          </button>
                                          <button 
                                            onClick={() => {
                                                if (window.confirm('Delete this transaction?')) {
                                                    onDeleteTransaction(t.id);
                                                }
                                            }}
                                            className="p-1 text-slate-400 hover:text-rose-600"
                                          >
                                              <Trash2 size={14} />
                                          </button>
                                      </div>
                                  </td>
                              )}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </Card>
    </div>
  );
};
