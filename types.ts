
export enum TransactionType {
  PLANNED = 'PLANNED', // Budget
  ACTUAL = 'ACTUAL'    // Expense
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
  category: string; // Changed from enum to string to support dynamic categories
  description: string;
  amount: number;
  type: TransactionType;
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
