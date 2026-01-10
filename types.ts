
export type StationType = 'PS5' | 'PS4';

export interface Station {
  id: string;
  name: string;
  type: StationType;
  status: 'AVAILABLE' | 'BUSY';
  currentSessionId?: string;
  startTime?: number; // timestamp
  targetEndTime?: number; // timestamp (New: for countdown)
  currentMatchCount?: number;
}

export interface Session {
  id: string;
  stationId: string;
  stationName: string;
  startTime: number;
  endTime?: number;
  durationMinutes: number;
  sessionCost: number; // تكلفة الوقت
  matchCount: number;
  matchCost: number;   // تكلفة المباريات
  foodCost?: number;   // تكلفة المأكولات (New)
  totalCost: number;
  isPaid: boolean;
  notes?: string;
}

export interface Expense {
  id: string;
  category: string; // e.g., 'Rent', 'Electricity', 'Snacks', 'Maintenance'
  amount: number;
  description: string;
  timestamp: number;
}

export interface CreditEntry {
  id: string;
  customerName: string;
  playAmount: number;     // مبلغ اللعب
  foodAmount: number;     // مبلغ المأكولات والمشروبات
  totalAmount: number;    // المجموع (المتبقي)
  isPaid: boolean;        // هل تم سداده بالكامل؟
  timestamp: number;
  notes?: string;
}

export interface CreditTransaction {
  id: string;
  creditId: string;
  amount: number;
  type: 'PLAY' | 'FOOD';
  timestamp: number;
}

export interface StoreTransaction {
  id: string;
  productName: string;
  amount: number;
  timestamp: number;
}

export interface DailyStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalSessions: number;
  utilization: number; // percentage
}

// Fixed Business Logic Configuration
export const CONFIG = {
  HOURLY_RATE: 20, // MAD
  MATCH_PRICE_PS5: 5, // MAD
  MATCH_PRICE_PS4: 4, // MAD
  CURRENCY_SYMBOL: 'د.م.',
  CURRENCY_CODE: 'MAD',
};

export const DEFAULT_STATIONS: Station[] = [
  { id: '1', name: 'Post 1', type: 'PS5', status: 'AVAILABLE' },
  { id: '2', name: 'Post 2', type: 'PS5', status: 'AVAILABLE' },
  { id: '3', name: 'Post 3', type: 'PS5', status: 'AVAILABLE' },
  { id: '4', name: 'Post 4', type: 'PS4', status: 'AVAILABLE' },
];

export const EXPENSE_CATEGORIES = [
  'مشروبات ووجبات', // Drinks/Snacks
  'صيانة', // Maintenance
  'كهرباء/انترنت', // Utilities
  'أخرى', // Other
];

export const QUICK_PRICES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 15, 20];
