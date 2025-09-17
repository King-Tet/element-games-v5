// src/utils/calculations.ts
import { Game } from '@/types/game';
import { UserProfileData } from '@/types/user';
/**
 * Calculates the Element Games Score (EGS) for a given game.
 * EGS = floor(min(100, max(1, 5 * [ (0.5 * AR * log10(TR+1)) + (0.3 * log10(PT+1)) + (0.2 * log10(GV+1)) ] )))
 * @param game Game data object with stats fields.
 * @returns The calculated EGS score (1-100).
 */
export function calculateEGS(game: Partial<Game>): number {
    const AR = game.averageRating || 0;
    const TR = game.ratingCount || 0;
    const GV = game.totalVisits || 0;
    // Calculate playtime in minutes
    const PT = (game.totalPlaytimeSeconds || 0) / 60;

    // Prevent log10(0) or log10(negative) by adding 1
    const ratingComponent = 0.5 * AR * Math.log10(TR + 1);
    const playtimeComponent = 0.3 * Math.log10(PT + 1);
    const visitsComponent = 0.2 * Math.log10(GV + 1);

    // Raw score before scaling and clamping
    const rawWeightedScore = ratingComponent + playtimeComponent + visitsComponent;

    // Scale by 5
    const scaledScore = 5 * rawWeightedScore;

    // Clamp between 1 and 100, then floor
    const finalScore = Math.floor(Math.min(100, Math.max(1, scaledScore)));

    // Handle NaN case (if inputs were somehow invalid resulting in NaN intermediate)
    return isNaN(finalScore) ? 1 : finalScore;
}

// --- NEW User Score Calculation Weights ---
const W_USER_PLAYTIME = 1.0;    // Playtime in Hours
const W_USER_RATINGS = 15.0;    // Base value for rating activity
const W_USER_GAMES = 2.5;       // For game variety
const W_RECENCY_BONUS = 1.2;    // 20% bonus for recent activity

/**
 * Calculates a more balanced User Score.
 * This version introduces diminishing returns for rating submissions and a recency bonus.
 * @param user User data object with stats fields.
 * @param recentPlaySessions An array of the user's recent play sessions.
 * @returns The calculated User Score.
 */
export function calculateUserScore(
    user: Partial<UserProfileData>,
    recentPlaySessions?: { lastPlayed: { toDate: () => Date } }[]
): number {
    const playtimeHours = (user.totalPlaytimeSeconds || 0) / 3600;
    const ratingsCount = user.totalRatingsSubmitted || 0;
    const gamesPlayedCount = user.totalGamesPlayed || 0;

    // 1. Playtime Score (Logarithmic Scale)
    const playtimeScore = Math.log10(playtimeHours + 1) * W_USER_PLAYTIME;

    // 2. Rating Activity Score (Logarithmic Scale for diminishing returns)
    const ratingActivityScore = Math.log10(ratingsCount + 1) * W_USER_RATINGS;

    // 3. Game Variety Score (Linear)
    const gameVarietyScore = gamesPlayedCount * W_USER_GAMES;

    // 4. Recency Bonus
    let recencyMultiplier = 1.0;
    if (recentPlaySessions && recentPlaySessions.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const wasActiveRecently = recentPlaySessions.some(
            (session) => session.lastPlayed.toDate() > thirtyDaysAgo
        );

        if (wasActiveRecently) {
            recencyMultiplier = W_RECENCY_BONUS;
        }
    }

    // 5. Final Calculation
    const score = (playtimeScore + ratingActivityScore + gameVarietyScore) * recencyMultiplier;

    const finalScore = parseFloat(score.toFixed(2));
    return isNaN(finalScore) ? 0 : finalScore;
}


/**
* Formats seconds into HH:MM:SS or MM:SS string.
*/
export function formatPlaytime(totalSeconds: number | undefined | null): string {
    if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
        return '00:00';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0) {
        const paddedHours = String(hours).padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    } else {
        return `${paddedMinutes}:${paddedSeconds}`;
    }
}

 /**
 * Formats large numbers with K, M, B suffixes.
 */
 export function formatNumber(num: number | undefined | null): string {
    if (num === null || num === undefined || isNaN(num)) {
        return '0';
    }
    if (num < 1000) { return String(num); }
    if (num < 1000000) { return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'; }
    if (num < 1000000000) { return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'; }
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
}
