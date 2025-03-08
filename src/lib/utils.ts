import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets the application URL based on environment
 * Automatically uses window.location.origin in the browser
 * Falls back to environment variable or localhost in server context
 */
export function getAppUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use the current origin
    return window.location.origin;
  }
  
  // Server-side: use environment variable with fallback
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
