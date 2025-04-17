// src/app/account/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import styles from './AccountPage.module.css';
import { FiLogOut, FiClock, FiStar, FiPlayCircle } from 'react-icons/fi'; // Added icons

// Import Firestore helper functions & types
import {
    getUserRecentlyPlayed,
    RecentlyPlayedInfo,
    getUserRatedGames,
    RatedGameInfo
} from '@/lib/firebase/firestore';
import { Game } from '@/types/game'; // Import Game type

// Helper to format timestamp (optional)
const formatTimestamp = (timestamp: any): string => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
        return 'N/A';
    }
    try {
        return timestamp.toDate().toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

// Simple card component for stats
const StatsGameCard: React.FC<{ game: Game; children?: React.ReactNode }> = ({ game, children }) => (
    <Link href={`/g/play/${game.id}`} className={styles.statsCard}>
        <img src={game.imageUrl} alt={game.name} className={styles.statsCardImage} loading="lazy"/>
        <div className={styles.statsCardInfo}>
            <span className={styles.statsCardTitle}>{game.name}</span>
            {children} {/* For displaying rating or last played */}
        </div>
    </Link>
);


const AccountPage: React.FC = () => {
  const { user, loading: authLoading, signOutUser } = useAuth();
  const router = useRouter();

  // State for user stats
  const [recentlyPlayed, setRecentlyPlayed] = useState<(Game & RecentlyPlayedInfo)[]>([]);
  const [ratedGames, setRatedGames] = useState<RatedGameInfo[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Effect to redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Effect to fetch user stats once logged in
  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        setIsLoadingStats(true);
        // Fetch both in parallel
        const [recentData, ratedData] = await Promise.all([
          getUserRecentlyPlayed(user.uid, 5), // Get top 5 recent
          getUserRatedGames(user.uid), // Get all rated games
        ]);
        setRecentlyPlayed(recentData);
        setRatedGames(ratedData);
        setIsLoadingStats(false);
      } else {
        // Clear stats if user logs out
        setRecentlyPlayed([]);
        setRatedGames([]);
        setIsLoadingStats(false);
      }
    };

    if (!authLoading) { // Only fetch when auth state is confirmed
        fetchStats();
    }

  }, [user, authLoading]); // Rerun if user logs in/out

  const handleSignOut = async () => {
    try {
      await signOutUser();
      // Redirect is handled by the useEffect above
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  // Display loading state or null if redirecting
  if (authLoading || !user) {
    return <div className={styles.loading}>Loading account details...</div>;
  }

  return (
    <div className={styles.accountContainer}>
      <h1>Account Details</h1>

      {/* --- Profile Info --- */}
      <section className={styles.section}>
        <h2>Profile</h2>
        <div className={styles.profileSection}>
            {user.photoURL && (
            <img
                src={user.photoURL}
                alt="User Avatar"
                className={styles.avatar}
                referrerPolicy="no-referrer"
            />
            )}
            <div className={styles.userInfo}>
            <p>
                <strong>Name:</strong> {user.displayName || 'N/A'}
            </p>
            <p>
                <strong>Email:</strong> {user.email || 'N/A'}
            </p>
            {/* <p><strong>UID:</strong> {user.uid}</p> */}
            </div>
        </div>
      </section>

      {/* --- Game Stats --- */}
       <section className={styles.section}>
            <h2>Game Stats</h2>
             {isLoadingStats ? (
                <div className={styles.loadingStats}>Loading stats...</div>
             ) : (
                <>
                    {/* Recently Played */}
                    <div className={styles.statsSubSection}>
                        <h3>Recently Played</h3>
                         {recentlyPlayed.length > 0 ? (
                            <div className={styles.statsGrid}>
                                {recentlyPlayed.map(gameInfo => (
                                    <StatsGameCard key={`recent-${gameInfo.id}`} game={gameInfo}>
                                        <span className={styles.statsCardDetail}>
                                            <FiClock /> Last Played: {formatTimestamp(gameInfo.lastPlayed)}
                                        </span>
                                        {/* Optionally display playtime */}
                                        {/* {gameInfo.playtimeSeconds && (
                                            <span className={styles.statsCardDetail}>
                                                <FiPlayCircle /> Playtime: {Math.round(gameInfo.playtimeSeconds / 60)} min
                                            </span>
                                        )} */}
                                    </StatsGameCard>
                                ))}
                            </div>
                         ) : (
                             <p className={styles.noStatsMessage}>You haven't played any games recently.</p>
                         )}
                    </div>

                    {/* Rated Games */}
                     <div className={styles.statsSubSection}>
                         <h3>Your Ratings</h3>
                         {ratedGames.length > 0 ? (
                            <div className={styles.statsGrid}>
                                 {ratedGames.map(ratedInfo => (
                                    <StatsGameCard key={`rated-${ratedInfo.id}`} game={ratedInfo}>
                                         <span className={styles.statsCardDetail + ' ' + styles.userRating}>
                                            <FiStar /> You rated: {ratedInfo.userRating} / 5
                                        </span>
                                         <span className={styles.statsCardDetail}>
                                            <FiClock /> Rated on: {formatTimestamp(ratedInfo.ratedAt)}
                                        </span>
                                    </StatsGameCard>
                                ))}
                            </div>
                         ) : (
                            <p className={styles.noStatsMessage}>You haven't rated any games yet.</p>
                         )}
                     </div>
                </>
             )}
       </section>

      <button onClick={handleSignOut} className={styles.signOutButton}>
        <FiLogOut /> Sign Out
      </button>
    </div>
  );
};

export default AccountPage;