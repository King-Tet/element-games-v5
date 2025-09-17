'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './LeaderboardsPage.module.css';
import { FiTrendingUp, FiAward, FiSearch, FiLoader, FiChevronRight, FiUserX, FiMeh } from 'react-icons/fi';

// Component Imports
import GameEGSTable from '@/components/Leaderboards/GameEGSTable';
import UserRankingTable from '@/components/Leaderboards/UserRankingTable';
import { getTopGamesByEGS, getTopUsersByScore, getUserDataByUsername, getGamesWithLeaderboards } from '@/lib/supabase/db'; 
import { UserProfileData } from '@/types/user';
import { Game } from '@/types/game';

type LeaderboardTab = 'users' | 'games' | 'individual';

// A generic loading/error wrapper for sections
const SectionWrapper: React.FC<{
    isLoading: boolean;
    error: string | null;
    children: React.ReactNode;
}> = ({ isLoading, error, children }) => {
    if (isLoading) {
        return <div className={styles.loadingState}><FiLoader className={styles.spinner} /> Loading...</div>;
    }
    if (error) {
        return <div className={styles.errorState}>{error}</div>;
    }
    return <>{children}</>;
};


const LeaderboardsPage = () => {
    const [activeTab, setActiveTab] = useState<LeaderboardTab>('users');

    // States for data
    const [topGames, setTopGames] = useState<Game[]>([]);
    const [topUsers, setTopUsers] = useState<(UserProfileData & { userScore: number })[]>([]);
    const [gamesWithLeaderboards, setGamesWithLeaderboards] = useState<Game[]>([]);
    
    // States for loading and errors
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    // States for user search
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<unknown>(null); // Can hold user data or null
    const [searchError, setSearchError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setErrors({});

        try {
            const [gamesData, usersData, individualData] = await Promise.all([
                getTopGamesByEGS(10),
                getTopUsersByScore(100),
                getGamesWithLeaderboards()
            ]);
            
            setTopGames(gamesData);
            setTopUsers(usersData);
            setGamesWithLeaderboards(individualData);

        } catch (error: unknown) {
            console.error("Leaderboard fetch error:", error);
            setErrors(prev => ({ ...prev, all: "Could not fetch leaderboard data." }));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUserSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResult(null);
        setSearchError(null);
        try {
            const profile = await getUserDataByUsername(searchQuery.trim());
            if (profile) {
                const rankIndex = topUsers.findIndex(u => u.id === profile.id);
                setSearchResult({
                    ...profile,
                    rank: rankIndex !== -1 ? rankIndex + 1 : profile.rank,
                    userScore: profile.user_score
                });
            } else {
                setSearchError(`User "${searchQuery.trim()}" not found or is unranked.`);
            }
        } catch (error: unknown) {
            console.error("Error searching for user:", error);
            setSearchError("An error occurred while searching.");
        } finally {
            setIsSearching(false);
        }
    };
    
    const renderContent = () => {
        switch (activeTab) {
            case 'users':
                return (
                    <SectionWrapper isLoading={isLoading} error={errors.users}>
                        <UserRankingTable users={topUsers} maxItems={100} searchedUser={searchResult} />
                    </SectionWrapper>
                );
            case 'games':
                return (
                    <SectionWrapper isLoading={isLoading} error={errors.games}>
                        <GameEGSTable games={topGames} maxItems={10} />
                    </SectionWrapper>
                );
            case 'individual':
                 return (
                    <SectionWrapper isLoading={isLoading} error={errors.individual}>
                        {gamesWithLeaderboards.length > 0 ? (
                            <div className={styles.gameLinkGrid}>
                                {gamesWithLeaderboards.map(game => (
                                    <Link href={`/leaderboards/${game.id}`} key={game.id} className={styles.gameLinkCard}>
                                        <Image 
                                            src={game.imageUrl || '/game-images/default-placeholder.png'} 
                                            alt={game.name} 
                                            width={60} height={45} 
                                            className={styles.gameLinkImage} 
                                        />
                                        <span className={styles.gameLinkName}>{game.name}</span>
                                        <FiChevronRight className={styles.gameLinkIcon} />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.noItemsMessage}>
                                <FiMeh /> No games have specific leaderboards configured yet.
                            </div>
                        )}
                    </SectionWrapper>
                );
        }
    };

    return (
        <div className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <h1>Leaderboards</h1>
                <p>See how you stack up against the competition.</p>
            </header>

            <div className={styles.controlsContainer}>
                 <div className={styles.tabs}>
                    <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? styles.active : ''}>
                        <FiAward /> Top Users
                    </button>
                    <button onClick={() => setActiveTab('games')} className={activeTab === 'games' ? styles.active : ''}>
                        <FiTrendingUp /> Top Games
                    </button>
                     <button onClick={() => setActiveTab('individual')} className={activeTab === 'individual' ? styles.active : ''}>
                        <FiTrendingUp /> Game Leaderboards
                    </button>
                </div>
                {activeTab === 'users' && (
                     <div className={styles.userSearchContainer}>
                        <form onSubmit={handleUserSearch}>
                            <input
                                type="search" value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Find a user's rank..."
                                className={styles.searchInput}
                            />
                            <button type="submit" disabled={isSearching} className={styles.searchButton}>
                                {isSearching ? <FiLoader className={styles.spinner} /> : <FiSearch />}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {searchError && activeTab === 'users' && <p className={`${styles.searchResultText} ${styles.errorState}`}><FiUserX /> {searchError}</p>}
            
            <div className={styles.contentContainer}>
                {errors.all ? <div className={styles.errorState}>{errors.all}</div> : renderContent()}
            </div>
            
        </div>
    );
};

export default LeaderboardsPage;
