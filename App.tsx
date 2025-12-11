
import React, { useState } from 'react';
import { YearlyDashboard } from './components/YearlyDashboard';
import { MonthlyView } from './components/MonthlyView';
import { ExpenseForm } from './components/ExpenseForm';
import { SettingsView } from './components/SettingsView';
import { Transaction, TransactionType, DEFAULT_CATEGORIES } from './types';
import { LayoutDashboard, Calendar, PlusCircle, PieChart, Menu, X, Wallet, Settings, Download } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

// Mock Initial Data using string literals dynamically based on current year
const INITIAL_DATA: Transaction[] = [
  // January - Planned
  { id: '1', date: `${CURRENT_YEAR}-01-01`, category: 'Advertising (Ads)', description: 'Jan Ads Budget', amount: 5000, type: TransactionType.PLANNED },
  { id: '2', date: `${CURRENT_YEAR}-01-01`, category: 'Tools & Software', description: 'Q1 Software License', amount: 1200, type: TransactionType.PLANNED },
  { id: '3', date: `${CURRENT_YEAR}-01-01`, category: 'Content Creation', description: 'Blog Content Plan', amount: 2000, type: TransactionType.PLANNED },
  // January - Actual
  { id: '4', date: `${CURRENT_YEAR}-01-15`, category: 'Advertising (Ads)', description: 'Facebook Ads Jan', amount: 3200, type: TransactionType.ACTUAL },
  { id: '5', date: `${CURRENT_YEAR}-01-20`, category: 'Tools & Software', description: 'HubSpot Monthly', amount: 800, type: TransactionType.ACTUAL },
  // February
  { id: '6', date: `${CURRENT_YEAR}-02-01`, category: 'Advertising (Ads)', description: 'Feb Ads Budget', amount: 5000, type: TransactionType.PLANNED },
  { id: '7', date: `${CURRENT_YEAR}-02-10`, category: 'Advertising (Ads)', description: 'Google Ads', amount: 5500, type: TransactionType.ACTUAL }, // Overbudget
  // October (Example future/past month data)
  { id: '8', date: `${CURRENT_YEAR}-10-01`, category: 'Events & Conferences', description: 'Annual Conf Budget', amount: 15000, type: TransactionType.PLANNED },
  { id: '9', date: `${CURRENT_YEAR}-10-01`, category: 'Advertising (Ads)', description: 'Q4 Push', amount: 8000, type: TransactionType.PLANNED },
  { id: '10', date: `${CURRENT_YEAR}-10-05`, category: 'Events & Conferences', description: 'Venue Deposit', amount: 5000, type: TransactionType.ACTUAL },
  { id: '11', date: `${CURRENT_YEAR}-10-12`, category: 'Advertising (Ads)', description: 'LinkedIn Campaign', amount: 2000, type: TransactionType.ACTUAL },
  { id: '12', date: `${CURRENT_YEAR}-10-15`, category: 'Content Creation', description: 'Video Production', amount: 3500, type: TransactionType.ACTUAL },
];

enum View {
  YEARLY = 'YEARLY',
  MONTHLY = 'MONTHLY',
  ENTRY = 'ENTRY',
  SETTINGS = 'SETTINGS'
}

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_DATA);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [currentView, setCurrentView] = useState<View>(View.MONTHLY);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to system time
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Updated to accept single or array of transactions
  const addTransaction = (t: Omit<Transaction, 'id'> | Omit<Transaction, 'id'>[]) => {
    const newItems = Array.isArray(t) ? t : [t];
    const newTransactions = newItems.map(item => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9)
    }));

    setTransactions(prev => [...prev, ...newTransactions]);

    // If added from Entry view, go to Monthly view focused on the date of the first added item
    if (currentView === View.ENTRY && newTransactions.length > 0) {
        setCurrentView(View.MONTHLY);
        const firstDate = new Date(newTransactions[0].date);
        // Only update date if it's vastly different (different year/month)
        if (firstDate.getMonth() !== selectedDate.getMonth() || firstDate.getFullYear() !== selectedDate.getFullYear()) {
             setSelectedDate(new Date(firstDate));
        }
    }
  };

  const handleAddCategory = (cat: string) => {
      setCategories(prev => [...prev, cat]);
  };

  const handleRemoveCategory = (cat: string) => {
      setCategories(prev => prev.filter(c => c !== cat));
  };

  const updateYear = (year: number) => {
    setSelectedDate(prev => new Date(year, prev.getMonth(), 1));
  };

  // Export transactions to CSV
  const exportData = () => {
      const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
      const csvContent = [
        headers.join(','),
        ...transactions.map(t => {
          return [
            t.date,
            t.type,
            `"${t.category.replace(/"/g, '""')}"`, // escape quotes for CSV
            `"${t.description.replace(/"/g, '""')}"`,
            t.amount
          ].join(',')
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marketflow_budget_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const navItems = [
    { id: View.MONTHLY, label: 'Monthly Board', icon: LayoutDashboard },
    { id: View.YEARLY, label: 'Yearly Plan', icon: PieChart },
    { id: View.ENTRY, label: 'Add Expense', icon: PlusCircle },
    { id: View.SETTINGS, label: 'Settings', icon: Settings },
  ];

  // Dynamic Year List based on current system time
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
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                    TM
                </div>
                <div>
                    <p className="text-sm font-medium text-white">Team Member</p>
                    <p className="text-xs text-slate-500">Marketing Dept</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    {currentView === View.MONTHLY ? 'Monthly Overview' : 
                     currentView === View.YEARLY ? 'Yearly Planner' : 
                     currentView === View.SETTINGS ? 'Settings' : 'New Transaction'}
                </h1>
                <p className="text-slate-500 mt-1">
                    {currentView === View.MONTHLY ? 'Track your actual spend against planned budget.' : 
                     currentView === View.YEARLY ? 'High-level view of annual financial performance.' : 
                     currentView === View.SETTINGS ? 'Manage categories and application preferences.' : 'Record a new expense or budget item.'}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                
                {/* Export Button */}
                <button 
                    onClick={exportData}
                    className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 px-4 py-2 rounded-lg shadow-sm transition-colors font-medium text-sm"
                    title="Export all data to CSV (Excel)"
                >
                    <Download size={18} />
                    <span className="hidden sm:inline">Export Data</span>
                </button>

                {/* Global Year Switcher */}
                {(currentView === View.MONTHLY || currentView === View.YEARLY) && (
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
                    transactions={transactions} 
                    currentDate={selectedDate} 
                    availableCategories={categories}
                    onAddTransaction={addTransaction}
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
                        onAdd={addTransaction} 
                        categories={categories} 
                    />
                </div>
            )}

            {currentView === View.SETTINGS && (
                <SettingsView 
                    categories={categories}
                    onAddCategory={handleAddCategory}
                    onRemoveCategory={handleRemoveCategory}
                />
            )}
        </div>

      </main>
    </div>
  );
};

export default App;
