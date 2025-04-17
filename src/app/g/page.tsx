// src/app/g/page.tsx
// No longer needs 'use client' for basic data fetching, but WILL need it
// if we keep the client-side filtering/sorting controls interactive.
// Let's keep it client-side for now to maintain filter interactivity.
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import GameCard from '@/components/Games/GameCard';
import { Game } from '@/types/game';
import styles from './GamesPage.module.css';
// No longer importing static data
// import gameData from '@/data/games.json';
import { getAllGames } from '@/lib/firebase/firestore'; // Import Firestore helper

const GamesPage: React.FC = () => {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');

  const [allGames, setAllGames] = useState<Game[]>([]); // State to hold games
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);

  // Fetch games from Firestore on component mount
  useEffect(() => {
    const fetchGames = async () => {
      setIsLoading(true);
      const gamesFromDb = await getAllGames('name', 'asc'); // Fetch sorted by name
      setAllGames(gamesFromDb);
      setIsLoading(false);
    };
    fetchGames();
  }, []); // Empty dependency array runs once

  // Update selectedCategory state if the URL query param changes
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Derive unique categories from the *fetched* game data
  const categories = useMemo(() => {
     if (isLoading || allGames.length === 0) return ['All']; // Default while loading/empty
    const uniqueCategories = new Set(allGames.map(game => game.category));
    return ['All', ...Array.from(uniqueCategories).sort()];
  }, [allGames, isLoading]); // Depends on fetched games

  // Filter games based on the selected category
  const filteredGames = useMemo(() => {
    if (isLoading) return []; // Don't filter while loading
    if (!selectedCategory || selectedCategory === 'All') {
      return allGames;
    }
    return allGames.filter(
      (game) => game.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [allGames, selectedCategory, isLoading]); // Depends on fetched games & category

  return (
    <div className={styles.gamesContainer}>
      <div className={styles.header}>
         <h1>Games</h1>
         {/* Add sorting controls here later */}
      </div>

       {/* Category Filter Buttons */}
       <div className={styles.categoryFilter}>
          {/* Only render categories once games are loaded */}
          {!isLoading && categories.map(category => (
              <Link
                  key={category}
                  href={category === 'All' ? '/g' : `/g?category=${category.toLowerCase()}`}
                  passHref
                  scroll={false}
              >
                 <button
                     className={`${styles.categoryButton} ${
                        (selectedCategory === category.toLowerCase() || (category === 'All' && !selectedCategory))
                            ? styles.active
                            : ''
                        }`}
                     // Basic client-side category update
                     onClick={() => setSelectedCategory(category === 'All' ? null : category.toLowerCase())}
                  >
                      {category}
                  </button>
              </Link>
          ))}
          {isLoading && <div className={styles.filterLoader}>Loading filters...</div>}
       </div>

      {/* Games Grid */}
      {isLoading ? (
        <div className={styles.loadingMessage}>Loading games...</div>
      ) : filteredGames.length > 0 ? (
         <div className={styles.gamesGrid}>
            {/* Pass Firestore data (totalVisits, averageRating) to GameCard */}
            {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} />
            ))}
        </div>
      ) : (
        <p className={styles.noGamesMessage}>
            No games found{selectedCategory ? ` in the "${selectedCategory}" category` : ''}.
        </p>
      )}
    </div>
  );
};

export default GamesPage;