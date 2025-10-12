// src/app/g/play/[slug]/page.tsx
"use client";

// 💡 Added console.log for debugging - CHECK YOUR BROWSER CONSOLE FOR THIS MESSAGE
console.log("--- Executing GamePlayPage.tsx v3 ---");

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Game } from "@/types/game";
import styles from "./GamePlayPage.module.css";
import { useAuth } from "@/context/AuthContext";
import {
  FiMaximize,
  FiRefreshCw,
  FiAlertTriangle,
  FiDownloadCloud,
  FiUploadCloud,
  FiCheckCircle,
  FiLoader,
  FiInfo,
  FiZap,
  FiAward, // Added for leaderboard icon
} from "react-icons/fi";

import {
  getGameById,
  updateUserRecentlyPlayed,
  getUserRatingForGame,
  submitGameRating,
  loadGameSaveData,
  saveGameSaveData,
  incrementGameVisit,
} from "@/lib/supabase/db";
import StarRating from "@/components/ui/StarRating";

enum SyncStatus {
    Ready = "Cloud Save Ready",
    Loading = "Loading Save...",
    Saving = "Saving...",
    Synced = "Synced",
    Error = "Sync Error",
    Disabled = "Cloud Save Disabled",
}

const PLAYTIME_UPDATE_INTERVAL_MS = 60000;

const GamePlayPage: React.FC = () => {
    const params = useParams();
    const slug = params.slug as string;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { user, loading: authLoading } = useAuth();

    const playtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [game, setGame] = useState<Game | null>(null);
    const [isLoadingGame, setIsLoadingGame] = useState(true);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [iframeSrc, setIframeSrc] = useState<string | null>(null);
    const [isBridgeReady, setIsBridgeReady] = useState(false);
    
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Disabled);

    const hasCloudSaveFeature = useMemo(() => {
        if (!game) return false;
        const hasLocalStorage = game.localStorageKeys && game.localStorageKeys.length > 0;
        const hasIndexedDb = !!game.indexedDbConfig; // This logic handles both save types
        return hasLocalStorage || hasIndexedDb;
    }, [game]);

    const handleIframeMessage = useCallback(async (event: MessageEvent) => {
        if (!event.data || typeof event.data !== 'object') return;
        const { type, payload } = event.data;

        if (type === 'CLOUD_BRIDGE_READY') {
            console.log('[GamePlayPage] ✅ Received CLOUD_BRIDGE_READY from iframe.');
            setIsBridgeReady(true);
        } else if (type === 'UPDATE_SAVE_DATA') {
            if (!user || !game) return;

            console.log('[GamePlayPage] ⬆️ Received UPDATE_SAVE_DATA from bridge.');
            setSyncStatus(SyncStatus.Saving);
            const { error } = await saveGameSaveData(user.id, game.id, payload);

            if (error) {
                console.error("[GamePlayPage] ❌ Error saving game data to Supabase:", error);
                setSyncStatus(SyncStatus.Error);
            } else {
                console.log('[GamePlayPage] ✅ Successfully saved data to Supabase.');
                setSyncStatus(SyncStatus.Synced);
                setTimeout(() => setSyncStatus(s => s === SyncStatus.Synced ? SyncStatus.Ready : s), 2000);
            }
        }
    }, [user, game]);

    useEffect(() => {
        window.addEventListener('message', handleIframeMessage);
        return () => {
            window.removeEventListener('message', handleIframeMessage);
        };
    }, [handleIframeMessage]);
    
    useEffect(() => {
        const initializeSave = async () => {
            if (isBridgeReady && user && game && hasCloudSaveFeature && iframeRef.current?.contentWindow) {
                setSyncStatus(SyncStatus.Loading);
                const savedDataString = await loadGameSaveData(user.id, game.id);
                const dataToSend = savedDataString || '{}';
                
                console.log(`[GamePlayPage] ⬇️ Bridge is ready. Sending INIT_SAVE_DATA to iframe.`);
                iframeRef.current.contentWindow.postMessage({
                    type: 'INIT_SAVE_DATA',
                    payload: dataToSend
                }, '*');

                setSyncStatus(SyncStatus.Ready);
            } else if (isBridgeReady) {
                setSyncStatus(SyncStatus.Disabled);
            }
        };
        initializeSave();
    }, [isBridgeReady, user, game, hasCloudSaveFeature]);

    useEffect(() => {
        const fetchGameDetails = async () => {
            if (!slug) return;
            setIsLoadingGame(true);
            const gameData = await getGameById(slug);
            setGame(gameData);
            setIframeSrc(gameData?.sourceUrl || null);

            if (gameData) await incrementGameVisit(gameData.id);
            if (user && gameData) {
                const rating = await getUserRatingForGame(user.id, gameData.id);
                setUserRating(rating);
            }
            setIsLoadingGame(false);
        };
        fetchGameDetails();
    }, [slug, user]);

    useEffect(() => {
        if (user && game) {
            updateUserRecentlyPlayed(user.id, game.id, 0); 
            playtimeIntervalRef.current = setInterval(() => {
                updateUserRecentlyPlayed(user.id, game.id, PLAYTIME_UPDATE_INTERVAL_MS / 1000);
            }, PLAYTIME_UPDATE_INTERVAL_MS);
        }
        return () => {
            if (playtimeIntervalRef.current) clearInterval(playtimeIntervalRef.current);
        };
    }, [user, game]);

    const handleFullscreen = () => iframeRef.current?.requestFullscreen();
    
    const handleReload = () => {
        if (iframeRef.current) {
            setIsBridgeReady(false); 
            iframeRef.current.src = iframeRef.current.src;
        }
    };
    
    const handleRateGame = useCallback(
        async (rating: number) => {
            if (!user || !game || isSubmittingRating) return;
            setIsSubmittingRating(true);
            const { error } = await submitGameRating(user.id, game.id, rating);
            if (!error) {
                setUserRating(rating);
                const updatedGameData = await getGameById(game.id);
                if (updatedGameData) setGame(updatedGameData);
            } else {
                alert("Failed to submit rating.");
            }
            setIsSubmittingRating(false);
        },
        [user, game, isSubmittingRating]
    );

    const renderSyncStatus = () => {
        if (!hasCloudSaveFeature) return null;
        if (!user) {
             return (
                <div className={`${styles.syncStatusIndicator}`} style={{ cursor: 'default' }}>
                    <FiInfo /> Log in for Cloud Save
                </div>
            );
        }
        if (!isBridgeReady && syncStatus === SyncStatus.Disabled) return null;
        let icon: React.ReactNode;
        let statusClass = '';
        switch (syncStatus) {
            case SyncStatus.Synced: icon = <FiCheckCircle />; statusClass = styles.syncStatusSynced; break;
            case SyncStatus.Ready: icon = <FiCheckCircle />; break;
            case SyncStatus.Saving: icon = <FiUploadCloud className={styles.spinner} />; statusClass = styles.syncStatusSaving; break;
            case SyncStatus.Loading: icon = <FiDownloadCloud className={styles.spinner} />; statusClass = styles.syncStatusSaving; break;
            case SyncStatus.Error: icon = <FiAlertTriangle />; statusClass = styles.syncStatusError; break;
            default: icon = <FiLoader className={styles.spinner} />; break;
        }
        return (<div className={`${styles.syncStatusIndicator} ${statusClass}`}>{icon} {syncStatus}</div>);
    };

    if (isLoadingGame) return <div className={styles.loadingContainer}>Loading game...</div>;
    if (!game) return <div className={styles.notFoundContainer}><h2>Game Not Found</h2></div>;

    return (
        <div className={styles.gamePlayContainer}>
            {game.pinned_note && (
                <div className={styles.pinnedNote}>
                    <FiZap className={styles.pinnedNoteIcon} />
                    <p>{game.pinned_note}</p>
                </div>
            )}
            <div className={styles.gameWrapper}>
                {iframeSrc ? (
                    <iframe
                        ref={iframeRef}
                        src={iframeSrc}
                        className={styles.gameIframe}
                        title={game.name}
                        allowFullScreen
                    />
                ) : (
                    <div className={styles.iframeLoadingPlaceholder}>
                        <FiLoader className={styles.spinner} />
                        <span>Preparing game...</span>
                    </div>
                )}
            </div>
            <div className={styles.controlsRow}>
                {renderSyncStatus()}
                <div className={styles.gameTools}>
                    <button onClick={handleFullscreen} className={styles.toolButton}><FiMaximize /> Fullscreen</button>
                    {game.leaderboardConfigs && game.leaderboardConfigs.length > 0 && (
                        <Link href={`/leaderboards/${game.id}`} className={styles.toolButton}>
                            <FiAward /> Leaderboard
                        </Link>
                    )}
                    <button onClick={handleReload} className={styles.toolButton}><FiRefreshCw /> Reload</button>
                    <Link href="/feedback" className={styles.toolButton}><FiAlertTriangle /> Report Bug</Link>
                </div>
            </div>
            <section className={styles.gameDetails}>
                <h1>{game.name}</h1>
                <p>{game.description}</p>
                 {!authLoading && user && (
                    <div className={styles.userRatingSection}>
                        <h3>Your Rating:</h3>
                        <StarRating
                            rating={userRating}
                            onRate={handleRateGame}
                            disabled={isSubmittingRating}
                        />
                        {isSubmittingRating && (
                        <span className={styles.submittingText}>
                            <FiLoader className={styles.spinner} /> Submitting...
                        </span>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default GamePlayPage;