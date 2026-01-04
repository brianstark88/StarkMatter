import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number): string {
  const formatted = value.toFixed(2);
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatted}%`;
}

export function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toString();
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-500';
}

export function getChangeBackgroundColor(value: number): string {
  if (value > 0) return 'bg-green-50 dark:bg-green-950';
  if (value < 0) return 'bg-red-50 dark:bg-red-950';
  return 'bg-gray-50 dark:bg-gray-950';
}

export function getSentimentColor(score: number): string {
  if (score >= 0.6) return 'text-green-500';
  if (score >= 0.4) return 'text-yellow-500';
  return 'text-red-500';
}

export function getSignalColor(signal: 'BUY' | 'SELL' | 'HOLD'): string {
  switch (signal) {
    case 'BUY':
      return 'text-green-500';
    case 'SELL':
      return 'text-red-500';
    case 'HOLD':
    default:
      return 'text-yellow-500';
  }
}