// src/app/g/GamesPageClient.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import GameCard from '@/components/Games/GameCard';
import { Game } from '@/types/game';
import styles from './GamesPage.module.css';
import { FiChevronDown } from 'react-icons/fi';

type SortOptionValue = 'releaseDate_desc' | 'name_asc' | 'totalVisits_desc';

// Define props to accept initial games from the server
interface GamesPageClientProps {
  initialGames: Game[];
}

export default function GamesPageClient({ initialGames }: GamesPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get('category');
  const initialSort = searchParams.get('sort') as SortOptionValue || 'releaseDate_desc';
  
  // Use the prop from the server as the initial state
  const [allGamesData] = useState<Game[]>(initialGames);
  const [isLoading] = useState(false); // No client-side loading needed anymore

  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [currentSort, setCurrentSort] = useState<SortOptionValue>(initialSort);

  // This effect now only syncs state with the URL, no data fetching
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (currentSort) params.set('sort', currentSort);
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [selectedCategory, currentSort, pathname, router]);

  const handleSortChange = (newSortValue: SortOptionValue) => {
    setCurrentSort(newSortValue);
  };
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  const categories = useMemo(() => {
    const uniqueCategories = new Set(allGamesData.map(game => game.category));
    return ['All', ...Array.from(uniqueCategories).sort()];
  }, [allGamesData]);
  
  // This logic now sorts and filters the data passed from the server
  const displayedGames = useMemo(() => {
    let games = [...allGamesData]; 

    switch (currentSort) {
      case 'name_asc':
        games.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'totalVisits_desc':
        games.sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0));
        break;
      case 'releaseDate_desc':
      default:
        games.sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime());
        break;
    }
    
    if (!selectedCategory || selectedCategory === 'All') {
      return games;
    }
    return games.filter(
      (game) => game.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [allGamesData, selectedCategory, currentSort]);


  return (
    <div className={styles.gamesContainer}>
      <div className={styles.header}>
        <h1>Games</h1>
        <div className={styles.controlsContainer}>
          <div className={styles.sortDropdownContainer}>
            <label htmlFor="sort-select" className={styles.sortLabel}>Sort by:</label>
            <div className={styles.selectWrapper}>
              <select
                id="sort-select"
                value={currentSort}
                onChange={(e) => handleSortChange(e.target.value as SortOptionValue)}
                className={styles.sortSelect}
              >
                <option value="releaseDate_desc">Newest</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="totalVisits_desc">Most Popular</option>
              </select>
              <FiChevronDown className={styles.selectArrow} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.categoryFilter}>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category === 'All' ? null : category)}
            className={`${styles.categoryButton} ${
              ((!selectedCategory && category === 'All') || selectedCategory === category) ? styles.active : ''
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className={styles.loadingMessage}>Loading games...</div>
      ) : displayedGames.length > 0 ? (
        <div className={styles.gamesGrid}>
          {displayedGames.map((game, index) => (
            <GameCard key={game.id} game={game} priority={index < 10} />
          ))}
        </div>
      ) : (
        <p className={styles.noGamesMessage}>No games found.</p>
      )}
    </div>
  );
}