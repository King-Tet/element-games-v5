// src/data/mockLeaderboardGames.ts
import { Game } from '@/types/game'; // Adjust path if needed

// Add more mock games with varied stats
export const mockGamesData: Omit<Game, 'elementGamesScore'>[] = [
  {
    id: "cookie-clicker",
    name: "Cookie Clicker",
    description: "Click cookies!",
    imageUrl: "/game-images/cookie-clicker.png",
    category: "Idle",
    averageRating: 4.35,
    ratingCount: 150,
    totalVisits: 350112,
    totalPlaytimeSeconds: 60 * 60 * 500, // ~500 hours
    rating: 4.2, // Fallback static
    visits: 350112, // Fallback static
    sourceUrl: "/g/source/cookie-clicker/index.html",
    tags: ["idle", "clicker"],
    localStorageKeys: ["CookieClickerGame"],
    leaderboardConfig: { localStorageKey: "CookieClickerGame", scoreType: "jsonPath", scorePath: "cookiesEarned", sortOrder: "high-to-low", scoreMultiplier: 1 }
  },
  {
    id: "slope",
    name: "Slope",
    description: "Roll down!",
    imageUrl: "/game-images/slope.png",
    category: "Arcade",
    averageRating: 4.62,
    ratingCount: 210,
    totalVisits: 289567,
    totalPlaytimeSeconds: 60 * 60 * 120, // ~120 hours
    rating: 4.5,
    visits: 289567,
    sourceUrl: "/g/source/slope/index.html",
    tags: ["3d", "endless"],
    localStorageKeys: ["slope_high_score"], // Example key
    leaderboardConfig: { localStorageKey: "slope_high_score", scoreType: "number", sortOrder: "high-to-low" }
  },
  {
    id: "retro-bowl",
    name: "Retro Bowl",
    description: "Football time!",
    imageUrl: "/game-images/retro-bowl.png",
    category: "Sports",
    averageRating: 4.81,
    ratingCount: 350,
    totalVisits: 152043,
    totalPlaytimeSeconds: 60 * 60 * 300, // ~300 hours
    rating: 4.8,
    visits: 152043,
    sourceUrl: "/g/source/retro-bowl/index.html",
    tags: ["football", "sports"],
    localStorageKeys: ["RetroBowl.0.Team.0"], // Example key
    // No specific high score leaderboard config in this example
  },
  {
    id: "2048",
    name: "2048",
    description: "Combine tiles!",
    imageUrl: "/game-images/2048.png",
    category: "Puzzle",
    averageRating: 4.55,
    ratingCount: 180,
    totalVisits: 198754,
    totalPlaytimeSeconds: 60 * 60 * 80, // ~80 hours
    rating: 4.6,
    visits: 198754,
    sourceUrl: "/g/source/2048/index.html",
    tags: ["puzzle", "math"],
    localStorageKeys: ["gameState"], // Example key
    leaderboardConfig: { localStorageKey: "gameState", scoreType: "jsonPath", scorePath: "score", sortOrder: "high-to-low" }
  },
   {
    id: "tetris",
    name: "Tetris",
    description: "Classic Blocks",
    imageUrl: "/game-images/tetris.png",
    category: "Puzzle",
    averageRating: 4.91,
    ratingCount: 410,
    totalVisits: 410239,
    totalPlaytimeSeconds: 60 * 60 * 250, // ~250 hours
    rating: 4.9,
    visits: 410239,
    sourceUrl: "/g/source/tetris/index.html",
    tags: ["classic", "puzzle"],
    localStorageKeys: ["tetris_state"], // Example key
    leaderboardConfig: { localStorageKey: "tetris_state", scoreType: "jsonPath", scorePath: "highScore", sortOrder: "high-to-low" }
  },
  // Add 5-10 more mock games with varying stats
  {
    id: "drift-boss",
    name: "Drift Boss",
    description: "Drift King!",
    imageUrl: "/game-images/drift-boss.png", // Add image if you have one
    category: "Racing",
    averageRating: 4.40,
    ratingCount: 120,
    totalVisits: 220500,
    totalPlaytimeSeconds: 60 * 60 * 90, // ~90 hours
    rating: 4.4,
    visits: 220500,
    sourceUrl: "/g/source/drift-boss/index.html",
    tags: ["racing", "drift"],
    localStorageKeys: ["mjs-drift-boss-game-v1.0.1-dailyreward"], // Your verified key
    leaderboardConfig: { localStorageKey: "mjs-drift-boss-game-v1.0.1-dailyreward", scoreType: "jsonPath", scorePath: "score", sortOrder: "high-to-low" } // Use correct key
  },
    {
    id: "1v1-lol",
    name: "1v1.LOL",
    description: "Build & Battle",
    imageUrl: "/game-images/1v1-lol.png", // Add image
    category: "Action",
    averageRating: 4.15,
    ratingCount: 300,
    totalVisits: 550000,
    totalPlaytimeSeconds: 60 * 60 * 400, // ~400 hours
    rating: 4.1,
    visits: 550000,
    sourceUrl: "/g/source/1v1-lol/index.html",
    tags: ["shooter", "building", "multiplayer"],
    localStorageKeys: ["player_stats", "settings"], // Example keys
    // No specific score leaderboard for this example
  },
];