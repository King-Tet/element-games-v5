// src/types/game.ts

// Define structure for a single leaderboard configuration
export interface LeaderboardConfig {
  id: string; // Unique ID for this leaderboard, e.g., "level-1" or "endless_mode"
  displayName: string; // User-friendly name, e.g., "Level 1 Score" or "Endless Mode"
  localStorageKey: string;
  scoreType: 'number' | 'jsonPath';
  scorePath?: string;
  unit?: 'number' | 'ms' | 'seconds' | 'minutes'; // Defines the unit of the score
  sortOrder: 'high-to-low' | 'low-to-high';
  scoreMultiplier?: number;
}


export interface IndexedDbConfig {
  dbName: string;
  storeName: string;
  keyPattern: string;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  // --- Stats Fields (from Firestore/Calculated) ---
  averageRating?: number; // Optional because it might not be calculated yet
  ratingCount?: number;   // Optional
  totalVisits?: number;   // Optional
  totalPlaytimeSeconds?: number; // Optional
  elementGamesScore?: number; // Optional (calculated EGS)
  // --- Static Fallback Fields ---
  rating: number; // Keep for fallback display if needed
  visits: number; // Keep for fallback display if needed
  // --- Config Fields ---
  sourceUrl: string;
  tags?: string[];
  localStorageKeys?: string[];
  indexedDbConfig?: IndexedDbConfig;
  leaderboardConfigs?: LeaderboardConfig[]; // Changed to an array for multiple leaderboards
  releaseDate: string | null;
}
