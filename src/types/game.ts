// src/types/game.ts
export interface Game {
    id: string; // Unique identifier, used for URL slug
    name: string;
    description: string;
    imageUrl: string;
    category: string;
    // Existing Firestore fields for rating/visits
    averageRating?: number;
    ratingCount?: number;
    totalVisits?: number;
    // Original static fields (if still used elsewhere, otherwise can remove)
    rating: number; // Example static rating (will be overridden by averageRating)
    visits: number; // Example static visits (will be overridden by totalVisits)
    sourceUrl: string; // Path relative to /public, e.g., /g/source/game-id/index.html
    tags?: string[];
    // NEW field for localStorage sync configuration
    localStorageKeys?: string[]; // Array of keys the game uses for saving
  }