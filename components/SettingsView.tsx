
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Plus, Trash2, Tag, AlertCircle } from 'lucide-react';

interface Props {
  categories: string[];
  onAddCategory: (cat: string) => void;
  onRemoveCategory: (cat: string) => void;
}

export const SettingsView: React.FC<Props> = ({ categories, onAddCategory, onRemoveCategory }) => {
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="text-indigo-300" /> Category Configuration
        </h2>
        <p className="text-indigo-200 mt-1">Manage the expense categories used across your budget and reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Add New Category">
            <form onSubmit={handleAdd} className="space-y-4">
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

        <Card title="Active Categories">
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
    </div>
  );
};
