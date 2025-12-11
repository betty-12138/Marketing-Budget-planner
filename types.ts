
export enum TransactionType {
  PLANNED = 'PLANNED', // Budget
  ACTUAL = 'ACTUAL'    // Expense
}

export type UserRole = 'ADMIN' | 'MEMBER';

export interface Permissions {
  canEditBudget: boolean;
  canEditCategory: boolean;
  canManageTransactions: boolean; // Edit/Delete existing
  canManageUsers: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string; // Keep for display/contact
  username: string; // For Login
  password?: string; // For Login (In real app, this should be hashed)
  role: UserRole;
  avatar?: string;
  permissions: Permissions;
}

// Default categories for initialization
export const DEFAULT_CATEGORIES = [
  'Advertising (Ads)',
  'Content Creation',
  'Events & Conferences',
  'Tools & Software',
  'Public Relations',
  'Agency Fees',
  'Miscellaneous'
];

export interface Transaction {
  id: string;
  date: string; // ISO YYYY-MM-DD
  category: string; 
  description: string;
  amount: number;
  type: TransactionType;
  createdBy: string; // Username/Email of creator
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  planned: number;
  actual: number;
  variance: number;
}

export interface CategorySummary {
  category: string;
  planned: number;
  actual: number;
}

export interface AIAnalysisResult {
  summary: string;
  recommendations: string[];
  status: 'success' | 'error' | 'loading' | 'idle';
}
