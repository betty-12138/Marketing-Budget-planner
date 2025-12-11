
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Plus, Trash2, Tag, AlertCircle, FileText, Search, Edit2, Filter } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { ExpenseForm } from './ExpenseForm';

interface Props {
  categories: string[];
  transactions: Transaction[];
  onAddCategory: (cat: string) => void;
  onRemoveCategory: (cat: string) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

type Tab = 'CATEGORIES' | 'TRANSACTIONS';

export const SettingsView: React.FC<Props> = ({ 
    categories, 
    transactions, 
    onAddCategory, 
    onRemoveCategory, 
    onUpdateTransaction,
    onDeleteTransaction
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('CATEGORIES');
  const [newCategory, setNewCategory] = useState('');
  
  // Transaction Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by newest first

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <ExpenseForm 
                    onAdd={() => {}} // Not used for update
                    onUpdate={(updatedData) => {
                        onUpdateTransaction({ ...editingTransaction, ...updatedData });
                        setEditingTransaction(null);
                    }}
                    categories={categories}
                    initialType={editingTransaction.type}
                    initialData={editingTransaction}
                    onClose={() => setEditingTransaction(null)}
                />
            </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'CATEGORIES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
              <Tag size={18} /> Manage Categories
          </button>
          <button 
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'TRANSACTIONS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
              <FileText size={18} /> All Transactions
          </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'CATEGORIES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <Card title="Add New Category">
                <form onSubmit={handleAddCategory} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                        <input 
                            type="text" 
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="e.g., Influencer Marketing"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={!newCategory.trim()}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Add Category
                    </button>
                </form>
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100 flex gap-3 text-sm text-slate-600">
                    <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                    <p>New categories will immediately be available in the 'Add Expense' form and the Monthly Dashboard.</p>
                </div>
            </Card>

            <Card title={`Active Categories (${categories.length})`}>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg group hover:bg-white hover:border-indigo-100 transition-all">
                            <span className="font-medium text-slate-700">{cat}</span>
                            <button 
                                onClick={() => onRemoveCategory(cat)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                                title="Remove Category"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </Card>
          </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'TRANSACTIONS' && (
          <div className="animate-fade-in space-y-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search transactions..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                      Showing {filteredTransactions.length} records
                  </div>
              </div>

              <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                              <tr>
                                  <th className="px-4 py-3">Date</th>
                                  <th className="px-4 py-3">Type</th>
                                  <th className="px-4 py-3">Category</th>
                                  <th className="px-4 py-3">Description</th>
                                  <th className="px-4 py-3 text-right">Amount</th>
                                  <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredTransactions.map(t => (
                                  <tr key={t.id} className="hover:bg-slate-50 group">
                                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.date}</td>
                                      <td className="px-4 py-3">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === TransactionType.PLANNED ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                              {t.type === TransactionType.PLANNED ? 'BUDGET' : 'EXPENSE'}
                                          </span>
                                      </td>
                                      <td className="px-4 py-3 text-slate-700">{t.category}</td>
                                      <td className="px-4 py-3 text-slate-800 font-medium">{t.description}</td>
                                      <td className="px-4 py-3 text-right font-bold text-slate-700">${t.amount.toLocaleString()}</td>
                                      <td className="px-4 py-3 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                              <button 
                                                  onClick={() => setEditingTransaction(t)}
                                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                  title="Edit"
                                              >
                                                  <Edit2 size={16} />
                                              </button>
                                              <button 
                                                  onClick={() => {
                                                      if(window.confirm('Are you sure you want to delete this transaction?')) {
                                                          onDeleteTransaction(t.id);
                                                      }
                                                  }}
                                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                  title="Delete"
                                              >
                                                  <Trash2 size={16} />
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                              {filteredTransactions.length === 0 && (
                                  <tr>
                                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400 italic">
                                          No transactions found matching your search.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
