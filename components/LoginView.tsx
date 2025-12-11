
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Wallet, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface Props {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<Props> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Find user matching credentials
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      onLogin(user);
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 mb-4 shadow-lg shadow-indigo-900/50">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MarketFlow</h1>
          <p className="text-slate-400 mt-2">Budget Control & Analytics</p>
        </div>

        <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="text-center">
                 <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
                 <p className="text-sm text-slate-500 mt-1">Enter your credentials to access the dashboard</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Enter your username"
                            autoFocus
                        />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                 </div>

                 {error && (
                    <div className="flex items-center gap-2 text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-lg border border-rose-100 animate-fade-in">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                 )}

                 <button 
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition-colors mt-2"
                 >
                    Login
                 </button>
              </form>
            </div>
        </Card>
        <p className="text-center text-slate-500 text-xs mt-8">
            &copy; 2025 MarketFlow Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
};
