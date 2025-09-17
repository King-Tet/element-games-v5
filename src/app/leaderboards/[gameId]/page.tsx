'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Game } from '@/types/game';
import { GameLeaderboardEntry } from '@/types/leaderboard';
import styles from './GameLeaderboardPage.module.css';
import GameLeaderboardTable from '@/components/Leaderboards/GameLeaderboardTable';
import { FiArrowLeft, FiLoader } from 'react-icons/fi';
import { getGameById } from '@/lib/supabase/db';

const GameLeaderboardPage = () => {
    const params = useParams();
    const gameId = params.gameId as string;

    const [game, setGame] = useState<Game | null>(null);
    const [leaderboardData, setLeaderboardData] = useState<GameLeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

    // Memoize the default level ID to prevent re-renders
    const defaultLevelId = useMemo(() => {
        return game?.leaderboardConfigs?.[0]?.id || null;
    }, [game]);

    useEffect(() => {
        const fetchGameData = async () => {
            if (!gameId) return;
            setIsLoading(true);
            setError(null);
            try {
                const foundGame = await getGameById(gameId);
                setGame(foundGame);

                if (foundGame?.leaderboardConfigs && foundGame.leaderboardConfigs.length > 0) {
                    setSelectedLevelId(foundGame.leaderboardConfigs[0].id);
                } else if (foundGame) {
                    setError("This game does not have any leaderboards configured.");
                } else {
                    setError("Game not found.");
                }
            } catch (err) {
                setError("Failed to load game data.");
            } finally {
                // Loading will be handled by the leaderboard fetch
            }
        };
        fetchGameData();
    }, [gameId]);

    useEffect(() => {
        // Set the selected level ID once the game data is loaded
        if (defaultLevelId && !selectedLevelId) {
            setSelectedLevelId(defaultLevelId);
        }
    }, [defaultLevelId, selectedLevelId]);

    useEffect(() => {
        if (!gameId || !selectedLevelId) {
            if (game) setIsLoading(false);
            return;
        }

        const fetchLeaderboard = async () => {
            setIsLoading(true);
            setError(null);
            setLeaderboardData([]);
            try {
                const response = await fetch(`/api/leaderboards/${gameId}?level=${selectedLevelId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch leaderboard.');
                }
                const data: GameLeaderboardEntry[] = await response.json();
                setLeaderboardData(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [gameId, selectedLevelId, game]);

    const selectedConfig = game?.leaderboardConfigs?.find(c => c.id === selectedLevelId);

    const renderContent = () => {
        if (isLoading) {
            return <div className={styles.loadingState}><FiLoader className={styles.spinner} /> Loading scores for {selectedConfig?.displayName}...</div>
        }
        if (error) {
            return <div className={styles.errorState}>{error}</div>
        }
        if (leaderboardData.length > 0 && selectedConfig) {
             return <GameLeaderboardTable entries={leaderboardData} unit={selectedConfig.unit || 'number'} />
        }
        return <div className={styles.noScores}>No scores have been submitted for this leaderboard yet.</div>
    }

    return (
        <div className={styles.pageContainer}>
             <Link href="/leaderboards" className={styles.backLink}>
                <FiArrowLeft /> Back to All Leaderboards
            </Link>
            
            {game && (
                <>
                    <header className={styles.pageHeader}>
                        <Image 
                            src={game.imageUrl} 
                            alt={game.name} 
                            width={100}
                            height={75}
                            className={styles.gameImage}
                            unoptimized 
                        />
                        <div className={styles.headerText}>
                            <h1>{game.name}</h1>
                            <p className={styles.pageSubtitle}>Leaderboards</p>
                        </div>
                    </header>
                    
                    {game.leaderboardConfigs && game.leaderboardConfigs.length > 0 && (
                        <div className={styles.levelSelector}>
                             {game.leaderboardConfigs.map(config => (
                                <button
                                    key={config.id}
                                    onClick={() => setSelectedLevelId(config.id)}
                                    className={`${styles.levelButton} ${selectedLevelId === config.id ? styles.active : ''}`}
                                >
                                    {config.displayName}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className={styles.leaderboardWrapper}>
                        {renderContent()}
                    </div>
                </>
            )}
            
            {/* Handle initial loading and game not found states */}
            {!game && isLoading && (
                 <div className={styles.loadingState}><FiLoader className={styles.spinner} /> Loading Game...</div>
            )}
             {!game && !isLoading && error && (
                <div className={styles.errorState}>{error}</div>
            )}
        </div>
    );
};

export default GameLeaderboardPage;
