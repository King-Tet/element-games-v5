// src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Game } from "@/types/game";
import { Tool } from "@/types/tools";
import styles from "./HomePage.module.css";
import GameCard from "@/components/Games/GameCard";
import toolData from "@/data/tools.json";

// Import Supabase helpers
import {
  getNewGames,
  getTrendingGames,
  getUserRecentlyPlayed,
} from "@/lib/supabase/db";
import { RecentlyPlayedInfo } from "@/lib/supabase/db";

// Helper function to determine how many games to show based on screen size
const getNumberOfGames = () => {
  if (typeof window === 'undefined') {
    return 5; // Default for server-side rendering
  }
  // Height override: If the screen is wide but not tall, show 4
  if (window.innerHeight < 1000 && window.innerWidth >= 1280) {
    return 4;
  }
  // Width-based rules
  if (window.innerWidth >= 1600) {
    return 6; // Large desktops
  }
  if (window.innerWidth >= 1280) {
    return 5; // Standard desktops
  }
  if (window.innerWidth >= 768) {
    return 4; // Tablets
  }
  // Mobile fallback (will display as 2x2 grid)
  return 4;
};


const ToolIconLink: React.FC<{ tool: Tool }> = ({ tool }) => {
  const href = tool.sourceType === 'iframe' ? `/t/embed/${tool.id}` : tool.sourcePath;
  return (
    <Link href={href} target={tool.sourceType === 'external' ? '_blank' : '_self'} className={styles.toolLink} title={tool.name}>
      <div className={styles.toolIconWrapper}><span>{tool.name.substring(0, 1)}</span></div>
      <span className={styles.toolName}>{tool.name}</span>
    </Link>
  );
};

const HomePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [trendingGames, setTrendingGames] = useState<Game[]>([]);
  const [newGames, setNewGames] = useState<Game[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<(Game & RecentlyPlayedInfo)[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingNew, setIsLoadingNew] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  // State to hold the number of games to display
  const [numGamesToShow, setNumGamesToShow] = useState(5);

  const featuredTools = toolData.slice(0, 4);

  // Effect to handle window resize and update the number of games to show
  useEffect(() => {
    const handleResize = () => {
      setNumGamesToShow(getNumberOfGames());
    };
    // Set the initial number of games on mount
    handleResize();
    window.addEventListener('resize', handleResize);
    // Cleanup listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Fetch static game lists (Trending, New) on component mount
  useEffect(() => {
    const fetchStaticGames = async () => {
      setIsLoadingTrending(true);
      setIsLoadingNew(true);
      // Always fetch 6 (the max possible) to avoid re-fetching on resize
      const [trending, newG] = await Promise.all([
        getTrendingGames(6),
        getNewGames(6)
      ]);
      setTrendingGames(trending);
      setNewGames(newG);
      setIsLoadingTrending(false);
      setIsLoadingNew(false);
    };
    fetchStaticGames();
  }, []);

  // Fetch user-specific list (Recently Played) when auth state is known
  useEffect(() => {
    const fetchRecent = async () => {
      if (user) {
        setIsLoadingRecent(true);
        // Also fetch the max possible for this list
        const games = await getUserRecentlyPlayed(user.id, 6);
        setRecentlyPlayed(games);
        setIsLoadingRecent(false);
      } else {
        // Clear data if user logs out
        setRecentlyPlayed([]);
        setIsLoadingRecent(false);
      }
    };

    // Only run the fetch function when authentication is no longer loading
    if (!authLoading) {
      fetchRecent();
    }
  }, [user, authLoading]); // Re-run whenever the user or auth loading state changes

  return (
    <div className={styles.homeContainer}>
      {/* Recently Played Section */}
      {!authLoading && user && (
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
      )}

      {/* Trending Games Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Trending Games</h2>
        {isLoadingTrending ? (
          <p className={styles.loadingText}>Loading trending games...</p>
        ) : (
          <>
            <div className={styles.gameGrid}>
              {trendingGames.slice(0, numGamesToShow).map((game, index) => (
                <GameCard key={`trending-${game.id}`} game={game} priority={index < 6} />
              ))}
            </div>
            <Link href="/g" className={`${styles.viewAllLink} ${styles.viewAllGames}`}>
              View All Games →
            </Link>
          </>
        )}
      </section>

      {/* New Games Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>New Games</h2>
        {isLoadingNew ? (
          <p className={styles.loadingText}>Loading new games...</p>
        ) : (
          <>
            <div className={styles.gameGrid}>
              {newGames.slice(0, numGamesToShow).map((game, index) => (
                <GameCard key={`new-${game.id}`} game={game} priority={index < 6} />
              ))}
            </div>
            <Link href="/g" className={`${styles.viewAllLink} ${styles.viewAllGames}`}>
              View All Games →
            </Link>
          </>
        )}
      </section>

      {/* Tools Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Featured Tools</h2>
        <div className={styles.toolsGrid}>
          {featuredTools.map((tool) => (
            <ToolIconLink
              key={`tool-${tool.id}`}
              tool={{ ...tool, sourceType: tool.sourceType as Tool["sourceType"] }}
            />
          ))}
        </div>
        <Link href="/t" className={`${styles.viewAllLink} ${styles.viewAllTools}`}>
          View All Tools →
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
