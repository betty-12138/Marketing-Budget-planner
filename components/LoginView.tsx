
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Wallet, Shield, Lock, Mail } from 'lucide-react';
import { User, UserRole } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<Props> = ({ onLogin }) => {
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      onLogin({
        id: 'admin-001',
        name: 'Administrator',
        email: 'admin@marketflow.com',
        role: 'ADMIN',
        permissions: {
          canEditBudget: true,
          canEditCategory: true,
          canManageTransactions: true,
          canManageUsers: true
        }
      });
    } else {
      setError('Invalid admin credentials. Try admin / admin123');
    }
  };

  const handleSocialLogin = (provider: 'Microsoft' | 'Google') => {
    // Simulate OAuth Login
    const mockUser: User = {
      id: `user-${Math.random().toString(36).substr(2, 5)}`,
      name: `${provider} User`,
      email: `user@${provider.toLowerCase()}.com`,
      role: 'MEMBER',
      permissions: {
        canEditBudget: false, // Default restricted
        canEditCategory: false, // Default restricted
        canManageTransactions: true, // Can add/edit/delete own usually, simplified to global for now
        canManageUsers: false
      }
    };
    onLogin(mockUser);
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
          {!isAdminLogin ? (
            <div className="p-8 space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
                <p className="text-sm text-slate-500 mt-1">Please sign in to continue</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => handleSocialLogin('Microsoft')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="w-5 h-5" />
                  Sign in with Microsoft
                </button>
                <button 
                  onClick={() => handleSocialLogin('Google')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
                  Sign in with Google
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">Or</span>
                </div>
              </div>

              <button 
                onClick={() => setIsAdminLogin(true)}
                className="w-full flex items-center justify-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors text-sm"
              >
                <Shield size={16} /> Admin Login
              </button>
            </div>
          ) : (
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold text-slate-900">Admin Login</h2>
                 <button onClick={() => setIsAdminLogin(false)} className="text-sm text-slate-400 hover:text-slate-600">Back</button>
              </div>
              
              <form onSubmit={handleAdminLogin} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="admin"
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
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                 </div>

                 {error && <div className="text-xs text-rose-500 font-medium bg-rose-50 p-2 rounded">{error}</div>}

                 <button 
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition-colors"
                 >
                    Access Dashboard
                 </button>
              </form>
            </div>
          )}
        </Card>
        <p className="text-center text-slate-500 text-xs mt-8">
            &copy; 2025 MarketFlow Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
};
