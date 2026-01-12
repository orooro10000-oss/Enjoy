import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Station, Session, Expense, CreditEntry, CreditTransaction, StoreTransaction } from './types';

// Define the Database Schema
interface PlayLoungeDB extends DBSchema {
  stations: {
    key: string;
    value: Station;
  };
  sessions: {
    key: string;
    value: Session;
  };
  expenses: {
    key: string;
    value: Expense;
  };
  credits: {
    key: string;
    value: CreditEntry;
  };
  credit_transactions: {
    key: string;
    value: CreditTransaction;
  };
  store_transactions: {
    key: string;
    value: StoreTransaction;
  };
  cart: {
    key: string;
    value: any; // Cart items
  };
}

const DB_NAME = 'PlayLoungeDB_Pro';
const DB_VERSION = 1;

// Initialize Database
export const initDB = async (): Promise<IDBPDatabase<PlayLoungeDB>> => {
  return openDB<PlayLoungeDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create Object Stores if they don't exist
      if (!db.objectStoreNames.contains('stations')) {
        db.createObjectStore('stations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('expenses')) {
        db.createObjectStore('expenses', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('credits')) {
        db.createObjectStore('credits', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('credit_transactions')) {
        db.createObjectStore('credit_transactions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('store_transactions')) {
        db.createObjectStore('store_transactions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cart')) {
        db.createObjectStore('cart', { keyPath: 'id' });
      }
    },
  });
};

// --- Operations ---

// Load all items from a store
export const loadFromDB = async <T>(storeName: keyof PlayLoungeDB): Promise<T[]> => {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName as any, 'readonly');
    const store = tx.objectStore(storeName as any);
    const allItems = await store.getAll();
    await tx.done;
    return allItems as T[];
  } catch (error) {
    console.error(`DB Load Error [${String(storeName)}]:`, error);
    return [];
  }
};

// Save (Sync) an entire array to a store (Clear & Add All)
// NOTE: This approach is used to keep compatibility with React State full-array updates.
// In a highly optimized app, we would use add/put for single items, but for < 10,000 items this is instant in IDB.
export const saveToDB = async <T extends { id: string }>(
  storeName: keyof PlayLoungeDB, 
  items: T[]
): Promise<void> => {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName as any, 'readwrite');
    const store = tx.objectStore(storeName as any);
    
    // Clear existing data to ensure the DB reflects the current State exactly
    // This handles deletions properly
    await store.clear();
    
    // Batch add all items
    for (const item of items) {
      await store.put(item);
    }
    
    await tx.done;
  } catch (error) {
    console.error(`DB Save Error [${String(storeName)}]:`, error);
  }
};

// Factory Reset
export const clearDB = async () => {
  try {
    const db = await initDB();
    const stores = db.objectStoreNames;
    
    // Clear all stores
    for (const storeName of stores) {
       const tx = db.transaction(storeName, 'readwrite');
       await tx.objectStore(storeName).clear();
       await tx.done;
    }
    window.location.reload();
  } catch (error) {
    console.error("Error clearing database:", error);
  }
};

// Helper keys constant for consistency with App.tsx mapping (although we map directly to store names now)
export const DB_STORES = {
  STATIONS: 'stations',
  SESSIONS: 'sessions',
  EXPENSES: 'expenses',
  CREDITS: 'credits',
  CREDIT_TRANSACTIONS: 'credit_transactions',
  STORE_TRANSACTIONS: 'store_transactions',
  CART: 'cart',
} as const;