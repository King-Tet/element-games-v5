// src/types/leaderboard.ts
export interface GameLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  score: number;
  lastPlayed: string; // ISO timestamp string
}
