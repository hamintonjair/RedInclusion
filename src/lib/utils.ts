import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseLocalDate(date: string | Date): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), 12, 0, 0);
    }
  }
  return new Date(date);
}

export function formatDate(date: string | Date) {
  if (!date) return 'N/A';
  const dateObj = parseLocalDate(date);
  if (isNaN(dateObj.getTime())) return 'Fecha inválida';
  
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
}

