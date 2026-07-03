import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
}

export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', { 
    hour: '2-digit', minute: '2-digit'
  }).format(date);
}
