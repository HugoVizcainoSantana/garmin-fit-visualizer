import i18next from '@/i18n';

// Data formatting utilities
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '--';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const formatDistance = (meters: number): string => {
  if (!meters || meters < 0) return '--';
  return (meters / 1000).toFixed(2);
};

export const formatPace = (speedMs: number): string => {
  if (!speedMs || speedMs <= 0) return '--';
  
  const paceMinKm = 1000 / (speedMs * 60);
  const minutes = Math.floor(paceMinKm);
  const seconds = Math.round((paceMinKm - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatDate = (date: Date): string => {
  if (!date) return '--';
  
  return new Intl.DateTimeFormat(i18next.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (value instanceof Date) {
    return formatDate(value);
  }
  return String(value);
};

export const formatKey = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

// Array utilities
export const average = (arr: number[]): number => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
};

export const max = (arr: number[]): number => {
  if (!arr || arr.length === 0) return 0;
  return Math.max(...arr);
};

export const min = (arr: number[]): number => {
  if (!arr || arr.length === 0) return 0;
  return Math.min(...arr);
};

// Validation utilities
export const isValidFitFile = (file: File): boolean => {
  return file && file.name.toLowerCase().endsWith('.fit');
};

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (!isValidFitFile(file)) {
    return { valid: false, error: 'Please upload a .FIT file' };
  }
  
  if (file.size > 50 * 1024 * 1024) { // 50MB limit
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }
  
  return { valid: true };
};

// Color utilities for charts
export const getChartColors = (): { primary: string; secondary: string; tertiary: string } => {
  return {
    primary: '#00d4ff',
    secondary: '#7c3aed',
    tertiary: '#10b981'
  };
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Deep clone utility
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any };
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj as T;
  }
  return obj;
};

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Check if value is empty
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};