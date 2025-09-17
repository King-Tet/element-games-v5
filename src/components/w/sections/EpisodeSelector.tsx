// components/w/sections/EpisodeSelector.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './EpisodeSelector.module.css';

// Define the shape of the season data from the TMDB API
interface Season {
  air_date: string | null;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
}

interface EpisodeSelectorProps {
  tvId: number;
  seasons: Season[];
}

const EpisodeSelector = ({ tvId, seasons }: EpisodeSelectorProps) => {
  // Filter out "Specials" (season_number: 0) which often have inconsistent data
  const validSeasons = seasons.filter(s => s.season_number > 0);
  
  // Default to the first valid season, or 1 if none exist
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(validSeasons[0]?.season_number ?? 1);

  // Find the full data for the currently selected season
  const selectedSeason = validSeasons.find(s => s.season_number === selectedSeasonNumber);

  return (
    <div className={styles.selectorContainer}>
      <div className={styles.seasonSelector}>
        <label htmlFor="season-select" className={styles.seasonLabel}>Season</label>
        <select
          id="season-select"
          value={selectedSeasonNumber}
          onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
          className={styles.seasonDropdown}
        >
          {validSeasons.map(season => (
            <option key={season.id} value={season.season_number}>
              {season.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.episodeList}>
        {/* Create a placeholder array to map over for episode links */}
        {selectedSeason && Array.from({ length: selectedSeason.episode_count }, (_, i) => i + 1).map(episodeNumber => (
          <Link
            key={`${selectedSeason.id}-${episodeNumber}`}
            href={`/w/tv/${tvId}/${selectedSeason.season_number}/${episodeNumber}`}
            className={styles.episodeLink}
          >
            Episode {episodeNumber}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EpisodeSelector;
