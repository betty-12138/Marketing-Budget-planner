
import React, { useState, useRef, useMemo } from 'react';
import { Card } from './ui/Card';
import { Plus, Trash2, Tag, AlertCircle, FileText, Search, Edit2, Users, Shield, CheckCircle, Upload, Save, X, UserPlus, Lock, ArrowUpDown, Filter, Database, Download, RefreshCw } from 'lucide-react';
import { Transaction, TransactionType, User, UserRole, Permissions } from '../types';
import { ExpenseForm } from './ExpenseForm';

declare const XLSX: any; // Global definition for SheetJS

interface Props {
  currentUser: User;
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUserPermissions: (userId: string, permissions: User['permissions']) => void;
  categories: string[];
  transactions: Transaction[];
  onAddCategory: (cat: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onRemoveCategory: (cat: string) => void;
  onSortCategories: (order: 'asc' | 'desc') => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onImportTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
  onRestoreData: (data: { users: User[], transactions: Transaction[], categories: string[] }) => void;
}

type Tab = 'CATEGORIES' | 'TRANSACTIONS' | 'USERS' | 'DATA';

export const SettingsView: React.FC<Props> = ({ 
    currentUser,
    users,
    onAddUser,
    onDeleteUser,
    onUpdateUserPermissions,
    categories, 
    transactions, 
    onAddCategory, 
    onRenameCategory,
    onRemoveCategory, 
    onSortCategories,
    onUpdateTransaction,
    onDeleteTransaction,
    onBulkDelete,
    onImportTransactions,
    onRestoreData
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(currentUser.role === 'ADMIN' ? 'USERS' : 'CATEGORIES');
  
  // Category State
  const [newCategory, setNewCategory] = useState('');
  const [renameData, setRenameData] = useState<{ oldName: string, newName: string } | null>(null);
  
  // Transaction State
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [backupStatus, setBackupStatus] = useState<string>('');

  // Transaction Sorting & Filtering State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });

  // User Mgmt State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<{name: string, username: string, password: string, role: UserRole}>({
      name: '',
      username: '',
      password: '',
      role: 'MEMBER'
  });
  const [newUserPermissions, setNewUserPermissions] = useState<Permissions>({
      canEditBudget: false,
      canEditCategory: false,
      canManageTransactions: true,
      canManageUsers: false
  });

  // Permissions
  const canEditCategory = currentUser.role === 'ADMIN' || currentUser.permissions.canEditCategory;
  const canManageTransactions = currentUser.role === 'ADMIN' || currentUser.permissions.canManageTransactions;
  const canEditBudget = currentUser.role === 'ADMIN' || currentUser.permissions.canEditBudget;
  const canManageUsers = currentUser.role === 'ADMIN';

  // Helper to check if user can modify a specific transaction
  const canModifyTransaction = (t: Transaction) => {
    if (t.type === TransactionType.PLANNED) return canEditBudget;
    return canManageTransactions;
  };

  // --- Handlers ---
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

  const handleCreateUser = (e: React.FormEvent) => {
      e.preventDefault();
      if(users.some(u => u.username === newUser.username)) {
          alert('Username already exists!');
          return;
      }

      const finalPermissions = newUser.role === 'ADMIN' ? {
          canEditBudget: true,
          canEditCategory: true,
          canManageTransactions: true,
          canManageUsers: true
      } : newUserPermissions;

      const createdUser: User = {
          id: `user-${Date.now()}`,
          name: newUser.name,
          username: newUser.username,
          password: newUser.password,
          email: `${newUser.username}@local.com`, 
          role: newUser.role,
          permissions: finalPermissions
      };

      onAddUser(createdUser);
      setShowAddUser(false);
      setNewUser({ name: '', username: '', password: '', role: 'MEMBER' });
  };

  const handleDeleteUserWrapper = (userId: string) => {
      if (userId === currentUser.id) {
          alert("You cannot delete yourself.");
          return;
      }
      if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
          onDeleteUser(userId);
      }
  };

  // --- Backup / Restore Handlers ---
  const handleBackupData = () => {
      const backup = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          users,
          categories,
          transactions
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marketflow_full_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setBackupStatus('Backup downloaded successfully.');
      setTimeout(() => setBackupStatus(''), 3000);
  };

  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const result = evt.target?.result as string;
              const data = JSON.parse(result);
              
              if (data.users && data.categories && data.transactions) {
                   if (window.confirm(`Found backup from ${data.exportedAt || 'unknown date'}.\nThis will OVERWRITE all current data with ${data.transactions.length} transactions and ${data.users.length} users.\nAre you sure?`)) {
                       onRestoreData(data);
                       setBackupStatus('System restored successfully!');
                       setTimeout(() => setBackupStatus(''), 3000);
                   }
              } else {
                  alert('Invalid backup file. Missing required data fields.');
              }
          } catch(err) {
              console.error(err);
              alert('Failed to parse backup file. Please ensure it is a valid JSON file.');
          }
          if (backupInputRef.current) backupInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  // --- Transaction Logic ---
  const handleSort = (key: keyof Transaction) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
        // Search
        const matchesSearch = 
            t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
            t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filters
        const matchesCategory = filterCategory ? t.category === filterCategory : true;
        const matchesType = filterType ? t.type === filterType : true;
        const matchesStart = dateRange.start ? t.date >= dateRange.start : true;
        const matchesEnd = dateRange.end ? t.date <= dateRange.end : true;

        return matchesSearch && matchesCategory && matchesType && matchesStart && matchesEnd;
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [transactions, searchTerm, filterCategory, filterType, dateRange, sortConfig]);

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
          // Only select those the user has permission to delete? 
          // For simplicity in UI, we select all displayed, but action will be guarded.
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

      const isCsv = file.name.toLowerCase().endsWith('.csv');
      const reader = new FileReader();

      reader.onload = (evt) => {
          try {
              const arrayBuffer = evt.target?.result as ArrayBuffer;
              let wb;

              if (isCsv) {
                   // SMART ENCODING DETECTION
                   // 1. Try UTF-8 first
                   let text;
                   try {
                       const decoder = new TextDecoder('utf-8', { fatal: true });
                       text = decoder.decode(arrayBuffer);
                   } catch (e) {
                       // 2. Fallback to GB18030 (Chinese) if UTF-8 fails
                       const decoder = new TextDecoder('gb18030');
                       text = decoder.decode(arrayBuffer);
                   }
                   wb = XLSX.read(text, { type: 'string' });
              } else {
                   // For Excel (.xlsx), we read as ArrayBuffer which handles Unicode natively
                   wb = XLSX.read(arrayBuffer, { type: 'array' });
              }
              
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws);

              const parsedTransactions: Omit<Transaction, 'id'>[] = [];
              data.forEach((row: any) => {
                  // Support both English and Chinese headers
                  const date = row['Date'] || row['date'] || row['日期'];
                  const amount = row['Amount'] || row['amount'] || row['金额'] || row['费用'];
                  const category = row['Category'] || row['category'] || row['类别'] || row['科目'];
                  const description = row['Description'] || row['description'] || row['描述'] || row['备注'] || row['说明'] || 'Imported Transaction';
                  
                  const rawType = row['Type'] || row['type'] || row['类型'] || 'ACTUAL';
                  
                  if (date && amount && category) {
                      // Determine transaction type (handle Chinese "预算" etc.)
                      let type = TransactionType.ACTUAL;
                      const typeStr = String(rawType).toUpperCase();
                      if (typeStr.includes('PLAN') || typeStr.includes('BUDGET') || typeStr.includes('预算')) {
                          type = TransactionType.PLANNED;
                      }

                      // Format Date
                      let dateStr = String(date);
                      if (typeof date === 'number') {
                          // Excel serial date to JS Date
                          const jsDate = new Date(Math.round((date - 25569) * 86400 * 1000));
                          dateStr = jsDate.toISOString().split('T')[0];
                      }

                      parsedTransactions.push({
                          date: dateStr,
                          amount: Number(amount),
                          category: String(category).trim(), // Trim whitespace to avoid mismatch
                          description: String(description),
                          type: type,
                          createdBy: currentUser.name + ' (Import)'
                      });
                  }
              });

              if (parsedTransactions.length > 0) {
                  onImportTransactions(parsedTransactions);
                  setImportStatus(`Successfully imported ${parsedTransactions.length} items.`);
                  setTimeout(() => setImportStatus(''), 3000);
              } else {
                  setImportStatus('No valid transactions found in file. Please check column headers (Date, Amount, Category).');
              }
          } catch (err) {
              console.error(err);
              setImportStatus('Error parsing file. Ensure it is a valid Excel/CSV.');
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      
      // Always read as ArrayBuffer to control decoding manually
      reader.readAsArrayBuffer(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Edit Transaction Modal */}
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

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card title="Register New Account" className="w-full max-w-md">
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Display Name</label>
                        <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border rounded p-2" placeholder="e.g. Marketing Lead" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Username (Login)</label>
                        <input type="text" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full border rounded p-2" placeholder="e.g. marklead" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                        <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border rounded p-2" placeholder="******" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                        <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})} className="w-full border rounded p-2">
                            <option value="MEMBER">Member (Restricted)</option>
                            <option value="ADMIN">Admin (Full Access)</option>
                        </select>
                    </div>
                    {newUser.role === 'MEMBER' && (
                        <div className="bg-slate-50 p-3 rounded border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 mb-2">Permissions</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={newUserPermissions.canEditBudget} onChange={e => setNewUserPermissions({...newUserPermissions, canEditBudget: e.target.checked})} />
                                    Edit Budget
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={newUserPermissions.canEditCategory} onChange={e => setNewUserPermissions({...newUserPermissions, canEditCategory: e.target.checked})} />
                                    Edit Categories
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={newUserPermissions.canManageTransactions} onChange={e => setNewUserPermissions({...newUserPermissions, canManageTransactions: e.target.checked})} />
                                    Manage Expenses
                                </label>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">Create User</button>
                    </div>
                </form>
            </Card>
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
          <button 
            onClick={() => setActiveTab('DATA')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'DATA' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
              <Database size={18} /> Data Management
          </button>
      </div>

      {/* User Management Tab */}
      {activeTab === 'USERS' && canManageUsers && (
          <div className="animate-fade-in space-y-4">
              <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-800">Active Accounts</h3>
                  <button 
                      onClick={() => setShowAddUser(true)} 
                      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                      <UserPlus size={18} /> Register New User
                  </button>
              </div>

              <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Username</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3 text-center">Permissions</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{u.name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                        {u.username}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    {u.role === 'ADMIN' ? (
                                        <td className="px-4 py-3 text-center text-xs text-slate-400 italic">
                                            <div className="flex items-center justify-center gap-1"><Shield size={14}/> Full Access</div>
                                        </td>
                                    ) : (
                                        <td className="px-4 py-3 text-center text-xs text-slate-500">
                                            {[
                                                u.permissions.canEditBudget ? 'Budget' : '',
                                                u.permissions.canEditCategory ? 'Cats' : '',
                                                u.permissions.canManageTransactions ? 'Expenses' : ''
                                            ].filter(Boolean).join(', ') || 'None'}
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => handleDeleteUserWrapper(u.id)}
                                            className={`p-2 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 ${u.id === currentUser.id ? 'invisible' : ''}`}
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
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

            <Card 
                title={`Active Categories (${categories.length})`}
                action={
                    <div className="flex gap-1">
                        <button onClick={() => onSortCategories('asc')} className="p-1 text-slate-400 hover:text-indigo-600" title="Sort A-Z"><ArrowUpDown size={14} /></button>
                    </div>
                }
            >
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
              
              {/* Filters */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                     <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>
                     <div className="flex items-center gap-3 w-full md:w-auto">
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
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium w-full md:w-auto justify-center"
                                >
                                    <Upload size={16} /> Import Excel
                                </button>
                            </>
                        )}
                     </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 items-end border-t border-slate-100 pt-3">
                      <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-sm bg-slate-50">
                              <option value="">All Categories</option>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-sm bg-slate-50">
                              <option value="">All Types</option>
                              <option value={TransactionType.PLANNED}>Planned (Budget)</option>
                              <option value={TransactionType.ACTUAL}>Actual (Expense)</option>
                          </select>
                      </div>
                      <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <label className="text-xs font-bold text-slate-500 uppercase">From</label>
                          <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="px-3 py-1.5 border border-slate-200 rounded text-sm bg-slate-50" />
                      </div>
                      <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <label className="text-xs font-bold text-slate-500 uppercase">To</label>
                          <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="px-3 py-1.5 border border-slate-200 rounded text-sm bg-slate-50" />
                      </div>
                      <button 
                        onClick={() => {setFilterCategory(''); setFilterType(''); setDateRange({start:'', end:''}); setSearchTerm('')}}
                        className="px-3 py-1.5 text-xs text-rose-500 font-medium hover:bg-rose-50 rounded mb-1"
                      >
                          Clear Filters
                      </button>
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
                      {/* Only show delete button if all selected are delete-able? For now, we allow trigger, but individual restrictions would prevent if enforced on API. 
                          Since we are local, we could filter. 
                      */}
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
                                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('date')}>
                                      <div className="flex items-center gap-1">Date <ArrowUpDown size={12}/></div>
                                  </th>
                                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('createdBy')}>
                                      <div className="flex items-center gap-1">User <ArrowUpDown size={12}/></div>
                                  </th>
                                  <th className="px-4 py-3">Type</th>
                                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('category')}>
                                      <div className="flex items-center gap-1">Category <ArrowUpDown size={12}/></div>
                                  </th>
                                  <th className="px-4 py-3">Description</th>
                                  <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('amount')}>
                                      <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown size={12}/></div>
                                  </th>
                                  {canManageTransactions && <th className="px-4 py-3 text-right">Actions</th>}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredTransactions.map(t => {
                                  // Determine if this row is selectable/actionable
                                  const actionable = canModifyTransaction(t);
                                  
                                  return (
                                  <tr key={t.id} className={`hover:bg-slate-50 group ${selectedTransactionIds.has(t.id) ? 'bg-indigo-50/50' : ''}`}>
                                      {canManageTransactions && (
                                          <td className="px-4 py-3">
                                            {actionable && (
                                              <input 
                                                  type="checkbox" 
                                                  checked={selectedTransactionIds.has(t.id)}
                                                  onChange={() => toggleSelection(t.id)}
                                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                              />
                                            )}
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
                                                {actionable ? (
                                                  <>
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
                                                  </>
                                                ) : (
                                                    <span className="text-xs text-slate-300 italic">Locked</span>
                                                )}
                                            </div>
                                        </td>
                                      )}
                                  </tr>
                              )})}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
      )}

      {/* Data Management Tab */}
      {activeTab === 'DATA' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <Card title="Data Backup (Export)" className="bg-indigo-50 border-indigo-100">
                  <div className="space-y-4">
                      <div className="flex items-start gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                             <Database size={24} />
                          </div>
                          <div>
                              <p className="text-sm text-indigo-900 font-medium mb-1">Backup your System</p>
                              <p className="text-xs text-indigo-700 leading-relaxed">
                                  Since this application runs locally in your browser, your data is not stored in a cloud database. 
                                  To move data between devices (e.g., Desktop to Mobile) or save a snapshot, use this Backup feature.
                              </p>
                          </div>
                      </div>
                      <button 
                        onClick={handleBackupData}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
                      >
                          <Download size={18} /> Download Full Backup (.json)
                      </button>
                  </div>
              </Card>

              <Card title="Restore Data (Import)" className="bg-emerald-50 border-emerald-100">
                  <div className="space-y-4">
                      <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                             <RefreshCw size={24} />
                          </div>
                          <div>
                              <p className="text-sm text-emerald-900 font-medium mb-1">Restore from Backup</p>
                              <p className="text-xs text-emerald-700 leading-relaxed">
                                  Restore a previously saved backup file. 
                                  <br/>
                                  <strong className="text-emerald-800">Warning:</strong> This will overwrite all current Users, Categories, and Transactions on this device.
                              </p>
                          </div>
                      </div>
                      
                      <input 
                          type="file" 
                          ref={backupInputRef}
                          accept=".json"
                          className="hidden"
                          onChange={handleRestoreData}
                      />
                      
                      <button 
                        onClick={() => backupInputRef.current?.click()}
                        className="w-full py-3 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                      >
                          <Upload size={18} /> Upload Backup File
                      </button>
                  </div>
              </Card>

              {backupStatus && (
                  <div className="md:col-span-2 p-4 bg-slate-800 text-white rounded-lg text-center font-medium animate-pulse">
                      {backupStatus}
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
