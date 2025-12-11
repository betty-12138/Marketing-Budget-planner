
import React, { useState, useEffect } from 'react';
import { YearlyDashboard } from './components/YearlyDashboard';
import { MonthlyView } from './components/MonthlyView';
import { QuarterlyView } from './components/QuarterlyView'; // New Component
import { ExpenseForm } from './components/ExpenseForm';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { Transaction, TransactionType, DEFAULT_CATEGORIES, User } from './types';
import { LayoutDashboard, PlusCircle, PieChart, Menu, X, Wallet, Settings, Download, LogOut, Calendar, BarChart3 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

// Mock Initial Data (Only used if localStorage is empty)
const INITIAL_DATA: Transaction[] = [
  { id: '1', date: `${CURRENT_YEAR}-01-01`, category: 'Advertising (Ads)', description: 'Jan Ads Budget', amount: 5000, type: TransactionType.PLANNED, createdBy: 'Administrator' },
  { id: '2', date: `${CURRENT_YEAR}-01-01`, category: 'Tools & Software', description: 'Q1 Software License', amount: 1200, type: TransactionType.PLANNED, createdBy: 'Administrator' },
  { id: '3', date: `${CURRENT_YEAR}-01-01`, category: 'Content Creation', description: 'Blog Content Plan', amount: 2000, type: TransactionType.PLANNED, createdBy: 'Administrator' },
  { id: '4', date: `${CURRENT_YEAR}-01-15`, category: 'Advertising (Ads)', description: 'Facebook Ads Jan', amount: 3200, type: TransactionType.ACTUAL, createdBy: 'John Doe' },
  { id: '5', date: `${CURRENT_YEAR}-01-20`, category: 'Tools & Software', description: 'HubSpot Monthly', amount: 800, type: TransactionType.ACTUAL, createdBy: 'John Doe' },
];

const INITIAL_USERS: User[] = [
    { 
        id: 'admin-001', 
        name: 'Administrator', 
        username: 'admin',
        password: 'admin123',
        email: 'admin@marketflow.com', 
        role: 'ADMIN', 
        permissions: { canEditBudget: true, canEditCategory: true, canManageTransactions: true, canManageUsers: true } 
    },
    { 
      id: 'user-001', 
      name: 'John Doe', 
      username: 'john',
      password: 'password123',
      email: 'john@marketflow.com', 
      role: 'MEMBER', 
      permissions: { canEditBudget: false, canEditCategory: false, canManageTransactions: true, canManageUsers: false } 
  },
];

enum View {
  YEARLY = 'YEARLY',
  QUARTERLY = 'QUARTERLY',
  MONTHLY = 'MONTHLY',
  ENTRY = 'ENTRY',
  SETTINGS = 'SETTINGS'
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // -- PERSISTENCE: Initialize State from LocalStorage --
  const [users, setUsers] = useState<User[]>(() => {
      const saved = localStorage.getItem('mf_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
      const saved = localStorage.getItem('mf_transactions');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [categories, setCategories] = useState<string[]>(() => {
      const saved = localStorage.getItem('mf_categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // -- PERSISTENCE: Save to LocalStorage on Change --
  useEffect(() => { localStorage.setItem('mf_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('mf_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('mf_categories', JSON.stringify(categories)); }, [categories]);


  const [currentView, setCurrentView] = useState<View>(View.MONTHLY);
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth Handling
  const handleLogin = (user: User) => {
      setCurrentUser(user);
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setCurrentView(View.MONTHLY);
  };

  // User Management
  const handleAddUser = (user: User) => {
      setUsers(prev => [...prev, user]);
  };

  const handleDeleteUser = (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const updateUserPermissions = (userId: string, permissions: User['permissions']) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions } : u));
      if (currentUser?.id === userId) {
          setCurrentUser(prev => prev ? { ...prev, permissions } : null);
      }
  };

  // Transaction Management
  const addTransaction = (t: Omit<Transaction, 'id'> | Omit<Transaction, 'id'>[]) => {
    const newItems = Array.isArray(t) ? t : [t];
    const newTransactions = newItems.map(item => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9)
    }));

    setTransactions(prev => [...prev, ...newTransactions]);

    if (newTransactions.length > 0 && currentView !== View.ENTRY) {
         const firstDate = new Date(newTransactions[0].date);
         if (firstDate.getMonth() !== selectedDate.getMonth() || firstDate.getFullYear() !== selectedDate.getFullYear()) {
              setSelectedDate(new Date(firstDate));
         }
    }
  };

  const importTransactions = (imported: Omit<Transaction, 'id'>[]) => {
      const newTransactions = imported.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9)
      }));
      // Extract unique categories from import and add them
      const newCats = new Set<string>();
      imported.forEach(t => {
          if (!categories.includes(t.category)) {
              newCats.add(t.category);
          }
      });
      if (newCats.size > 0) {
          setCategories(prev => [...prev, ...Array.from(newCats)]);
      }

      setTransactions(prev => [...prev, ...newTransactions]);
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const bulkDeleteTransactions = (ids: string[]) => {
      setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
  };

  const restoreData = (data: { users: User[], transactions: Transaction[], categories: string[] }) => {
      if (data.users && Array.isArray(data.users)) setUsers(data.users);
      if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
  };

  // Category Management
  const handleAddCategory = (cat: string) => {
      setCategories(prev => [...prev, cat]);
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
      setCategories(prev => prev.map(c => c === oldName ? newName : c));
      setTransactions(prev => prev.map(t => t.category === oldName ? { ...t, category: newName } : t));
  };

  const handleRemoveCategory = (cat: string) => {
      setCategories(prev => prev.filter(c => c !== cat));
  };

  const handleSortCategories = (order: 'asc' | 'desc') => {
      setCategories(prev => [...prev].sort((a, b) => order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)));
  };

  const updateYear = (year: number) => {
    setSelectedDate(prev => new Date(year, prev.getMonth(), 1));
  };

  const exportData = () => {
      const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'CreatedBy'];
      const csvContent = [
        headers.join(','),
        ...transactions.map(t => {
          return [
            t.date,
            t.type,
            `"${t.category.replace(/"/g, '""')}"`, 
            `"${t.description.replace(/"/g, '""')}"`,
            t.amount,
            `"${t.createdBy}"`
          ].join(',')
        })
      ].join('\n');
      
      // Add Byte Order Mark (\uFEFF) to ensure Excel opens the CSV as UTF-8 (handling Chinese characters correctly)
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marketflow_budget_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (!currentUser) {
      return <LoginView users={users} onLogin={handleLogin} />;
  }

  const navItems = [
    { id: View.MONTHLY, label: 'Monthly Board', icon: LayoutDashboard },
    { id: View.QUARTERLY, label: 'Quarterly Board', icon: BarChart3 },
    { id: View.YEARLY, label: 'Yearly Plan', icon: PieChart },
    { id: View.ENTRY, label: 'Add Expense', icon: PlusCircle },
    { id: View.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2, CURRENT_YEAR + 3];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 font-bold text-indigo-600 text-lg">
           <Wallet className="w-6 h-6" /> MarketFlow
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform z-10
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white text-xl">
            <Wallet className="w-6 h-6 text-indigo-400" /> MarketFlow
          </div>
          <p className="text-xs text-slate-500 mt-1">Budget Control Center</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${currentUser.role === 'ADMIN' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                    {currentUser.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.role === 'ADMIN' ? 'Administrator' : 'Team Member'}</p>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
                <LogOut size={16} /> Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    {currentView === View.MONTHLY ? 'Monthly Overview' : 
                     currentView === View.QUARTERLY ? 'Quarterly Dashboard' :
                     currentView === View.YEARLY ? 'Yearly Planner' : 
                     currentView === View.SETTINGS ? 'Settings & Transactions' : 'New Transaction'}
                </h1>
                <p className="text-slate-500 mt-1">
                    {currentView === View.MONTHLY ? 'Track your actual spend against planned budget.' : 
                     currentView === View.QUARTERLY ? 'Analyze performance by quarter (Q1-Q4).' :
                     currentView === View.YEARLY ? 'High-level view of annual financial performance.' : 
                     currentView === View.SETTINGS ? 'Manage categories, users, and transactions.' : 'Record a new expense or budget item.'}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button 
                    onClick={exportData}
                    className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 px-4 py-2 rounded-lg shadow-sm transition-colors font-medium text-sm"
                    title="Export all data to CSV (Excel)"
                >
                    <Download size={18} />
                    <span className="hidden sm:inline">Export Data</span>
                </button>

                {(currentView === View.MONTHLY || currentView === View.YEARLY || currentView === View.QUARTERLY) && (
                   <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-1.5 flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Year</span>
                      <select 
                         value={selectedDate.getFullYear()} 
                         onChange={(e) => updateYear(parseInt(e.target.value))}
                         className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                      >
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                   </div>
                )}

                {currentView === View.MONTHLY && (
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button 
                            onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
                            className="p-2 hover:bg-slate-100 rounded-md text-slate-600"
                        >
                            ←
                        </button>
                        <div className="flex items-center gap-2 px-4 font-semibold text-slate-700 min-w-[140px] justify-center">
                            <Calendar size={18} className="text-indigo-500" />
                            {selectedDate.toLocaleString('default', { month: 'long' })}
                        </div>
                        <button 
                             onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
                             className="p-2 hover:bg-slate-100 rounded-md text-slate-600"
                        >
                            →
                        </button>
                    </div>
                )}
            </div>
        </header>

        {/* Dynamic Content */}
        <div className="animate-fade-in">
            {currentView === View.MONTHLY && (
                <MonthlyView 
                    currentUser={currentUser}
                    transactions={transactions} 
                    currentDate={selectedDate} 
                    availableCategories={categories}
                    onAddTransaction={addTransaction}
                    onUpdateTransaction={updateTransaction}
                    onDeleteTransaction={deleteTransaction}
                />
            )}
            
            {currentView === View.QUARTERLY && (
                <QuarterlyView 
                    transactions={transactions} 
                    currentYear={selectedDate.getFullYear()} 
                />
            )}

            {currentView === View.YEARLY && (
                <YearlyDashboard 
                    transactions={transactions} 
                    currentYear={selectedDate.getFullYear()} 
                />
            )}

            {currentView === View.ENTRY && (
                <div className="max-w-3xl mx-auto mt-8">
                    <ExpenseForm 
                        currentUser={currentUser}
                        onAdd={addTransaction} 
                        categories={categories} 
                    />
                </div>
            )}

            {currentView === View.SETTINGS && (
                <SettingsView 
                    currentUser={currentUser}
                    users={users}
                    onAddUser={handleAddUser}
                    onDeleteUser={handleDeleteUser}
                    onUpdateUserPermissions={updateUserPermissions}
                    categories={categories}
                    transactions={transactions}
                    onAddCategory={handleAddCategory}
                    onRenameCategory={handleRenameCategory}
                    onRemoveCategory={handleRemoveCategory}
                    onSortCategories={handleSortCategories}
                    onUpdateTransaction={updateTransaction}
                    onDeleteTransaction={deleteTransaction}
                    onBulkDelete={bulkDeleteTransactions}
                    onImportTransactions={importTransactions}
                    onRestoreData={restoreData}
                />
            )}
        </div>

      </main>
    </div>
  );
};

export default App;
