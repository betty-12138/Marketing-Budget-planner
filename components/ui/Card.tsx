import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = "", title, action }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          {title && <h3 className="text-lg font-semibold text-slate-800">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export const StatisticCard: React.FC<{ label: string; value: string; subValue?: string; trend?: 'up' | 'down' | 'neutral' }> = ({ label, value, subValue, trend }) => (
  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
    <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
    <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
    {subValue && (
      <div className={`text-xs font-medium mt-2 flex items-center ${
        trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-500'
      }`}>
        {subValue}
      </div>
    )}
  </div>
);