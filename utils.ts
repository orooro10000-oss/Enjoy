import { CONFIG } from './types';

// Format currency for Morocco (e.g. 20.00 د.م.)
export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} ${CONFIG.CURRENCY_SYMBOL}`;
};

// Calculate elapsed time string (HH:MM:SS) to show movement
export const formatDuration = (start: number, end: number = Date.now()): string => {
  const diff = end - start;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  const hDisplay = hours < 10 ? `0${hours}` : hours;
  const mDisplay = minutes < 10 ? `0${minutes}` : minutes;
  const sDisplay = seconds < 10 ? `0${seconds}` : seconds;
  
  return `${hDisplay}:${mDisplay}:${sDisplay}`;
};

// Calculate cost based on duration in milliseconds
export const calculateSessionCost = (startTime: number, endTime: number = Date.now()): number => {
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);
  // Pricing is strictly time-based.
  // 20 MAD per hour.
  const cost = durationHours * CONFIG.HOURLY_RATE;
  // Use Math.round instead of Math.ceil to allow starting at 0.00 for the first minute (~45s)
  // Round to nearest 0.5 MAD
  return Math.round(cost * 2) / 2; 
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};