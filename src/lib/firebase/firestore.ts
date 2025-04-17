// src/lib/firebase/firestore.ts
import { db, auth } from "./config"; // Your initialized Firestore instance
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  Timestamp,
  runTransaction,
  query,
  orderBy,
  limit,
  where,
  writeBatch,
  serverTimestamp,
  collectionGroup,
} from "firebase/firestore";
import { Game } from "@/types/game";
import { Tool } from "@/types/tool"; // If tools become dynamic
import {
  UserRating,
  RecentlyPlayedInfo,
  RatedGameInfo,
} from "./firestoreTypes"; // Example: Define specific types if needed

// --- Game Data ---

export async function getGameById(gameId: string): Promise<Game | null> {
  try {
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);
    if (gameSnap.exists()) {
      // Ensure the data conforms to the Game interface
      return { id: gameSnap.id, ...gameSnap.data() } as Game;
    } else {
      console.log(`No game found with ID: ${gameId}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching game by ID:", error);
    return null;
  }
}

export async function getTrendingGames(count: number = 5): Promise<Game[]> {
  try {
    const gamesRef = collection(db, "games");
    const q = query(gamesRef, orderBy("totalVisits", "desc"), limit(count));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Game)
    );
  } catch (error) {
    console.error("Error fetching trending games:", error);
    return [];
  }
}

export async function incrementGameVisit(gameId: string): Promise<void> {
  if (!gameId) return;
  try {
    const gameRef = doc(db, "games", gameId);
    // Use FieldValue.increment for atomic update
    await updateDoc(gameRef, {
      totalVisits: increment(1),
    });
  } catch (error) {
    console.error(`Error incrementing visit count for game ${gameId}:`, error);
    // Handle error appropriately, maybe log it or notify user
  }
}

// --- User Game Data ---

export interface RecentlyPlayedInfo {
  gameId: string;
  lastPlayed: Timestamp;
  playtimeSeconds?: number; // Optional: Store approximate playtime
}

export async function updateUserRecentlyPlayed(
  userId: string,
  gameId: string,
  playtimeSeconds?: number
): Promise<void> {
  if (!userId || !gameId) return;
  try {
    const recentPlayRef = doc(db, "users", userId, "recentlyPlayed", gameId);
    const dataToSet: Partial<RecentlyPlayedInfo> = {
      gameId: gameId,
      lastPlayed: Timestamp.now(), // Use server timestamp ideally if latency isn't an issue
    };
    if (playtimeSeconds !== undefined) {
      // Use increment for playtime if tracking cumulatively
      dataToSet.playtimeSeconds = increment(playtimeSeconds);
      // Or just set if replacing: dataToSet.playtimeSeconds = playtimeSeconds;
    }

    // Use set with merge: true to create or update the document
    await setDoc(recentPlayRef, dataToSet, { merge: true });

    // Optional: Clean up old entries (e.g., keep only the latest 10)
    // This is more complex and might be better suited for a background function
    // cleanupOldRecentlyPlayed(userId, 10);
  } catch (error) {
    console.error(
      `Error updating recently played for user ${userId}, game ${gameId}:`,
      error
    );
  }
}

export async function getUserRecentlyPlayed(
  userId: string,
  count: number = 5
): Promise<(Game & RecentlyPlayedInfo)[]> {
  if (!userId) return [];
  try {
    const recentPlaysRef = collection(db, "users", userId, "recentlyPlayed");
    const q = query(
      recentPlaysRef,
      orderBy("lastPlayed", "desc"),
      limit(count)
    );
    const snapshot = await getDocs(q);

    const recentPlays: RecentlyPlayedInfo[] = snapshot.docs.map(
      (doc) => doc.data() as RecentlyPlayedInfo
    );

    // Fetch full game details for each recent play
    const gamePromises = recentPlays.map((play) => getGameById(play.gameId));
    const games = (await Promise.all(gamePromises)).filter(
      (game) => game !== null
    ) as Game[];

    // Combine game details with play info
    const combinedResults = recentPlays
      .map((playInfo) => {
        const gameDetail = games.find((g) => g.id === playInfo.gameId);
        return gameDetail ? { ...gameDetail, ...playInfo } : null;
      })
      .filter((result) => result !== null) as (Game & RecentlyPlayedInfo)[]; // Filter out nulls if a game was deleted

    return combinedResults;
  } catch (error) {
    console.error(`Error fetching recently played for user ${userId}:`, error);
    return [];
  }
}

export interface UserRating {
  gameId: string;
  rating: number; // 1-5
  ratedAt: Timestamp;
}

export async function getUserRatingForGame(
  userId: string,
  gameId: string
): Promise<number | null> {
  if (!userId || !gameId) return null;
  try {
    const ratingRef = doc(db, "users", userId, "gameRatings", gameId);
    const ratingSnap = await getDoc(ratingRef);
    if (ratingSnap.exists()) {
      return (ratingSnap.data() as UserRating).rating;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user rating for game ${gameId}:`, error);
    return null;
  }
}

// Function to submit a rating AND update the game's average atomically
export async function submitGameRating(
  userId: string,
  gameId: string,
  rating: number
): Promise<boolean> {
  if (!userId || !gameId || rating < 1 || rating > 5) {
    console.error("Invalid input for submitGameRating");
    return false;
  }

  const gameRef = doc(db, "games", gameId);
  const userRatingRef = doc(db, "users", userId, "gameRatings", gameId);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get the current game data
      const gameDoc = await transaction.get(gameRef);
      if (!gameDoc.exists()) {
        throw new Error(`Game document ${gameId} does not exist!`);
      }
      const gameData = gameDoc.data() as Game & {
        ratingCount?: number;
        averageRating?: number;
      }; // Include potential rating fields

      // 2. Get the user's *previous* rating for this game (if any)
      const userRatingDoc = await transaction.get(userRatingRef);
      const previousRatingData = userRatingDoc.exists()
        ? (userRatingDoc.data() as UserRating)
        : null;

      // 3. Calculate new average rating
      const currentRatingCount = gameData.ratingCount || 0;
      const currentAverageRating = gameData.averageRating || 0;
      const previousUserRatingValue = previousRatingData?.rating; // User's previous score (could be null)

      let newRatingCount = currentRatingCount;
      let newRatingSum = currentAverageRating * currentRatingCount;

      if (
        previousUserRatingValue !== undefined &&
        previousUserRatingValue !== null
      ) {
        // User is *changing* their rating
        newRatingSum = newRatingSum - previousUserRatingValue + rating;
        // Rating count stays the same
      } else {
        // User is rating for the *first* time
        newRatingSum = newRatingSum + rating;
        newRatingCount = currentRatingCount + 1;
      }

      const newAverageRating =
        newRatingCount > 0 ? newRatingSum / newRatingCount : 0;

      // 4. Update the game document within the transaction
      transaction.update(gameRef, {
        averageRating: newAverageRating,
        ratingCount: newRatingCount,
      });

      // 5. Set/Update the user's rating document within the transaction
      const userRatingData: UserRating = {
        gameId: gameId,
        rating: rating,
        ratedAt: Timestamp.now(), // Use server timestamp ideally
      };
      transaction.set(userRatingRef, userRatingData); // Overwrite previous rating if exists
    });

    console.log(
      `Rating ${rating} submitted successfully for game ${gameId} by user ${userId}`
    );
    return true;
  } catch (error) {
    console.error("Transaction failed: ", error);
    return false;
  }
}

// --- NEW Game Save Data Functions ---

export interface GameSaveData {
  gameId: string;
  saveData: string; // JSON stringified key-value pairs from localStorage
  savedAt: Timestamp;
}

/**
 * Fetches the latest saved game data string for a user and game.
 * Returns null if no save exists or on error.
 */
export async function loadGameSaveData(
  userId: string,
  gameId: string
): Promise<string | null> {
  if (!userId || !gameId) return null;
  try {
    const saveRef = doc(db, "users", userId, "gameSaves", gameId);
    const saveSnap = await getDoc(saveRef);
    if (saveSnap.exists()) {
      const data = saveSnap.data() as GameSaveData;
      return data.saveData; // Return the stringified data
    }
    return null; // No save data found
  } catch (error) {
    console.error(`Error loading save data for game ${gameId}:`, error);
    return null;
  }
}

/**
 * Saves the game data string for a user and game.
 * Overwrites existing save data for that game.
 */
export async function saveGameSaveData(
  userId: string,
  gameId: string,
  saveData: string
): Promise<boolean> {
  if (!userId || !gameId) return false;
  try {
    const saveRef = doc(db, "users", userId, "gameSaves", gameId);
    const dataToSave: GameSaveData = {
      gameId: gameId,
      saveData: saveData,
      savedAt: Timestamp.now(), // Use client-side timestamp for simplicity, or serverTimestamp()
    };
    // Use set() which creates or completely overwrites the document
    await setDoc(saveRef, dataToSave);
    console.log(`Saved data for game ${gameId}`);
    return true;
  } catch (error) {
    console.error(`Error saving data for game ${gameId}:`, error);
    return false;
  }
}

// --- End of new functions ---

export async function getAllGames(
  orderByField: keyof Game = "name",
  orderDirection: "asc" | "desc" = "asc"
): Promise<Game[]> {
  try {
    const gamesRef = collection(db, "games");
    // Add ordering (e.g., by name ascending by default)
    const q = query(gamesRef, orderBy(orderByField, orderDirection));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No games found in Firestore collection 'games'.");
      // Fallback to static data if Firestore is empty? Or show empty message.
      // import gameData from '@/data/games.json'; return gameData; // Example fallback
      return [];
    }

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          // Add type assertion or validation if necessary
          ...doc.data(),
        } as Game)
    );
  } catch (error) {
    console.error("Error fetching all games:", error);
    return []; // Return empty array on error
  }
}

// --- NEW Function to get games rated by user ---
// Define a combined type for rated games with user's rating
export type RatedGameInfo = Game & { userRating: number; ratedAt: Timestamp };

export async function getUserRatedGames(
  userId: string
): Promise<RatedGameInfo[]> {
  if (!userId) return [];
  try {
    const ratingsRef = collection(db, "users", userId, "gameRatings");
    // Optional: Order by rating date if needed
    const q = query(ratingsRef, orderBy("ratedAt", "desc"));
    const snapshot = await getDocs(q);

    const userRatings: UserRating[] = snapshot.docs.map(
      (doc) => doc.data() as UserRating
    );

    if (userRatings.length === 0) return [];

    // Fetch full game details for each rated game
    // Batching reads might be slightly more efficient for many ratings
    const gamePromises = userRatings.map((ratingInfo) =>
      getGameById(ratingInfo.gameId)
    );
    const games = (await Promise.all(gamePromises)).filter(
      (game) => game !== null
    ) as Game[];

    // Combine game details with the user's rating info
    const combinedResults = userRatings
      .map((ratingInfo) => {
        const gameDetail = games.find((g) => g.id === ratingInfo.gameId);
        return gameDetail
          ? {
              ...gameDetail,
              userRating: ratingInfo.rating,
              ratedAt: ratingInfo.ratedAt,
            }
          : null;
      })
      .filter((result) => result !== null) as RatedGameInfo[]; // Filter out games that might have been deleted

    return combinedResults;
  } catch (error) {
    console.error(`Error fetching rated games for user ${userId}:`, error);
    return [];
  }
}
