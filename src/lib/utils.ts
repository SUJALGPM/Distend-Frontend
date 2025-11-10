import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const [day, month, year] = dateString.split('/');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function getAttendanceColor(percentage: number): string {
  if (percentage >= 75) return 'safe-green';
  if (percentage >= 65) return 'warning-yellow';
  return 'defaulter-red';
}

export function getAttendanceStatus(percentage: number): string {
  if (percentage >= 75) return 'Safe';
  if (percentage >= 65) return 'Warning';
  return 'Defaulter';
}