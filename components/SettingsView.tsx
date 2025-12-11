
import React, { useState, useRef } from 'react';
import { Card } from './ui/Card';
import { Plus, Trash2, Tag, AlertCircle, FileText, Search, Edit2, Users, Shield, CheckCircle, Upload, Save, X } from 'lucide-react';
import { Transaction, TransactionType, User } from '../types';
import { ExpenseForm } from './ExpenseForm';

declare const XLSX: any; // Global definition for SheetJS

interface Props {
  currentUser: User;
  users: User[];
  onUpdateUserPermissions: (userId: string, permissions: User['permissions']) => void;
  categories: string[];
  transactions: Transaction[];
  onAddCategory: (cat: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onRemoveCategory: (cat: string) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onImportTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
}

type Tab = 'CATEGORIES' | 'TRANSACTIONS' | 'USERS';

export const SettingsView: React.FC<Props> = ({ 
    currentUser,
    users,
    onUpdateUserPermissions,
    categories, 
    transactions, 
    onAddCategory, 
    onRenameCategory,
    onRemoveCategory, 
    onUpdateTransaction,
    onDeleteTransaction,
    onBulkDelete,
    onImportTransactions
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(currentUser.role === 'ADMIN' ? 'USERS' : 'CATEGORIES');
  const [newCategory, setNewCategory] = useState('');
  const [renameData, setRenameData] = useState<{ oldName: string, newName: string } | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  // Permissions
  const canEditCategory = currentUser.role === 'ADMIN' || currentUser.permissions.canEditCategory;
  const canManageTransactions = currentUser.role === 'ADMIN' || currentUser.permissions.canManageTransactions;
  const canManageUsers = currentUser.role === 'ADMIN';

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const saveRenameCategory = () => {
      if (renameData && renameData.newName.trim() && renameData.newName !== renameData.oldName) {
          onRenameCategory(renameData.oldName, renameData.newName.trim());
          setRenameData(null);
      }
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 

  const togglePermission = (user: User, key: keyof User['permissions']) => {
      onUpdateUserPermissions(user.id, {
          ...user.permissions,
          [key]: !user.permissions[key]
      });
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedTransactionIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedTransactionIds(newSet);
  };

  const toggleAllSelection = () => {
      if (selectedTransactionIds.size === filteredTransactions.length) {
          setSelectedTransactionIds(new Set());
      } else {
          setSelectedTransactionIds(new Set(filteredTransactions.map(t => t.id)));
      }
  };

  const handleBulkDelete = () => {
      if (window.confirm(`Are you sure you want to delete ${selectedTransactionIds.size} transactions?`)) {
          onBulkDelete(Array.from(selectedTransactionIds));
          setSelectedTransactionIds(new Set());
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws);

              // Basic parsing logic - expects headers roughly matching: Date, Category, Amount, Description, Type
              const parsedTransactions: Omit<Transaction, 'id'>[] = [];
              
              data.forEach((row: any) => {
                  // Attempt to find fields regardless of case
                  const date = row['Date'] || row['date'];
                  const amount = row['Amount'] || row['amount'];
                  const category = row['Category'] || row['category'];
                  const description = row['Description'] || row['description'] || 'Imported Transaction';
                  const type = (row['Type'] || row['type'] || 'ACTUAL').toUpperCase();

                  if (date && amount && category) {
                      // Normalize Date (Assume Excel might give serial, but usually CSV/Json gives string if not formatted)
                      // Simple check for now, can be expanded for robustness
                      let dateStr = date;
                      if (typeof date === 'number') {
                          // Excel serial date to JS Date
                          const jsDate = new Date(Math.round((date - 25569)*86400*1000));
                          dateStr = jsDate.toISOString().split('T')[0];
                      }

                      parsedTransactions.push({
                          date: dateStr,
                          amount: Number(amount),
                          category: String(category),
                          description: String(description),
                          type: type === 'PLANNED' || type === 'BUDGET' ? TransactionType.PLANNED : TransactionType.ACTUAL,
                          createdBy: currentUser.name + ' (Import)'
                      });
                  }
              });

              if (parsedTransactions.length > 0) {
                  onImportTransactions(parsedTransactions);
                  setImportStatus(`Successfully imported ${parsedTransactions.length} items.`);
                  setTimeout(() => setImportStatus(''), 3000);
              } else {
                  setImportStatus('No valid transactions found in file.');
              }
          } catch (err) {
              console.error(err);
              setImportStatus('Error parsing file. Ensure it is a valid Excel/CSV.');
          }
          // Reset input
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <ExpenseForm 
                    currentUser={currentUser}
                    onAdd={() => {}}
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
      <div className="flex border-b border-slate-200 overflow-x-auto">
          {canManageUsers && (
            <button 
                onClick={() => setActiveTab('USERS')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'USERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
                <Users size={18} /> User Management
            </button>
          )}
          {canEditCategory && (
            <button 
                onClick={() => setActiveTab('CATEGORIES')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'CATEGORIES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
                <Tag size={18} /> Manage Categories
            </button>
          )}
          <button 
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'TRANSACTIONS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
              <FileText size={18} /> All Transactions
          </button>
      </div>

      {/* User Management Tab */}
      {activeTab === 'USERS' && canManageUsers && (
          <div className="animate-fade-in space-y-4">
              <Card title="Active Users & Permissions">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3 text-center">Edit Budget</th>
                                <th className="px-4 py-3 text-center">Edit Categories</th>
                                <th className="px-4 py-3 text-center">Manage Expenses</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{u.name}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    {u.role === 'ADMIN' ? (
                                        <td colSpan={3} className="px-4 py-3 text-center text-xs text-slate-400 italic">Full Access</td>
                                    ) : (
                                        <>
                                            <td className="px-4 py-3 text-center">
                                                <button 
                                                    onClick={() => togglePermission(u, 'canEditBudget')}
                                                    className={`p-1 rounded ${u.permissions.canEditBudget ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'}`}
                                                >
                                                    <CheckCircle size={20} className={u.permissions.canEditBudget ? 'fill-emerald-100' : ''} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button 
                                                    onClick={() => togglePermission(u, 'canEditCategory')}
                                                    className={`p-1 rounded ${u.permissions.canEditCategory ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'}`}
                                                >
                                                    <CheckCircle size={20} className={u.permissions.canEditCategory ? 'fill-emerald-100' : ''} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button 
                                                    onClick={() => togglePermission(u, 'canManageTransactions')}
                                                    className={`p-1 rounded ${u.permissions.canManageTransactions ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'}`}
                                                >
                                                    <CheckCircle size={20} className={u.permissions.canManageTransactions ? 'fill-emerald-100' : ''} />
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </Card>
          </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'CATEGORIES' && canEditCategory && (
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
            </Card>

            <Card title={`Active Categories (${categories.length})`}>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg group hover:bg-white hover:border-indigo-100 transition-all">
                            {renameData && renameData.oldName === cat ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input 
                                        type="text" 
                                        value={renameData.newName} 
                                        onChange={(e) => setRenameData({...renameData, newName: e.target.value})}
                                        className="flex-1 px-2 py-1 border border-indigo-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        autoFocus
                                    />
                                    <button onClick={saveRenameCategory} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><CheckCircle size={16} /></button>
                                    <button onClick={() => setRenameData(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-medium text-slate-700">{cat}</span>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => setRenameData({ oldName: cat, newName: cat })}
                                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
                                            title="Rename Category"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => onRemoveCategory(cat)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                                            title="Remove Category"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </>
                            )}
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
                        placeholder="Search by description, category, or user..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                  </div>
                  <div className="flex items-center gap-3">
                      {canManageTransactions && (
                          <>
                              <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  className="hidden" 
                                  accept=".csv, .xlsx, .xls"
                                  onChange={handleFileUpload}
                              />
                              <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium"
                              >
                                  <Upload size={16} /> Import Excel
                              </button>
                          </>
                      )}
                  </div>
              </div>
              
              {importStatus && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${importStatus.includes('Error') || importStatus.includes('No') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {importStatus}
                  </div>
              )}

              {selectedTransactionIds.size > 0 && canManageTransactions && (
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center justify-between animate-fade-in">
                      <span className="text-indigo-800 text-sm font-medium">{selectedTransactionIds.size} transactions selected</span>
                      <button 
                          onClick={handleBulkDelete}
                          className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
                      >
                          <Trash2 size={14} /> Delete Selected
                      </button>
                  </div>
              )}

              <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                              <tr>
                                  {canManageTransactions && (
                                    <th className="px-4 py-3 w-10">
                                        <input 
                                            type="checkbox" 
                                            checked={filteredTransactions.length > 0 && selectedTransactionIds.size === filteredTransactions.length}
                                            onChange={toggleAllSelection}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                  )}
                                  <th className="px-4 py-3">Date</th>
                                  <th className="px-4 py-3">User</th>
                                  <th className="px-4 py-3">Type</th>
                                  <th className="px-4 py-3">Category</th>
                                  <th className="px-4 py-3">Description</th>
                                  <th className="px-4 py-3 text-right">Amount</th>
                                  {canManageTransactions && <th className="px-4 py-3 text-right">Actions</th>}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredTransactions.map(t => (
                                  <tr key={t.id} className={`hover:bg-slate-50 group ${selectedTransactionIds.has(t.id) ? 'bg-indigo-50/50' : ''}`}>
                                      {canManageTransactions && (
                                          <td className="px-4 py-3">
                                              <input 
                                                  type="checkbox" 
                                                  checked={selectedTransactionIds.has(t.id)}
                                                  onChange={() => toggleSelection(t.id)}
                                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                              />
                                          </td>
                                      )}
                                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.date}</td>
                                      <td className="px-4 py-3 text-slate-500 text-xs">{t.createdBy}</td>
                                      <td className="px-4 py-3">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === TransactionType.PLANNED ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                              {t.type === TransactionType.PLANNED ? 'BUDGET' : 'EXPENSE'}
                                          </span>
                                      </td>
                                      <td className="px-4 py-3 text-slate-700">{t.category}</td>
                                      <td className="px-4 py-3 text-slate-800 font-medium">{t.description}</td>
                                      <td className="px-4 py-3 text-right font-bold text-slate-700">¥{t.amount.toLocaleString()}</td>
                                      {canManageTransactions && (
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
                                      )}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
