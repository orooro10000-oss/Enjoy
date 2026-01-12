
// Keys for LocalStorage
export const DB_KEYS = {
  STATIONS: 'PL_STATIONS_V1',
  SESSIONS: 'PL_SESSIONS_V1',
  EXPENSES: 'PL_EXPENSES_V1',
  CREDITS: 'PL_CREDITS_V1',
  CREDIT_TRANSACTIONS: 'PL_CREDIT_TRANSACTIONS_V1',
  STORE_TRANSACTIONS: 'PL_STORE_TRANSACTIONS_V1',
  CART: 'PL_CART_V1', // Optional: persist cart
};

// Generic Load Function
export const loadFromDB = <T>(key: string, defaultValue: T): T => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error(`Error loading data for key "${key}":`, error);
    return defaultValue;
  }
};

// Generic Save Function
export const saveToDB = <T>(key: string, data: T): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving data for key "${key}":`, error);
    // Handle QuotaExceededError if necessary (rare for text data)
  }
};

// Clear Database (Factory Reset)
export const clearDB = () => {
  try {
    Object.values(DB_KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  } catch (error) {
    console.error("Error clearing database:", error);
  }
};
