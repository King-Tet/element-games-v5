// src/app/account/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './AccountPage.module.css';
import { FiLogOut, FiClock, FiStar, FiPlayCircle, FiRefreshCw } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/client';

// Import Supabase helper functions & types
import {
    getUserRecentlyPlayed,
    RecentlyPlayedInfo,
    getUserRatedGames,
    RatedGameInfo
} from '@/lib/supabase/db'; // Updated import
import { Game } from '@/types/game';

// Helper to format timestamp
const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) {
        return 'N/A';
    }
    try {
        return new Date(timestamp).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting timestamp:", e);
        return 'Invalid Date';
    }
}

// Simple card component for stats display
const StatsGameCard: React.FC<{ game: Game; children?: React.ReactNode }> = ({ game, children }) => (
    <Link href={`/g/play/${game.id}`} className={styles.statsCard}>
        <img
            src={game.imageUrl || '/game-images/default-placeholder.png'}
            alt={game.name}
            className={styles.statsCardImage}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = '/game-images/default-placeholder.png'; }}
        />
        <div className={styles.statsCardInfo}>
            <span className={styles.statsCardTitle}>{game.name}</span>
            {children}
        </div>
    </Link>
);


const AccountPage: React.FC = () => {
  const { user, userProfile, loading: authLoading, signOutUser, reloadUserProfile, profileVersion } = useAuth();
  const router = useRouter();

  const [recentlyPlayed, setRecentlyPlayed] = useState<(Game & RecentlyPlayedInfo)[]>([]);
  const [ratedGames, setRatedGames] = useState<RatedGameInfo[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      console.log("[AccountPage] Not logged in, redirecting to home.");
      router.replace('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        console.log("[AccountPage] Fetching user game stats...");
        setIsLoadingStats(true);
        try {
          const [recentData, ratedData] = await Promise.all([
            getUserRecentlyPlayed(user.id, 5), // Using Supabase user.id
            getUserRatedGames(user.id),       // Using Supabase user.id
          ]);
          setRecentlyPlayed(recentData);
          setRatedGames(ratedData);
        } catch (error) {
           console.error("[AccountPage] Error fetching user stats:", error);
        } finally {
             setIsLoadingStats(false);
        }
      } else {
         setIsLoadingStats(false);
         setRecentlyPlayed([]);
         setRatedGames([]);
      }
    };

    if (!authLoading && user) {
        fetchStats();
    } else if (!authLoading && !user) {
        setIsLoadingStats(false);
    }
  }, [user, authLoading]);

  const handleSignOut = async () => {
    console.log("[AccountPage] Signing out...");
    try {
      await signOutUser();
      console.log("[AccountPage] Sign out successful.");
    } catch (error) {
      console.error("[AccountPage] Failed to sign out:", error);
    }
  };

  const updateAvatar = async (url: string) => {
    setIsSaving(true);
    setSaveMessage('');

    let finalUrl = url;
    if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You are not logged in.');

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ avatarUrl: finalUrl }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update profile picture.');

      setSaveMessage('Profile picture updated successfully!');
      setAvatarUrl('');
      await reloadUserProfile();
    } catch (error: any) {
      setSaveMessage(`Error: ${error.message}`);
      console.error(error);
    }
    setIsSaving(false);
  };

  const handleAvatarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarUrl.trim()) {
        setSaveMessage('Please enter a valid URL.');
        return;
    }
    updateAvatar(avatarUrl);
  };

  const handleSyncWithGoogle = () => {
    const googleAvatarUrl = user?.user_metadata?.avatar_url;
    if (googleAvatarUrl) {
        updateAvatar(googleAvatarUrl);
    } else {
        setSaveMessage("Could not find a Google avatar to sync.");
    }
  };

  if (authLoading) {
    return <div className={styles.loading}>Loading account...</div>;
  }

  if (!user) {
      return <div className={styles.loading}>Not logged in. Redirecting...</div>;
  }

  return (
    <div className={styles.accountContainer}>
      <h1>Account Details</h1>

      <section className={styles.section}>
        <h2>Profile</h2>
        <div className={styles.profileSection}>
            {(userProfile?.avatar_url || user.user_metadata.avatar_url) && (
            <img
                src={`${userProfile?.avatar_url || user.user_metadata.avatar_url || '/default-avatar.png'}?v=${profileVersion}`}
                alt="User Avatar"
                className={styles.avatar}
                referrerPolicy="no-referrer"
            />
            )}
            <div className={styles.userInfo}>
            {userProfile?.username && (
                 <p>
                    <strong>Username:</strong> {userProfile.username}
                 </p>
            )}
            <p>
                <strong>Display Name:</strong> {userProfile?.display_name || user.user_metadata.full_name || 'N/A'}
            </p>
            <p>
                <strong>Email:</strong> {user.email || 'N/A'}
            </p>
            </div>
        </div>
        <form onSubmit={handleAvatarSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="avatarUrl">Change Profile Picture</label>
            <input
              type="text"
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Enter a new image URL"
              className={styles.inputField}
            />
          </div>
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.saveButton} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save New Picture'}
            </button>
            <button type="button" className={styles.syncButton} disabled={isSaving} onClick={handleSyncWithGoogle}>
              <FiRefreshCw /> Sync with Google
            </button>
          </div>
          {saveMessage && <p className={styles.saveMessage}>{saveMessage}</p>}
        </form>
      </section>

       <section className={styles.section}>
            <h2>Game Stats</h2>
             {isLoadingStats ? (
                <div className={styles.loadingStats}>Loading your game stats...</div>
             ) : (
                <>
                    <div className={styles.statsSubSection}>
                        <h3>Recently Played</h3>
                         {recentlyPlayed.length > 0 ? (
                            <div className={styles.statsGrid}>
                                {recentlyPlayed.map(gameInfo => (
                                    <StatsGameCard key={`recent-${gameInfo.id}`} game={gameInfo}>
                                        <span className={styles.statsCardDetail}>
                                            <FiClock /> Last Played: {formatTimestamp(gameInfo.last_played)}
                                        </span>
                                        {gameInfo.playtime_seconds !== undefined && gameInfo.playtime_seconds > 0 && (
                                            <span className={styles.statsCardDetail}>
                                                <FiPlayCircle /> Playtime: {Math.round(gameInfo.playtime_seconds / 60)} min
                                            </span>
                                        )}
                                    </StatsGameCard>
                                ))}
                            </div>
                         ) : (
                             <p className={styles.noStatsMessage}>You haven't played any games recently.</p>
                         )}
                    </div>

                     <div className={styles.statsSubSection}>
                         <h3>Your Ratings</h3>
                         {ratedGames.length > 0 ? (
                            <div className={styles.statsGrid}>
                                 {ratedGames.map(ratedInfo => (
                                    <StatsGameCard key={`rated-${ratedInfo.id}`} game={ratedInfo}>
                                         <span className={`${styles.statsCardDetail} ${styles.userRating}`}>
                                            <FiStar /> You rated: {ratedInfo.rating} / 5
                                        </span>
                                         <span className={styles.statsCardDetail}>
                                            <FiClock /> Rated on: {formatTimestamp(ratedInfo.rated_at)}
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