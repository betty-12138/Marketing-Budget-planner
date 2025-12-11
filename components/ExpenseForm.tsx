
import React, { useState, useEffect, useMemo } from 'react';
import { TransactionType, Transaction } from '../types';
import { Card } from './ui/Card';
import { Check, DollarSign, Calendar, Tag, FileText, Repeat, CalendarDays, ArrowRight } from 'lucide-react';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'> | Omit<Transaction, 'id'>[]) => void;
  onUpdate?: (transaction: Omit<Transaction, 'id'>) => void;
  categories: string[];
  initialType?: TransactionType;
  initialCategory?: string;
  initialDate?: Date; 
  initialData?: Transaction; // For Editing
  onClose?: () => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [2023, 2024, 2025, 2026, 2027, 2028];

export const ExpenseForm: React.FC<Props> = ({ 
    onAdd, 
    onUpdate,
    categories, 
    initialType = TransactionType.ACTUAL,
    initialCategory = '',
    initialDate,
    initialData,
    onClose 
}) => {
  const isEditing = !!initialData;
  const [type, setType] = useState<TransactionType>(initialData ? initialData.type : initialType);
  
  // Use useMemo to create a stable default date reference that doesn't change on every render
  const defaultDate = useMemo(() => new Date(), []);
  // If initialDate is provided (e.g. from MonthlyView), use it. Otherwise use the stable default.
  // If editing, use the transaction date
  const effectiveDate = initialData ? new Date(initialData.date) : (initialDate || defaultDate);

  // Common State
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  const [category, setCategory] = useState(initialData ? initialData.category : (initialCategory || categories[0] || ''));
  const [description, setDescription] = useState(initialData ? initialData.description : '');

  // Actual Expense State
  const [specificDate, setSpecificDate] = useState(effectiveDate.toISOString().slice(0, 10));

  // Planned Budget State
  const [planYear, setPlanYear] = useState(effectiveDate.getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set([effectiveDate.getMonth()]));
  
  // Range Selection State
  const [rangeStart, setRangeStart] = useState<number>(0);
  const [rangeEnd, setRangeEnd] = useState<number>(11);

  // Update category if props change and not editing
  useEffect(() => {
    if (!isEditing) {
        if (initialCategory) setCategory(initialCategory);
        else if (!category && categories.length > 0) setCategory(categories[0]);
    }
  }, [categories, initialCategory, category, isEditing]);

  // Sync state when effectiveDate changes (e.g. user navigates to a new month in parent)
  // But ONLY if not editing existing data, to avoid overwriting user inputs
  useEffect(() => {
      if (!isEditing) {
          setSpecificDate(effectiveDate.toISOString().slice(0, 10));
          setPlanYear(effectiveDate.getFullYear());
          if (initialDate) {
              setSelectedMonths(new Set([initialDate.getMonth()]));
          }
      }
  }, [effectiveDate, initialDate, isEditing]);

  const toggleMonth = (index: number) => {
      const newSet = new Set(selectedMonths);
      if (newSet.has(index)) {
          newSet.delete(index);
      } else {
          newSet.add(index);
      }
      setSelectedMonths(newSet);
  };

  const selectMonths = (mode: 'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'CLEAR') => {
      if (mode === 'CLEAR') {
          setSelectedMonths(new Set());
          return;
      }
      const newSet = new Set<number>();
      if (mode === 'ALL') {
          for(let i=0; i<12; i++) newSet.add(i);
      } else if (mode === 'Q1') { [0,1,2].forEach(i => newSet.add(i)); }
      else if (mode === 'Q2') { [3,4,5].forEach(i => newSet.add(i)); }
      else if (mode === 'Q3') { [6,7,8].forEach(i => newSet.add(i)); }
      else if (mode === 'Q4') { [9,10,11].forEach(i => newSet.add(i)); }
      setSelectedMonths(newSet);
  };

  const applyRange = () => {
    const newSet = new Set(selectedMonths);
    const start = Math.min(rangeStart, rangeEnd);
    const end = Math.max(rangeStart, rangeEnd);
    for (let i = start; i <= end; i++) {
        newSet.add(i);
    }
    setSelectedMonths(newSet);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    if (isEditing && onUpdate) {
        // Edit Mode: Update single record
        onUpdate({
            date: specificDate,
            amount: val,
            category,
            description,
            type: type
        });
    } else {
        // Add Mode
        if (type === TransactionType.ACTUAL) {
            // Single Entry
            onAdd({
                date: specificDate,
                amount: val,
                category,
                description,
                type: TransactionType.ACTUAL
            });
        } else {
            // Bulk Entry for Planned Budget
            if (selectedMonths.size === 0) return;

            const transactions: Omit<Transaction, 'id'>[] = Array.from(selectedMonths).map((monthIndex: number) => {
                const monthStr = (monthIndex + 1).toString().padStart(2, '0');
                const dateStr = `${planYear}-${monthStr}-01`;
                
                return {
                    date: dateStr,
                    amount: val,
                    category,
                    description: description || `${category} Budget - ${MONTHS[monthIndex]}`,
                    type: TransactionType.PLANNED
                };
            });
            
            onAdd(transactions);
        }
    }

    // Reset or close
    if (onClose) {
        onClose();
    } else {
        setAmount('');
        setDescription('');
        // Keep current settings for rapid entry
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg border-indigo-100" title={isEditing ? "Edit Transaction" : (type === TransactionType.PLANNED ? "Plan Budget" : "Record Expense")}>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Type Selection - Locked in Edit Mode */}
        <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-fit">
            <button
                type="button"
                disabled={isEditing}
                onClick={() => setType(TransactionType.ACTUAL)}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    type === TransactionType.ACTUAL 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 disabled:text-slate-400'
                }`}
            >
                <DollarSign size={18} /> Actual Expense
            </button>
            <button
                type="button"
                disabled={isEditing}
                onClick={() => setType(TransactionType.PLANNED)}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    type === TransactionType.PLANNED 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 disabled:text-slate-400'
                }`}
            >
                <CalendarDays size={18} /> Planned Budget
            </button>
        </div>

        {/* Dynamic Date/Frequency Section */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            {/* If Editing OR Actual Type, show simple Date Picker */}
            {type === TransactionType.ACTUAL || isEditing ? (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Calendar size={16} /> Date
                    </label>
                    <input 
                        type="date" 
                        required
                        value={specificDate}
                        onChange={e => setSpecificDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    {isEditing && type === TransactionType.PLANNED && (
                        <p className="text-xs text-amber-600 mt-1">
                            Note: You are editing a single budget entry. To change multiple months, delete and recreate them or edit individually.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-5">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Repeat size={16} /> Budget Year
                            </label>
                            {/* Standard Select for reliability */}
                            <div className="relative">
                                <select 
                                    value={planYear}
                                    onChange={(e) => setPlanYear(parseInt(e.target.value))}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:border-indigo-400 transition-colors"
                                >
                                    {YEARS.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 bg-white pl-1">
                                    ▼
                                </div>
                            </div>
                         </div>
                     </div>
                     
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Select Months</label>
                        {/* Month Grid */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {MONTHS.map((m, idx) => {
                                const isSelected = selectedMonths.has(idx);
                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); toggleMonth(idx); }}
                                        className={`py-2.5 px-2 text-sm font-semibold rounded-lg transition-all border ${
                                            isSelected 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 transform scale-105' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {m}
                                    </button>
                                );
                            })}
                        </div>
                     </div>
                     
                     {/* Tools Row: Range & Quick Select */}
                     <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3">
                         {/* Continuous Range Selection */}
                         <div className="flex flex-wrap items-center gap-2 text-sm">
                             <span className="text-slate-600 font-medium whitespace-nowrap">Range:</span>
                             <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                 <select 
                                    value={rangeStart} 
                                    onChange={(e) => setRangeStart(parseInt(e.target.value))}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-700 focus:outline-indigo-500"
                                 >
                                     {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                 </select>
                                 <ArrowRight size={14} className="text-slate-400" />
                                 <select 
                                    value={rangeEnd} 
                                    onChange={(e) => setRangeEnd(parseInt(e.target.value))}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-700 focus:outline-indigo-500"
                                 >
                                     {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                 </select>
                                 <button 
                                    type="button" 
                                    onClick={applyRange}
                                    className="px-4 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded font-medium transition-colors text-xs uppercase tracking-wide"
                                 >
                                     Apply
                                 </button>
                             </div>
                         </div>

                         <div className="h-px bg-slate-100 w-full"></div>

                         {/* Quick Buttons */}
                         <div className="flex flex-wrap gap-2 items-center">
                             <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick:</span>
                             <button type="button" onClick={() => selectMonths('Q1')} className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded border border-slate-200">Q1</button>
                             <button type="button" onClick={() => selectMonths('Q2')} className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded border border-slate-200">Q2</button>
                             <button type="button" onClick={() => selectMonths('Q3')} className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded border border-slate-200">Q3</button>
                             <button type="button" onClick={() => selectMonths('Q4')} className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded border border-slate-200">Q4</button>
                             <div className="w-px h-6 bg-slate-200 mx-1"></div>
                             <button type="button" onClick={() => selectMonths('ALL')} className="px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded border border-indigo-100">All Year</button>
                             <button type="button" onClick={() => selectMonths('CLEAR')} className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-medium rounded ml-auto">Clear</button>
                         </div>
                     </div>
                     
                     <div className="text-sm bg-indigo-50 text-indigo-800 px-3 py-2 rounded border border-indigo-100 text-right">
                         Creating <strong>{selectedMonths.size}</strong> budget items for <strong>{planYear}</strong>
                     </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <DollarSign size={16} /> Amount {type === TransactionType.PLANNED && !isEditing && <span className="text-slate-400 font-normal">(Per Month)</span>}
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-lg"
                        placeholder="0.00"
                    />
                </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Tag size={16} /> Category
                </label>
                <div className="relative">
                    <select 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 bg-white pl-1">
                        ▼
                    </div>
                </div>
            </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FileText size={16} /> Description {type === TransactionType.PLANNED && !isEditing && <span className="text-slate-400 font-normal">(Optional)</span>}
            </label>
            <textarea 
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder={type === TransactionType.PLANNED ? "e.g., Monthly Retainer" : "e.g., Campaign Launch Party"}
            />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            {onClose && (
                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                    Cancel
                </button>
            )}
            <button 
                type="submit"
                disabled={!amount || (!isEditing && type === TransactionType.PLANNED && selectedMonths.size === 0)}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
            >
                <Check size={18} />
                {isEditing ? 'Update Transaction' : (type === TransactionType.PLANNED ? `Save Budget` : 'Save Expense')}
            </button>
        </div>
      </form>
    </Card>
  );
};
