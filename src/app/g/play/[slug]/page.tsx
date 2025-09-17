// src/app/g/play/[slug]/page.tsx
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
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
  Active = "Cloud Save Active",
  LoadingSave = "Loading Save",
  Saving = "Saving",
  Error = "Sync Error",
  Disabled = "Disabled",
  Synced = "Synced",
  NoSaveFound = "No Save Found",
}

const SAVE_INTERVAL_MS = 7000;
const PLAYTIME_UPDATE_INTERVAL_MS = 60000;

// Helper function to get data from IndexedDB using a cursor
const getIndexedDbData = (
  iframe: HTMLIFrameElement,
  config: Game['indexedDbConfig']
): Promise<{ [key: string]: unknown }> => {
  return new Promise((resolve, reject) => {
    if (!iframe.contentWindow || !config) {
      return reject('Iframe or config not available');
    }

    const request = iframe.contentWindow.indexedDB.open(config.dbName);

    request.onerror = (event) => {
      const target = event.target;
      let errorMsg = "Unknown error";
      if (target && "error" in target && (target as IDBRequest).error) {
        errorMsg = (target as IDBRequest).error?.name || "Unknown error";
      } else if (target && "errorCode" in target) {
        // Type guard for errorCode property
        const maybeErrorCode = target as { errorCode?: string };
        errorMsg = maybeErrorCode.errorCode || "Unknown error";
      }
      reject('Error opening IndexedDB: ' + errorMsg);
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(config.storeName)) {
        db.close();
        return reject(`Object store not found: ${config.storeName}`);
      }
      const transaction = db.transaction(config.storeName, 'readonly');
      const store = transaction.objectStore(config.storeName);
      const keyRegex = new RegExp(config.keyPattern);
      const matchingData: { [key: string]: unknown } = {};

      const cursorRequest = store.openCursor();

      cursorRequest.onerror = (e: unknown) => reject('Error with cursor: ' + e.target.errorCode);

      cursorRequest.onsuccess = (e: unknown) => {
        const cursor = e.target.result;
        if (cursor) {
          if (typeof cursor.key === 'string' && keyRegex.test(cursor.key)) {
            matchingData[cursor.key] = cursor.value;
          }
          cursor.continue();
        } else {
          // Cursor is done, resolve with the found data
          resolve(matchingData);
        }
      };
       transaction.oncomplete = () => {
        db.close();
      };
    };
  });
};


// Helper function to write data back to IndexedDB
const setIndexedDbData = (
  iframe: HTMLIFrameElement,
  config: Game['indexedDbConfig'],
  savedData: { [key: string]: unknown }
): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!iframe.contentWindow || !config) {
          return reject('Iframe or config not available');
        }
        const request = iframe.contentWindow.indexedDB.open(config.dbName);
        request.onerror = (event) => reject('Error opening IndexedDB for writing: ' + ((event.target as IDBRequest)?.error?.name || (event.target as unknown)?.errorCode || 'Unknown error'));
        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(config.storeName)) {
                db.close();
                return reject(`Object store not found: ${config.storeName}`);
            }
            const transaction = db.transaction(config.storeName, 'readwrite');
            const store = transaction.objectStore(config.storeName);

            Object.entries(savedData).forEach(([key, value]) => {
                store.put(value, key);
            });

            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
            transaction.onerror = (e: unknown) => {
                db.close();
                reject('Transaction error while writing: ' + e.target.errorCode)
            };
        };
    });
};


const GamePlayPage: React.FC = () => {
  const params = useParams();
  const slug = params.slug as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user, loading: authLoading } = useAuth();

  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUploadedSaveDataRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const lastPlaytimeUpdateRef = useRef<number>(Date.now());

  const [game, setGame] = useState<Game | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    SyncStatus.Disabled
  );

  const hasCloudSaveFeature =
    (game?.localStorageKeys && game.localStorageKeys.length > 0) ||
    !!game?.indexedDbConfig;

  const syncGameData = useCallback(
    async (isManualTrigger = false) => {
      if (!user || !hasCloudSaveFeature || !iframeRef.current?.contentWindow) {
        setSyncStatus(SyncStatus.Disabled);
        return;
      }

      setSyncStatus(SyncStatus.Saving);
      try {
        let currentSaveDataString: string | null = null;
        if (game?.localStorageKeys) {
          const targetLocalStorage =
            iframeRef.current.contentWindow.localStorage;
          const currentSaveData: { [key: string]: string | null } = {};
          game!.localStorageKeys!.forEach((key) => {
            currentSaveData[key] = targetLocalStorage.getItem(key);
          });
          currentSaveDataString = JSON.stringify(currentSaveData);
        } else if (game?.indexedDbConfig) {
          const data = await getIndexedDbData(
            iframeRef.current,
            game.indexedDbConfig
          );
          currentSaveDataString = JSON.stringify(data);
        }

        if (
          currentSaveDataString &&
          (isManualTrigger ||
            currentSaveDataString !== lastUploadedSaveDataRef.current)
        ) {
          const { error } = await saveGameSaveData(
            user.id,
            game!.id,
            currentSaveDataString
          );
          if (error) throw error;
          lastUploadedSaveDataRef.current = currentSaveDataString;
          setSyncStatus(SyncStatus.Synced);
          setTimeout(
            () =>
              setSyncStatus((s) =>
                s === SyncStatus.Synced ? SyncStatus.Active : s
              ),
            2000
          );
        } else {
          setSyncStatus(SyncStatus.Active);
        }
      } catch (error) {
        console.error("Error saving game data:", error);
        setSyncStatus(SyncStatus.Error);
      }
    },
    [user, game, hasCloudSaveFeature]
  );

  const handleIframeLoad = useCallback(async () => {
    if (!iframeRef.current) return;

    if (isInitialLoadRef.current) {
      if (user && hasCloudSaveFeature) {
        isInitialLoadRef.current = false;
        setSyncStatus(SyncStatus.LoadingSave);

        const savedDataString = await loadGameSaveData(user.id, game!.id);

        if (savedDataString && iframeRef.current.contentWindow) {
          lastUploadedSaveDataRef.current = savedDataString;
          const saveData = JSON.parse(savedDataString);

          if (game?.localStorageKeys) {
             Object.keys(saveData).forEach((key) => {
               if (game.localStorageKeys?.includes(key) && saveData[key] !== null) {
                 iframeRef.current!.contentWindow!.localStorage.setItem(key, saveData[key]);
               }
             });
          } else if (game?.indexedDbConfig) {
            try {
                await setIndexedDbData(iframeRef.current, game.indexedDbConfig, saveData);
            } catch (error) {
                console.error("Failed to restore IndexedDB data:", error);
                setSyncStatus(SyncStatus.Error);
                return;
            }
          }
          iframeRef.current.src = iframeRef.current.src;
          setSyncStatus(SyncStatus.Synced);
          setTimeout(() => setSyncStatus(SyncStatus.Active), 2000);
        } else {
          setSyncStatus(SyncStatus.NoSaveFound);
          setTimeout(() => setSyncStatus(SyncStatus.Active), 2000);
        }
      } else {
        isInitialLoadRef.current = false;
        setSyncStatus(SyncStatus.Disabled);
      }
    }
  }, [user, game, hasCloudSaveFeature]);

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!slug) return;
      setIsLoadingGame(true);
      const gameData = await getGameById(slug);
      setGame(gameData);
      setIframeSrc(gameData?.sourceUrl || null);

      if (gameData) {
        await incrementGameVisit(gameData.id);
      }

      if (user && gameData) {
        const rating = await getUserRatingForGame(user.id, gameData.id);
        setUserRating(rating);
      }
      setIsLoadingGame(false);
    };
    fetchGameDetails();
  }, [slug, user]);

  useEffect(() => {
    if (user && game && !isLoadingGame) {
      updateUserRecentlyPlayed(user.id, game.id, 0);
    }
  }, [user, game, isLoadingGame]);

  useEffect(() => {
    const canStartSyncing =
      user &&
      hasCloudSaveFeature &&
      (syncStatus === SyncStatus.Active ||
        syncStatus === SyncStatus.NoSaveFound ||
        syncStatus === SyncStatus.Synced);

    if (canStartSyncing && game) {
      saveIntervalRef.current = setInterval(
        () => syncGameData(false),
        SAVE_INTERVAL_MS
      );

      lastPlaytimeUpdateRef.current = Date.now();
      playtimeIntervalRef.current = setInterval(() => {
        updateUserRecentlyPlayed(
          user!.id,
          game.id,
          PLAYTIME_UPDATE_INTERVAL_MS / 1000
        );
        lastPlaytimeUpdateRef.current = Date.now();
      }, PLAYTIME_UPDATE_INTERVAL_MS);
    }

    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
      if (playtimeIntervalRef.current)
        clearInterval(playtimeIntervalRef.current);

      if (user && game && canStartSyncing) {
        const remainingPlaytimeMs =
          Date.now() - lastPlaytimeUpdateRef.current;
        if (remainingPlaytimeMs > 1000) {
          const remainingPlaytimeSeconds = Math.round(
            remainingPlaytimeMs / 1000
          );
          updateUserRecentlyPlayed(
            user.id,
            game.id,
            remainingPlaytimeSeconds
          );
        }
      }
    };
  }, [user, game, hasCloudSaveFeature, syncStatus, syncGameData]);

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

  const handleFullscreen = () => iframeRef.current?.requestFullscreen();
  const handleReload = () => {
    if (iframeRef.current) {
      isInitialLoadRef.current = true;
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const renderSyncStatus = () => {
    if (!user || !hasCloudSaveFeature || syncStatus === SyncStatus.Disabled) {
      return null;
    }

    let icon = <FiLoader className={styles.spinner} />;
    let statusClass = '';

    switch (syncStatus) {
      case SyncStatus.Synced:
        icon = <FiCheckCircle />;
        statusClass = styles.syncStatusSynced;
        break;
      case SyncStatus.Active:
        icon = <FiCheckCircle />;
        break;
      case SyncStatus.NoSaveFound:
        icon = <FiInfo />;
        break;
      case SyncStatus.Saving:
        icon = <FiUploadCloud className={styles.spinner} />;
        statusClass = styles.syncStatusSaving;
        break;
      case SyncStatus.LoadingSave:
        icon = <FiDownloadCloud className={styles.spinner} />;
        statusClass = styles.syncStatusSaving;
        break;
      case SyncStatus.Error:
        icon = <FiAlertTriangle />;
        statusClass = styles.syncStatusError;
        break;
    }

    return (
      <button
        onClick={() => syncGameData(true)}
        className={`${styles.syncStatusIndicator} ${statusClass}`}
      >
        <> {icon} {syncStatus} </>
      </button>
    );
  };

  if (isLoadingGame)
    return <div className={styles.loadingContainer}>Loading game...</div>;
  if (!game)
    return (
      <div className={styles.notFoundContainer}>
        <h2>Game Not Found</h2>
      </div>
    );

  return (
    <div className={styles.gamePlayContainer}>
      <div className={styles.gameWrapper}>
        {iframeSrc ? (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className={styles.gameIframe}
            title={game.name}
            allowFullScreen
            onLoad={handleIframeLoad}
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
          <button onClick={handleFullscreen} className={styles.toolButton}>
            <FiMaximize /> Fullscreen
          </button>
          <button onClick={handleReload} className={styles.toolButton}>
            <FiRefreshCw /> Reload
          </button>
          <Link href="/feedback" className={styles.toolButton}>
            <FiAlertTriangle /> Report Bug
          </Link>
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