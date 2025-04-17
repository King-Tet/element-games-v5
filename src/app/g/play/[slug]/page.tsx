// src/app/g/play/[slug]/page.tsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Game } from '@/types/game'; // Ensure this path is correct
import styles from './GamePlayPage.module.css'; // Ensure this path is correct
import { useAuth } from '@/context/AuthContext'; // Ensure this path is correct
import {
  FiMaximize, FiRefreshCw, FiAlertTriangle, FiArrowLeft, FiStar,
  FiDownloadCloud, FiUploadCloud, FiCheckCircle, FiLoader, FiInfo
} from 'react-icons/fi';

import {
    getGameById, incrementGameVisit, updateUserRecentlyPlayed,
    getUserRatingForGame, submitGameRating,
    loadGameSaveData, saveGameSaveData
} from '@/lib/firebase/firestore'; // Ensure this path is correct
import StarRating from '@/components/ui/StarRating'; // Ensure this path is correct

// Sync Status Enum
enum SyncStatus {
    Idle = 'idle',          // Default state, or after successful sync
    LoadingSave = 'loading', // Fetching data from Firestore
    SaveFetchComplete = 'fetch_complete', // Data fetched, pre-delay
    DelayingLoad = 'delaying', // Waiting before loading iframe
    LoadingIframe = 'loading_iframe', // Iframe src set, waiting for onLoad
    Injecting = 'injecting',  // Injecting data into iframe localStorage
    Saving = 'saving',      // Saving data to Firestore
    Error = 'error',        // An error occurred
    Disabled = 'disabled',    // Sync not applicable (no user/keys)
    Synced = 'synced',      // Data successfully saved or loaded/injected
    NoSaveFound = 'nosave',   // Firestore fetch returned no data
    PendingInject = 'pending_inject' // Waiting for injection delay after iframe load
}

const SAVE_INTERVAL_MS = 10000; // 10 seconds
const PRE_LOAD_DELAY_MS = 2000; // 2 seconds delay before loading iframe after save fetch
const INJECT_DELAY_MS = 1000;   // 1 second delay before injecting data after iframe loads

// Debug Logger
const logDebug = (message: string, ...optionalParams: any[]) => {
    const DEBUG_ENABLED = true; // Set to true/false to toggle logs
    if (DEBUG_ENABLED) console.log(`[StorageSync] ${message}`, ...optionalParams);
};

// Default Panic Settings (for supplemental listener fallback)
const DEFAULT_PANIC_KEY = 'Escape';
const DEFAULT_PANIC_URL = 'https://google.com';


const GamePlayPage: React.FC = () => {
    const params = useParams();
    const slug = params.slug as string;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playtimeStartRef = useRef<number | null>(null);
    const visibilityChangeRef = useRef<EventListener | null>(null);
    // Refs for save timing
    const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const initialSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const preLoadDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for the pre-load delay
    // Refs for data state
    const lastUploadedSaveDataRef = useRef<string | null>(null);
    const loadedSaveDataRef = useRef<string | null>(null); // Holds data fetched from Firestore
    const isIframeLoadedRef = useRef<boolean>(false);
    const injectTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for the injection delay timeout

    const { user, loading: authLoading } = useAuth();

    // Component State
    const [game, setGame] = useState<Game | null | undefined>(undefined);
    const [isLoadingGame, setIsLoadingGame] = useState(true);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [iframeSrc, setIframeSrc] = useState<string | null>(null); // Control iframe source rendering
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle);
    const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);
    const [saveDataFetchCompleted, setSaveDataFetchCompleted] = useState(false); // Tracks if Firestore load attempt finished
    const [reloadCounter, setReloadCounter] = useState(0); // Forces effect re-runs on reload

    // --- Helper Function to Reset State for Reload ---
    const resetStateForReload = useCallback(() => {
        logDebug("Resetting state for reload...");
        setSyncStatus(SyncStatus.Idle);
        setSyncErrorMsg(null);
        setIframeSrc(null); // Unmount the iframe
        setSaveDataFetchCompleted(false); // Re-trigger the loading sequence
        isIframeLoadedRef.current = false;
        loadedSaveDataRef.current = null;
        lastUploadedSaveDataRef.current = null; // Reset last uploaded state too
        // Clear timers explicitly
        if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        if (initialSaveTimeoutRef.current) clearTimeout(initialSaveTimeoutRef.current);
        if (preLoadDelayTimeoutRef.current) clearTimeout(preLoadDelayTimeoutRef.current);
        if (injectTimeoutRef.current) clearTimeout(injectTimeoutRef.current); // Clear inject timer too
        saveIntervalRef.current = null;
        initialSaveTimeoutRef.current = null;
        preLoadDelayTimeoutRef.current = null;
        injectTimeoutRef.current = null;
        // Increment counter to ensure effects depending on it re-run
        setReloadCounter(prev => prev + 1);
        logDebug("State reset complete.");
    }, []); // No dependencies needed for reset logic itself

    // --- Step 1: Fetch Game Data ---
    useEffect(() => {
        logDebug(`Effect [Game Fetch]: Slug changed to "${slug}" or reload triggered (count: ${reloadCounter}).`);
        const fetchGame = async () => {
            if (!slug) return;
            setIsLoadingGame(true);
            // Reset state (partial reset, more happens in reload helper)
            setSyncStatus(SyncStatus.Idle);
            isIframeLoadedRef.current = false;
            loadedSaveDataRef.current = null;
            setIframeSrc(null);
            setSaveDataFetchCompleted(false);
            // Clear timers associated with previous game/state
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
            if (initialSaveTimeoutRef.current) clearTimeout(initialSaveTimeoutRef.current);
            if (preLoadDelayTimeoutRef.current) clearTimeout(preLoadDelayTimeoutRef.current);
            if (injectTimeoutRef.current) clearTimeout(injectTimeoutRef.current);

            logDebug("Fetching game data...");
            const gameData = await getGameById(slug);
            logDebug("Game data fetched:", gameData);
            setGame(gameData);
            setIsLoadingGame(false);
            if (gameData) {
                incrementGameVisit(gameData.id);
            }
        };
        fetchGame();
        // Cleanup for this specific effect run
        return () => {
            logDebug("Cleanup [Game Fetch]: Clearing potentially running timers.");
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
            if (initialSaveTimeoutRef.current) clearTimeout(initialSaveTimeoutRef.current);
            if (preLoadDelayTimeoutRef.current) clearTimeout(preLoadDelayTimeoutRef.current);
            if (injectTimeoutRef.current) clearTimeout(injectTimeoutRef.current);
        }
    }, [slug, reloadCounter]); // Depends on slug and reload trigger

    // --- Step 2: Fetch User Rating ---
    useEffect(() => {
        const fetchUserRating = async () => {
            if (user && game?.id) {
                const rating = await getUserRatingForGame(user.uid, game.id);
                setUserRating(rating);
            } else {
                setUserRating(null);
            }
        };
        if (!isLoadingGame && !authLoading && game) {
            logDebug("Fetching user rating...");
            fetchUserRating();
        }
    }, [user, authLoading, game, isLoadingGame, reloadCounter]); // Also re-run on reload


    // --- Step 3: Load Save Data ---
    useEffect(() => {
        logDebug(`Effect [Load Save]: Running. reloadCounter: ${reloadCounter}`);
        // Clear previous pre-load delay if effect re-runs
        if (preLoadDelayTimeoutRef.current) clearTimeout(preLoadDelayTimeoutRef.current);
        preLoadDelayTimeoutRef.current = null;

        const attemptLoadSaveData = async () => {
            if (authLoading || !game || isLoadingGame) {
                logDebug("LoadSaveData: Skipped (auth/game loading)."); return;
            }
            const isSyncDisabled = !user || !game.localStorageKeys?.length;
            if (isSyncDisabled) {
                setSyncStatus(SyncStatus.Disabled); logDebug("LoadSaveData: Sync disabled.");
                setSaveDataFetchCompleted(true); // Allow iframe load immediately
                return;
            }

            logDebug("LoadSaveData: Loading from Firestore...");
            setSyncStatus(SyncStatus.LoadingSave); setSyncErrorMsg(null); loadedSaveDataRef.current = null;
            try {
                const savedDataString = await loadGameSaveData(user.uid, game.id);
                loadedSaveDataRef.current = savedDataString;
                if (savedDataString === null) {
                    logDebug("LoadSaveData: No save found."); setSyncStatus(SyncStatus.NoSaveFound);
                } else {
                    logDebug("LoadSaveData: Data loaded, ready for delay."); setSyncStatus(SyncStatus.SaveFetchComplete);
                }
            } catch (error: any) {
                logDebug("LoadSaveData: Error loading.", error); setSyncErrorMsg(`Load Error: ${error.message || 'Unknown'}`); setSyncStatus(SyncStatus.Error);
            } finally {
                logDebug("LoadSaveData: Fetch attempt complete."); setSaveDataFetchCompleted(true);
            }
        };
        attemptLoadSaveData();
        // Cleanup just the pre-load timer if component unmounts during this phase
         return () => { if (preLoadDelayTimeoutRef.current) clearTimeout(preLoadDelayTimeoutRef.current); }
    }, [user, authLoading, game, isLoadingGame, reloadCounter]); // Re-run on reload


    // --- Step 4: Delay and Load Iframe ---
    useEffect(() => {
        logDebug(`Effect [Delay/Load Iframe]: Running. SaveFetchCompleted: ${saveDataFetchCompleted}, iframeSrc: ${iframeSrc}, reloadCounter: ${reloadCounter}`);
        // Guard conditions
        if (!game || !saveDataFetchCompleted) { logDebug("Delay Effect: Skipped (game not loaded or save fetch not complete)."); return; }
        if (iframeSrc !== null || preLoadDelayTimeoutRef.current !== null) { logDebug("Delay Effect: Skipped (iframe already loading or delay timer exists)."); return; }

        const isSyncDisabled = !user || !game.localStorageKeys?.length;
        if (isSyncDisabled) {
             logDebug("Delay Effect: Sync disabled, loading iframe immediately.");
             setIframeSrc(game.sourceUrl); setSyncStatus(SyncStatus.LoadingIframe); return;
        }

        // Start the delay
        logDebug(`Delay Effect: Starting ${PRE_LOAD_DELAY_MS}ms delay.`);
        setSyncStatus(SyncStatus.DelayingLoad);
        preLoadDelayTimeoutRef.current = setTimeout(() => {
            logDebug("Delay Effect: Delay finished. Setting iframe source.");
            preLoadDelayTimeoutRef.current = null;
            if (game) { // Ensure game still exists
                 setIframeSrc(game.sourceUrl); setSyncStatus(SyncStatus.LoadingIframe);
            } else { logDebug("Delay Effect: Game became null during delay!"); setSyncStatus(SyncStatus.Idle); }
        }, PRE_LOAD_DELAY_MS);

        // Cleanup timeout
        return () => { logDebug("Delay Effect: Cleanup."); if (preLoadDelayTimeoutRef.current) clearTimeout(preLoadDelayTimeoutRef.current); preLoadDelayTimeoutRef.current = null; };
    // Trigger this setup logic when save fetch completes or reload happens
    }, [game, saveDataFetchCompleted, user, iframeSrc, reloadCounter]);


    // --- Step 5: Injection Logic ---
    const injectDataIntoIframe = useCallback(() => {
        logDebug("Inject: Called.");
        const currentSyncStatus = syncStatus; // Read status at call time
        if (currentSyncStatus === SyncStatus.Disabled || loadedSaveDataRef.current === null) {
            logDebug("Inject: Skipped (disabled/no data).");
            if (currentSyncStatus !== SyncStatus.Error && currentSyncStatus !== SyncStatus.Disabled) setSyncStatus(SyncStatus.Idle);
            return;
        }
        if (!game?.localStorageKeys) {
             logDebug("Inject: Failed (Game config missing)."); setSyncStatus(SyncStatus.Error); setSyncErrorMsg("Game config missing."); return;
        }

        logDebug("Inject: Injecting data now...");
        setSyncStatus(SyncStatus.Injecting);
        try {
            const saveData = JSON.parse(loadedSaveDataRef.current);
            const iframe = iframeRef.current;
            if (iframe?.contentWindow?.localStorage) {
                const targetLocalStorage = iframe.contentWindow.localStorage;
                logDebug("Inject: Target LS acquired. Keys:", game.localStorageKeys);
                game.localStorageKeys.forEach(key => {
                    const currentValue = targetLocalStorage.getItem(key);
                    if (saveData.hasOwnProperty(key)) {
                        const valueToInject = saveData[key];
                        logDebug(`Inject: Setting key "${key}". Current="${currentValue}", New="${valueToInject}"`);
                        targetLocalStorage.setItem(key, valueToInject);
                         const writtenValue = targetLocalStorage.getItem(key); // Verify
                         if (writtenValue !== valueToInject) logDebug(`Inject: WARN! Key "${key}" verification failed!`);
                    } else { logDebug(`Inject: Key "${key}" in config but not save data. Current="${currentValue}" (Not changing).`); }
                });
                lastUploadedSaveDataRef.current = loadedSaveDataRef.current;
                logDebug("Inject: Success."); setSyncStatus(SyncStatus.Synced);
                setTimeout(() => setSyncStatus(curr => curr === SyncStatus.Synced ? SyncStatus.Idle : curr), 2000);
            } else { throw new Error("Iframe LS not accessible."); }
        } catch (error: any) {
            logDebug("Inject: Error.", error); setSyncErrorMsg(`Apply Error: ${error.message || 'Unknown'}`); setSyncStatus(SyncStatus.Error);
        }
    }, [game, syncStatus]); // syncStatus used internally


    // --- Step 6: Iframe onLoad Handler ---
    const handleIframeLoad = () => {
        logDebug("Iframe onLoad: Fired.");
        isIframeLoadedRef.current = true;
        if (injectTimeoutRef.current) clearTimeout(injectTimeoutRef.current); // Clear any previous delay

        if (syncStatus === SyncStatus.Disabled) { logDebug("Iframe onLoad: Sync disabled."); return; }

        if (loadedSaveDataRef.current !== null) {
            logDebug(`Iframe onLoad: Save data loaded, scheduling injection in ${INJECT_DELAY_MS}ms.`);
            setSyncStatus(SyncStatus.PendingInject);
            injectTimeoutRef.current = setTimeout(() => {
                 logDebug("Iframe onLoad: Injection timeout finished."); injectDataIntoIframe();
            }, INJECT_DELAY_MS);
        } else if (syncStatus === SyncStatus.NoSaveFound || syncStatus === SyncStatus.Error) {
             logDebug("Iframe onLoad: No cloud save found or error occurred, injection not needed.");
             setSyncStatus(prev => prev === SyncStatus.Error ? SyncStatus.Error : SyncStatus.Idle); // Keep error status if present
        } else {
             logDebug("Iframe onLoad: Save data load likely incomplete or status unexpected.", syncStatus);
             // Potentially set to Idle if state is ambiguous
             if (![SyncStatus.LoadingSave, SyncStatus.SaveFetchComplete, SyncStatus.DelayingLoad].includes(syncStatus)) {
                 setSyncStatus(SyncStatus.Idle);
             }
        }
        // Setup save listeners only after iframe loads
         setupSaveListeners();
    };


    // --- Step 7: Save Data to Firestore Logic ---
    const syncGameDataToFirestore = useCallback(async (isManualTrigger = false) => {
        logDebug(`Save Check: Triggered. Manual: ${isManualTrigger}, Status: ${syncStatus}`);
        const forbiddenStates = [SyncStatus.LoadingSave, SyncStatus.SaveFetchComplete, SyncStatus.DelayingLoad, SyncStatus.LoadingIframe, SyncStatus.Injecting, SyncStatus.PendingInject];
        if (forbiddenStates.includes(syncStatus) && !isManualTrigger) { logDebug("Save Check: Skipped (loading/delaying/injecting)."); return; }
        if (syncStatus === SyncStatus.Saving && !isManualTrigger) { logDebug("Save Check: Skipped (already saving)."); return; }
        if (!user || !game?.localStorageKeys?.length) { if (isManualTrigger) alert("Cloud sync disabled."); if(syncStatus !== SyncStatus.Disabled) setSyncStatus(SyncStatus.Disabled); logDebug("Save Check: Skipped (disabled)."); return; }
        if (!isIframeLoadedRef.current || !iframeRef.current?.contentWindow?.localStorage) { logDebug("Save Check: Failed (iframe not ready/accessible)."); if (isManualTrigger) alert("Game not ready for save."); return; }

        try {
            const targetLocalStorage = iframeRef.current.contentWindow.localStorage;
            const currentSaveData: { [key: string]: string | null } = {};
            game.localStorageKeys.forEach(key => { currentSaveData[key] = targetLocalStorage.getItem(key); });
            const currentSaveDataString = JSON.stringify(currentSaveData);

            if (isManualTrigger || currentSaveDataString !== lastUploadedSaveDataRef.current) {
                logDebug(`Save Triggered: Data changed or manual. Saving...`);
                setSyncStatus(SyncStatus.Saving); setSyncErrorMsg(null);
                const success = await saveGameSaveData(user.uid, game.id, currentSaveDataString);
                if (success) {
                    lastUploadedSaveDataRef.current = currentSaveDataString; setSyncStatus(SyncStatus.Synced); logDebug("Save: Success.");
                    setTimeout(() => setSyncStatus(curr => curr === SyncStatus.Synced ? SyncStatus.Idle : curr), 2000);
                } else { throw new Error("Firestore save failed."); }
            } else {
                 logDebug("Save Check: No data change detected, skipping automatic save.");
                 if (isManualTrigger) { setSyncStatus(SyncStatus.Synced); setTimeout(() => setSyncStatus(curr => curr === SyncStatus.Synced ? SyncStatus.Idle : curr), 2000); }
                 else if ([SyncStatus.Idle, SyncStatus.Synced, SyncStatus.NoSaveFound].includes(syncStatus)) { setSyncStatus(SyncStatus.Idle); }
            }
        } catch (error: any) {
            logDebug("Save: Error.", error); setSyncErrorMsg(`Save Error: ${error.message || 'Unknown'}`); setSyncStatus(SyncStatus.Error);
            if (isManualTrigger) alert(`Error saving: ${error.message || 'Unknown'}`);
        }
    }, [user, game, syncStatus]); // Dependencies


    // --- Setup Save Listeners (Interval/Visibility) ---
    // Separated setup logic called by onLoad
    const setupSaveListeners = useCallback(() => {
         logDebug("Save Setup: Running check...");
         const cleanup = () => {
            logDebug("Save Setup Cleanup: Clearing timers and listener.");
            if (initialSaveTimeoutRef.current) clearTimeout(initialSaveTimeoutRef.current);
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
            if (visibilityChangeRef.current) document.removeEventListener('visibilitychange', visibilityChangeRef.current);
            initialSaveTimeoutRef.current = null; saveIntervalRef.current = null; visibilityChangeRef.current = null;
         };
         cleanup(); // Clear previous before setting up new

         if (user && game?.localStorageKeys?.length && isIframeLoadedRef.current) {
             logDebug("Save Setup: Conditions met. Setting up listeners and initial timer.");
             const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') syncGameDataToFirestore(false); };
             visibilityChangeRef.current = handleVisibilityChange;
             document.addEventListener('visibilitychange', handleVisibilityChange);
             initialSaveTimeoutRef.current = setTimeout(() => {
                 logDebug("Initial Save Timeout: Fired."); initialSaveTimeoutRef.current = null;
                 syncGameDataToFirestore(false); // First check
                 if (saveIntervalRef.current) clearInterval(saveIntervalRef.current); // Clear potential duplicate interval
                 logDebug("Initial Save Timeout: Starting regular interval.");
                 saveIntervalRef.current = setInterval(() => { if (document.visibilityState === 'visible') syncGameDataToFirestore(false); }, SAVE_INTERVAL_MS);
             }, SAVE_INTERVAL_MS);
         } else { logDebug("Save Setup: Skipped (conditions not met)."); }
         return cleanup; // Return cleanup function
    // Dependencies: user, game, and the memoized sync function
    }, [user, game, syncGameDataToFirestore]);

    // Effect to manage the save listeners based on dependencies
    useEffect(() => {
        // Call setupSaveListeners only when iframe is confirmed loaded
        // The setup itself will handle cleanup if dependencies change
        if (isIframeLoadedRef.current) {
           const cleanup = setupSaveListeners();
           return cleanup;
        }
        // Ensure cleanup runs if component unmounts before iframe loads
        return () => {
            if (initialSaveTimeoutRef.current) clearTimeout(initialSaveTimeoutRef.current);
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
            if (visibilityChangeRef.current) document.removeEventListener('visibilitychange', visibilityChangeRef.current);
        }
    // Re-run this effect if user or game changes.
    // setupSaveListeners is memoized but included for completeness if it were not.
    }, [user, game, setupSaveListeners, reloadCounter]); // reloadCounter ensures reset


    // --- Playtime Tracking ---
    const recordPlaytime = useCallback(() => { /* ... same ... */ }, [user, game?.id]);
    useEffect(() => { /* ... same ... */ }, [game, user, recordPlaytime, reloadCounter]);


    // --- Game Tool Handlers ---
    const handleFullscreen = () => { iframeRef.current?.requestFullscreen().catch(err => logDebug("Fullscreen failed:", err)); };
    const handleReload = useCallback(() => { // Memoize reload handler
        resetStateForReload();
    }, [resetStateForReload]);


    // --- Rating Handler ---
    const handleRateGame = useCallback(async (rating: number) => {
        if (!user || !game || isSubmittingRating) return;
        logDebug(`Rating: Submitting ${rating} for ${game.id}`); setIsSubmittingRating(true);
        const success = await submitGameRating(user.uid, game.id, rating);
        if (success) {
            logDebug("Rating: Success."); setUserRating(rating);
            const updatedGameData = await getGameById(game.id); if (updatedGameData) setGame(updatedGameData);
        } else { logDebug("Rating: Failed."); alert("Failed rating."); }
        setIsSubmittingRating(false);
    }, [user, game, isSubmittingRating]);


    // --- Prevent Page Scroll from Game Keys ---
    useEffect(() => {
        const gameWrapper = iframeRef.current?.parentElement;
        if (!gameWrapper) return;
        const preventScrollKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '];
        const handleKeyDown = (event: KeyboardEvent) => {
            let isInsideGameArea = (document.activeElement === iframeRef.current);
            if (preventScrollKeys.includes(event.key) && isInsideGameArea) {
                logDebug(`Preventing scroll for key: ${event.key}`); event.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        logDebug("Added keydown listener for scroll prevention.");
        return () => { window.removeEventListener('keydown', handleKeyDown); logDebug("Removed keydown listener for scroll prevention."); };
    }, []);


    // --- Supplemental Panic Listener (Experimental) ---
    useEffect(() => {
        const gamePageContainer = document.querySelector(`.${styles.gamePlayContainer}`) as HTMLElement | null;
        if (!gamePageContainer) return;
        const handleKeyDownOnPage = (event: KeyboardEvent) => {
            const savedPanicKey = localStorage.getItem('settings:panicKey') || DEFAULT_PANIC_KEY;
            const savedPanicUrl = localStorage.getItem('settings:panicUrl') || DEFAULT_PANIC_URL;
            if (event.key === savedPanicKey) {
                if (document.activeElement === iframeRef.current) {
                    logDebug("Panic Key (Page Listener): Iframe focused. Triggering.");
                    event.preventDefault(); event.stopPropagation();
                    try {
                        if (savedPanicUrl === 'about:blank' || new URL(savedPanicUrl).protocol.startsWith('http')) { window.location.href = savedPanicUrl; }
                        else { window.location.href = DEFAULT_PANIC_URL; }
                    } catch (e) { window.location.href = DEFAULT_PANIC_URL; }
                } else { logDebug("Panic Key (Page Listener): Iframe not focused. Allowing global handler."); }
            }
        };
        gamePageContainer.addEventListener('keydown', handleKeyDownOnPage);
        logDebug("Added supplemental panic keydown listener.");
        return () => { gamePageContainer.removeEventListener('keydown', handleKeyDownOnPage); logDebug("Removed supplemental panic keydown listener."); };
    }, []);


    // --- UI Sync Status Indicator ---
    const renderSyncStatus = () => {
        let icon = null, text = '', className = styles.syncStatusIdle, title = syncErrorMsg || '';
        switch (syncStatus) {
            case SyncStatus.LoadingSave: icon = <FiLoader className={styles.syncIconSpin} />; text = "Loading"; title = "Fetching save..."; className = styles.syncStatusLoading; break;
            case SyncStatus.SaveFetchComplete: icon = <FiDownloadCloud className={styles.syncIcon} />; text = "Ready"; title = "Save data ready..."; className = styles.syncStatusLoading; break; // Display ready state
            case SyncStatus.DelayingLoad: icon = <FiLoader className={styles.syncIconSpin} />; text = "Waiting"; title = `Waiting ${PRE_LOAD_DELAY_MS/1000}s...`; className = styles.syncStatusLoading; break;
            case SyncStatus.LoadingIframe: icon = <FiLoader className={styles.syncIconSpin} />; text = "Loading Game"; title = "Loading game content..."; className = styles.syncStatusLoading; break;
            case SyncStatus.PendingInject: icon = <FiDownloadCloud className={styles.syncIcon} />; text = "Applying..."; title = "Waiting to apply save..."; className = styles.syncStatusLoading; break;
            case SyncStatus.Injecting: icon = <FiDownloadCloud className={styles.syncIconSpin} />; text = "Applying"; title = "Applying save..."; className = styles.syncStatusLoading; break;
            case SyncStatus.Saving: icon = <FiUploadCloud className={styles.syncIconSpin} />; text = "Saving..."; title = "Saving progress..."; className = styles.syncStatusSaving; break;
            case SyncStatus.Synced: icon = <FiCheckCircle className={styles.syncIcon} />; text = "Synced"; title = "Progress saved/loaded."; className = styles.syncStatusSynced; break;
            case SyncStatus.NoSaveFound: icon = <FiInfo className={styles.syncIcon} />; text = "No Cloud Save"; title = "No cloud save found."; className = styles.syncStatusIdle; break;
            case SyncStatus.Idle:
                 if (game?.localStorageKeys?.length && user && isIframeLoadedRef.current) { icon = <FiCheckCircle className={styles.syncIcon} />; text = "Sync Active"; title = "Cloud sync enabled."; className = styles.syncStatusIdle; }
                 else { return null; } break; // Don't show if sync not possible or iframe not loaded
            case SyncStatus.Error: icon = <FiAlertTriangle className={styles.syncIcon} />; text = "Sync Error"; title = `Error: ${syncErrorMsg || 'Unknown'}`; className = styles.syncStatusError; break;
            case SyncStatus.Disabled: return null;
            default: return null;
        }
        const isButtonDisabled = [SyncStatus.LoadingSave, SyncStatus.SaveFetchComplete, SyncStatus.DelayingLoad, SyncStatus.LoadingIframe, SyncStatus.PendingInject, SyncStatus.Injecting, SyncStatus.Saving].includes(syncStatus) || !isIframeLoadedRef.current;
        if (!authLoading && syncStatus !== SyncStatus.Disabled) {
            return (
                <button onClick={() => syncGameDataToFirestore(true)} className={`${styles.syncStatusIndicator} ${className}`} title={`Click to force save. Status: ${title}`} disabled={isButtonDisabled}>
                    {icon} <span className={styles.syncStatusText}>{text}</span>
                </button>
            );
        } return null;
    };

    // --- Render Logic ---
    if (isLoadingGame) {
        return <div className={styles.loadingContainer}>Loading game details...</div>;
    }
    if (game === null) {
        return (
             <div className={styles.notFoundContainer}>
                 <h2>Game Not Found</h2>
                 <Link href="/g" className={styles.toolButton} style={{ marginTop: '20px' }}>
                     <FiArrowLeft /> Back to Games
                 </Link>
             </div>
        );
    }

    return (
        <div className={styles.gamePlayContainer}>
            <div className={styles.gameWrapper}>
                 {!iframeSrc && (
                     <div className={styles.iframeLoadingPlaceholder}>
                         {syncStatus === SyncStatus.LoadingSave && <span><FiLoader className={styles.syncIconSpin} /> Loading save...</span>}
                         {syncStatus === SyncStatus.DelayingLoad && <span><FiLoader className={styles.syncIconSpin} /> Preparing game...</span>}
                         {(syncStatus === SyncStatus.Idle || syncStatus === SyncStatus.NoSaveFound || syncStatus === SyncStatus.SaveFetchComplete) && !saveDataFetchCompleted && <span><FiLoader className={styles.syncIconSpin} /> Initializing...</span>}
                         {syncStatus === SyncStatus.Disabled && <span>Loading game...</span>}
                         {syncStatus === SyncStatus.Error && <span><FiAlertTriangle /> Error preparing game.</span>}
                     </div>
                 )}
                 {iframeSrc && (
                    <iframe
                        ref={iframeRef}
                        src={iframeSrc}
                        className={styles.gameIframe}
                        title={game.name}
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
                        onLoad={handleIframeLoad}
                    />
                 )}
            </div>

            <div className={styles.controlsRow}>
                {renderSyncStatus()}
                <div className={styles.gameTools}>
                    <button onClick={handleFullscreen} className={styles.toolButton}><FiMaximize /> Fullscreen</button>
                    <button onClick={handleReload} className={styles.toolButton}><FiRefreshCw /> Reload</button>
                    <a href={`mailto:support@example.com?subject=Bug Report: ${game.name}`} target="_blank" rel="noopener noreferrer" className={styles.toolButton}> <FiAlertTriangle /> Report Bug </a>
                </div>
            </div>

            <section className={styles.gameDetails}>
                 <div className={styles.detailsHeader}>
                     <h1>{game.name}</h1>
                     <div className={styles.aggregateRating}>
                         <FiStar className={styles.filled} />
                         <span>{(game.averageRating || 0).toFixed(1)}</span>
                         <span className={styles.ratingCount}>({game.ratingCount || 0} ratings)</span>
                     </div>
                 </div>
                 <p>{game.description}</p>
                 {!authLoading && user && (
                     <div className={styles.userRatingSection}>
                         <h3>Your Rating:</h3>
                         <StarRating rating={userRating} onRate={handleRateGame} disabled={isSubmittingRating}/>
                         {isSubmittingRating && <span className={styles.submittingText}>Submitting...</span>}
                     </div>
                 )}
                 {!authLoading && !user && (
                      <div className={styles.loginPrompt}>
                           <Link href="/account">Sign in</Link> to rate this game!
                      </div>
                 )}
            </section>
        </div>
    );
};

export default GamePlayPage;