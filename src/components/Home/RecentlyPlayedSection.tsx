// src/components/Home/RecentlyPlayedSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Game } from '@/types/game';
import { RecentlyPlayedInfo, getUserRecentlyPlayed } from '@/lib/supabase/db';
import GameCard from '@/components/Games/GameCard';
import styles from '@/app/HomePage.module.css'; // Reuse styles

const getNumberOfGames = () => {
  if (typeof window === 'undefined') return 5;
  if (window.innerHeight < 1000 && window.innerWidth >= 1280) return 4;
  if (window.innerWidth >= 1600) return 6;
  if (window.innerWidth >= 1280) return 5;
  if (window.innerWidth >= 768) return 4;
  return 4;
};

const RecentlyPlayedSection = () => {
    const { user, loading: authLoading } = useAuth();
    const [recentlyPlayed, setRecentlyPlayed] = useState<(Game & RecentlyPlayedInfo)[]>([]);
    const [isLoadingRecent, setIsLoadingRecent] = useState(true);
    const [numGamesToShow, setNumGamesToShow] = useState(5);

    useEffect(() => {
        const handleResize = () => setNumGamesToShow(getNumberOfGames());
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchRecent = async () => {
            if (user) {
                setIsLoadingRecent(true);
                const games = await getUserRecentlyPlayed(user.id, 6);
                setRecentlyPlayed(games);
                setIsLoadingRecent(false);
            } else {
                setRecentlyPlayed([]);
                setIsLoadingRecent(false);
            }
        };

        if (!authLoading) {
            fetchRecent();
        }
    }, [user, authLoading]);

    if (authLoading || !user) {
        return null; // Don't render anything if the user isn't logged in
    }

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Recently Played</h2>
            {isLoadingRecent ? (
                <p className={styles.loadingText}>Loading your recently played games...</p>
            ) : recentlyPlayed.length > 0 ? (
                <div className={styles.gameGrid}>
                    {recentlyPlayed.slice(0, numGamesToShow).map((gameInfo, index) => (
                        <GameCard key={`recent-${gameInfo.id}`} game={gameInfo as Game} priority={index < 6} />
                    ))}
                </div>
            ) : (
                <p className={styles.noItemsText}>
                    You haven&apos;t played any games recently.
                </p>
            )}
        </section>
    );
};

export default RecentlyPlayedSection;