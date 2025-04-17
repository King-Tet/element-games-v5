// src/lib/localStorage.ts

// Ensure functions are only called on the client-side

export function getLocalStorageItem(key: string): string | null {
    // Check if window object is available (runs only in browser)
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null; // Return null during SSR or prerendering
  }
  
  export function setLocalStorageItem(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }
  
  export function removeLocalStorageItem(key: string): void {
      if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
      }
  }