// functions/src/index.ts

import * as functions from "firebase-functions/v1"; // Use v1 SDK entry point
import * as admin from "firebase-admin";
import { Change, EventContext } from "firebase-functions/v1"; // Import v1 types if needed
import { DocumentSnapshot } from "firebase-admin/firestore"; // Use admin snapshot type

// Initialize Firebase Admin SDK
try {
    // Check if already initialized before initializing
    if (!admin.apps.length) {
        admin.initializeApp();
        functions.logger.info("Firebase Admin SDK initialized.");
    }
} catch (e) {
    functions.logger.error("Admin App already initialized or init failed:", e);
}
const db = admin.firestore();
const { FieldValue } = admin.firestore; // Get FieldValue for increment

// --- Helper Functions (Removed as they were unused) ---

// === Firestore Triggers (v1 Syntax) ===

/**
 * Triggered when a user's rating for a game is created, updated, or deleted.
 * Recalculates the game's average rating and rating count.
 * Also updates the user's total rating count.
 */
export const onUserRatingWrite = functions.firestore
    .document("users/{userId}/gameRatings/{gameId}")
    // v1 signature: change contains before/after snapshots, context has params
    .onWrite(async (change: Change<DocumentSnapshot>, context: EventContext) => {
        const { gameId, userId } = context.params; // Get params from context
        const gameRef = db.collection("games").doc(gameId);
        const userRef = db.collection("users").doc(userId);

        functions.logger.info(`v1 Rating write for game: ${gameId}, User: ${userId}. Recalculating average...`);

        // Recalculate the average rating using a transaction
        try {
            await db.runTransaction(async (transaction) => {
                // Get all ratings for this game using collectionGroup
                const ratingsRef = db.collectionGroup("gameRatings").where("gameId", "==", gameId);
                // Use transaction.get with Query type from admin SDK
                const ratingsSnap: admin.firestore.QuerySnapshot = await transaction.get(ratingsRef);

                let totalRating = 0;
                let ratingCount = 0;

                ratingsSnap.forEach((doc) => {
                    const rating = doc.data()?.rating;
                    if (typeof rating === "number" && rating >= 1 && rating <= 5) {
                        totalRating += rating;
                        ratingCount++;
                    }
                });

                const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
                functions.logger.info(`Game ${gameId}: New Avg = ${averageRating.toFixed(2)}, Count = ${ratingCount}`);

                // Update the game document within the transaction
                transaction.update(gameRef, {
                    averageRating: averageRating,
                    ratingCount: ratingCount,
                });
            });
            functions.logger.info(`Successfully updated aggregate rating for game: ${gameId}`);
        } catch (error) {
            functions.logger.error(`Error updating aggregate rating for game ${gameId}:`, error);
        }

        // --- Update User's Aggregate Rating Count ---
        try {
             const userRatingsCollectionRef = userRef.collection("gameRatings");
             // Use get() then size for count in v1 admin SDK (count().get() is newer client/admin feature)
             const userRatingsSnap = await userRatingsCollectionRef.get();
             const totalRatingsSubmitted = userRatingsSnap.size; // Get count from size

             functions.logger.info(`Updating rating count for user ${userId} to ${totalRatingsSubmitted}`);
             await userRef.set({ totalRatingsSubmitted: totalRatingsSubmitted }, { merge: true });
             functions.logger.info(`Successfully updated totalRatingsSubmitted for user ${userId}`);
        } catch (error) {
             functions.logger.error(`Error updating totalRatingsSubmitted for user ${userId}:`, error);
        }
    });


/**
 * Triggered when a user's recently played record is written (created/updated/deleted).
 * Updates the game's total playtime and the user's aggregate stats.
 */
export const onUserRecentPlayWrite = functions.firestore
    .document("users/{userId}/recentlyPlayed/{gameId}")
    .onWrite(async (change: Change<DocumentSnapshot>, context: EventContext) => {
        const { userId, gameId } = context.params;
        const gameRef = db.collection("games").doc(gameId);
        const userRef = db.collection("users").doc(userId);

        // Use change.before.exists and change.after.exists (boolean properties)
        const beforeData = change.before?.exists ? change.before.data() : null;
        const afterData = change.after?.exists ? change.after.data() : null;
        let playtimeIncrement = 0;

        if (change.after?.exists && afterData) { // Document created or updated
            const sessionPlaytime = afterData.playtimeSeconds;
            if (typeof sessionPlaytime === "number" && sessionPlaytime > 0) {
                const oldPlaytime = beforeData?.playtimeSeconds;
                // Increment if created OR playtime changed
                if (!change.before?.exists || sessionPlaytime !== oldPlaytime) {
                    playtimeIncrement = sessionPlaytime;
                    functions.logger.info(`RecentPlay Write: Game ${gameId}, User ${userId}. Playtime added: ${playtimeIncrement}s`);
                } else {
                    functions.logger.info(`RecentPlay Write: Game ${gameId}, User ${userId}. Playtime unchanged.`);
                }
            } else {
                 functions.logger.info(`RecentPlay Write: Game ${gameId}, User ${userId}. No playtime in this update.`);
            }
        } else if (change.before?.exists && !change.after?.exists) {
            functions.logger.info(`RecentPlay Write: Game ${gameId}, User ${userId}. Document deleted.`);
            // Handle potential playtime decrement if needed on delete (complex)
        }


        // --- Update Game Aggregate Playtime ---
        if (playtimeIncrement > 0) {
            try {
                functions.logger.info(`Incrementing game ${gameId} playtime by ${playtimeIncrement}`);
                await gameRef.set({
                    totalPlaytimeSeconds: FieldValue.increment(playtimeIncrement),
                }, { merge: true });
                functions.logger.info(`Successfully incremented totalPlaytimeSeconds for game ${gameId}`);
            } catch (error) {
                functions.logger.error(`Error incrementing totalPlaytimeSeconds for game ${gameId}:`, error);
            }
        }

        // --- Update User Aggregate Playtime & Games Played Count ---
        try {
            const updateData: { totalPlaytimeSeconds?: admin.firestore.FieldValue, totalGamesPlayed?: admin.firestore.FieldValue } = {};

            if (playtimeIncrement > 0) {
                 updateData.totalPlaytimeSeconds = FieldValue.increment(playtimeIncrement);
            }

            // Update totalGamesPlayed based on document creation/deletion
            if (!change.before?.exists && change.after?.exists) { // Created
                 updateData.totalGamesPlayed = FieldValue.increment(1);
                 functions.logger.info(`Incrementing totalGamesPlayed for user ${userId}`);
            } else if (change.before?.exists && !change.after?.exists) { // Deleted
                 updateData.totalGamesPlayed = FieldValue.increment(-1);
                 functions.logger.info(`Decrementing totalGamesPlayed for user ${userId}`);
            }

            if (Object.keys(updateData).length > 0) {
                 functions.logger.info(`Updating user ${userId} aggregate stats:`, updateData);
                 await userRef.set(updateData, { merge: true });
                 functions.logger.info(`Successfully updated user ${userId} aggregates.`);
            }

        } catch (error) {
            functions.logger.error(`Error updating user ${userId} aggregates:`, error);
        }
    });


// --- EGS Calculation Weights (Tune These!) ---
const W_VISITS = 1.5; const W_RATING = 15.0; const W_PLAYTIME = 1.0; const W_RATING_COUNT = 0.5;

/**
 * Triggered ONLY when game stats used for EGS are updated. Recalculates EGS.
 * Uses onUpdate trigger.
 */
export const calculateGameEGS = functions.firestore
    .document("games/{gameId}")
    // v1 signature for update: change contains before/after, context has params
    .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
        const gameId = context.params.gameId;
        // For onUpdate, change.before and change.after are guaranteed to exist
        const newData = change.after.data();
        const oldData = change.before.data();

        // Check if data objects exist (should always for onUpdate)
        if (!newData || !oldData) {
            functions.logger.error(`Game ${gameId}: Missing data object in update event. Skipping EGS.`);
            return null;
        }

        // Check if relevant fields actually changed
        if (newData.totalVisits === oldData.totalVisits &&
            newData.averageRating === oldData.averageRating &&
            newData.ratingCount === oldData.ratingCount &&
            newData.totalPlaytimeSeconds === oldData.totalPlaytimeSeconds) {
            // functions.logger.info(`Game ${gameId}: No relevant fields changed, skipping EGS calculation.`);
            return null; // Exit if no relevant change
        }

        functions.logger.info(`Game ${gameId}: Relevant stats changed, calculating EGS...`);

        const visits = newData.totalVisits || 0;
        const rating = newData.averageRating || 0;
        const ratingCount = newData.ratingCount || 0;
        const playtimeMins = (newData.totalPlaytimeSeconds || 0) / 60;

        const visitsScore = Math.log10(visits + 1) * W_VISITS;
        const ratingScore = rating * W_RATING;
        const playtimeScore = Math.log10(playtimeMins + 1) * W_PLAYTIME;
        const ratingCountScore = Math.log10(ratingCount + 1) * W_RATING_COUNT;

        const egs = visitsScore + ratingScore + playtimeScore + ratingCountScore;
        const finalEgs = parseFloat(egs.toFixed(4)); // Round

        functions.logger.info(`Game ${gameId}: Calculated EGS = ${finalEgs}`);
        try {
            // Use change.after.ref for the reference in v1 as well
            await change.after.ref.update({ elementGamesScore: finalEgs });
            functions.logger.info(`Game ${gameId}: Successfully updated EGS score.`);
        } catch (error) {
            functions.logger.error(`Game ${gameId}: Error updating EGS score:`, error);
        }
        return null;
    });


// --- User Score Calculation Weights (Tune These!) ---
const W_USER_PLAYTIME = 0.8; const W_USER_RATINGS = 5.0; const W_USER_GAMES = 2.0;

/**
 * Triggered ONLY when user aggregate stats are updated. Recalculates User Score.
 */
export const calculateUserScore = functions.firestore
    .document("users/{userId}")
     // v1 signature for update
    .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
         const userId = context.params.userId;
         const newData = change.after.data();
         const oldData = change.before.data();

         // Check if data objects exist
         if (!newData || !oldData) {
            functions.logger.error(`User ${userId}: Missing data object in update event. Skipping User Score.`);
            return null;
         }

        // Check if relevant fields changed
        if (newData.totalPlaytimeSeconds === oldData.totalPlaytimeSeconds &&
            newData.totalRatingsSubmitted === oldData.totalRatingsSubmitted &&
            newData.totalGamesPlayed === oldData.totalGamesPlayed) {
            // functions.logger.info(`User ${userId}: No relevant fields changed, skipping User Score calculation.`);
            return null; // Skip if no relevant change
        }

        functions.logger.info(`User ${userId}: Relevant stats changed, calculating User Score...`);

        const playtimeHours = (newData.totalPlaytimeSeconds || 0) / 3600;
        const ratingsCount = newData.totalRatingsSubmitted || 0;
        const gamesPlayedCount = newData.totalGamesPlayed || 0;

        const playtimeScore = Math.log10(playtimeHours + 1) * W_USER_PLAYTIME;
        const ratingActivityScore = ratingsCount * W_USER_RATINGS;
        const gameVarietyScore = gamesPlayedCount * W_USER_GAMES;

        const score = playtimeScore + ratingActivityScore + gameVarietyScore;
        const finalScore = parseFloat(score.toFixed(4));

        functions.logger.info(`User ${userId}: Calculated Score = ${finalScore}`);
        try {
            await change.after.ref.update({ userScore: finalScore });
            functions.logger.info(`User ${userId}: Successfully updated User Score.`);
        } catch (error) {
             functions.logger.error(`User ${userId}: Error updating User Score:`, error);
        }
        return null;
    });