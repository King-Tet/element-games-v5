// src/types/watch.ts
export interface MediaWatchProgress {
  mediaId: string;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  lastWatchedSeason?: number;
  lastWatchedEpisode?: number;
  progressSeconds?: number;
  lastWatched: string; // ISO 8601 timestamp
}