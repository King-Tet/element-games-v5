// src/app/g/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import GameCard from '@/components/Games/GameCard';
import { Game } from '@/types/game';
import styles from './GamesPage.module.css';
import { getAllGames } from '@/lib/supabase/db';
import { FiChevronDown } from 'react-icons/fi';

type SortOptionValue = 'releaseDate_desc' | 'name_asc' | 'totalVisits_desc';

const GamesPage: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get('category');
  const initialSort = searchParams.get('sort') as SortOptionValue || 'releaseDate_desc';

  const [allGamesData, setAllGamesData] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [currentSort, setCurrentSort] = useState<SortOptionValue>(initialSort);

  const fetchGames = useCallback(async () => {
      setIsLoading(true);
      let orderByField = 'release_date';
      let ascending = false;
      if (currentSort === 'name_asc') {
          orderByField = 'name';
          ascending = true;
      } else if (currentSort === 'totalVisits_desc') {
          orderByField = 'total_visits';
          ascending = false;
      }
      const gamesFromDb = await getAllGames(orderByField, ascending);
      setAllGamesData(gamesFromDb);
      setIsLoading(false);
  }, [currentSort]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (currentSort) params.set('sort', currentSort);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedCategory, currentSort, pathname, router]);

  const handleSortChange = (newSortValue: SortOptionValue) => {
    setCurrentSort(newSortValue);
  };
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  const categories = useMemo(() => {
    if (allGamesData.length === 0) return ['All'];
    const uniqueCategories = new Set(allGamesData.map(game => game.category));
    return ['All', ...Array.from(uniqueCategories).sort()];
  }, [allGamesData]);

  const filteredGames = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') {
      return allGamesData;
    }
    return allGamesData.filter(
      (game) => game.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [allGamesData, selectedCategory]);

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
      ) : filteredGames.length > 0 ? (
        <div className={styles.gamesGrid}>
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <p className={styles.noGamesMessage}>No games found.</p>
      )}
    </div>
  );
};

export default GamesPage;