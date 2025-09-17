// src/lib/supabase/db.ts
import { supabase } from "./client";
import { UserProfileData } from "@/types/user";
import { Game } from "@/types/game";
import { MediaWatchProgress } from "@/types/watch";

// Define placeholder types.
export interface RecentlyPlayedInfo {
  last_played: string;
  playtime_seconds?: number;
}

export interface RatedGameInfo {
  userRating: number;
  rated_at: string;
}

// --- Helper to map DB columns to JS properties ---
const mapGameData = (game: any): Game => ({
  ...game,
  id: game.id,
  name: game.name,
  description: game.description,
  imageUrl: game.image_url,
  sourceUrl: game.source_url,
  category: game.category,
  averageRating: game.average_rating,
  ratingCount: game.rating_count,
  totalVisits: game.total_visits,
  totalPlaytimeSeconds: game.total_playtime_seconds,
  releaseDate: game.release_date,
  localStorageKeys: game.local_storage_keys,
  indexedDbConfig: game.indexed_db_config,
  leaderboardConfigs: game.leaderboard_configs, // Map snake_case to camelCase
  elementGamesScore: game.element_games_score, // EGS from RPC
  rating: game.rating, // fallback
  visits: game.visits, // fallback
});

// --- User Profile Functions ---
export async function getUserProfileData(
  userId: string
): Promise<UserProfileData | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("Error fetching user profile:", error.message);
    return null;
  }
  return data as UserProfileData | null;
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);
  return { error };
}

export async function getUserDataByUsername(
  username: string
): Promise<(UserProfileData & { rank?: number | null; user_score?: number }) | null> {
  const { data: user, error } = await supabase
    .from("profiles")
    .select("*, user_score") // Explicitly select user_score
    .eq("username", username)
    .single();
  if (error || !user) return null;
  
  const { data: rankData, error: rpcError } = await supabase.rpc("get_user_rank", {
    p_user_id: user.id,
  });

  if (rpcError) {
      console.error("Error getting user rank from RPC:", rpcError);
      return { ...user, rank: null, user_score: user.user_score };
  }
  return { ...user, rank: rankData, user_score: user.user_score };
}


// --- Game Data Functions ---
export async function getGameById(gameId: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();
  if (error) {
    console.error(`Error fetching game by ID (${gameId}):`, error);
    return null;
  }
  return mapGameData(data);
}

export async function getAllGames(
  orderByField: string = "name",
  ascending: boolean = true
): Promise<Game[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order(orderByField, { ascending });
  if (error) {
    console.error("Error fetching all games:", error);
    return [];
  }
  return data.map(mapGameData);
}

export async function getTrendingGames(count: number = 5): Promise<Game[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("total_visits", { ascending: false })
    .limit(count);
  if (error) {
    console.error("Error fetching trending games:", error);
    return [];
  }
  return data.map(mapGameData);
}

export async function getNewGames(count: number = 5): Promise<Game[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("release_date", { ascending: false })
    .limit(count);
  if (error) {
    console.error("Error fetching new games:", error);
    return [];
  }
  return data.map(mapGameData);
}

// --- NEW LEADERBOARD FUNCTIONS ---

export async function getGamesWithLeaderboards(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .not('leaderboard_configs', 'is', null);

  if (error) {
    console.error("Error fetching games with leaderboards:", error);
    return [];
  }
  return data.map(mapGameData);
}

export async function getTopGamesByEGS(count: number): Promise<Game[]> {
  const { data, error } = await supabase.rpc('get_top_games_with_egs', { p_limit: count });
  if (error) {
    console.error("Error fetching top games by EGS via RPC:", JSON.stringify(error, null, 2));
    return [];
  }
  return data.map(mapGameData);
}

export async function getTopUsersByScore(count: number): Promise<(UserProfileData & { userScore: number })[]> {
  const { data, error } = await supabase.rpc('get_top_users_with_score', { p_limit: count });
   if (error) {
    console.error("Error fetching top users by score via RPC:", JSON.stringify(error, null, 2));
    return [];
  }
  return data.map((user: any) => ({
      uid: user.id,
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      photoURL: user.avatar_url,
      avatar_url: user.avatar_url,
      totalPlaytimeSeconds: user.total_playtime_seconds,
      total_playtime_seconds: user.total_playtime_seconds,
      totalRatingsSubmitted: user.total_ratings_submitted,
      total_ratings_submitted: user.total_ratings_submitted,
      totalGamesPlayed: user.total_games_played,
      total_games_played: user.total_games_played,
      userScore: user.user_score,
  }));
}


// --- User Game Interaction Functions ---
export async function updateUserRecentlyPlayed(
  userId: string,
  gameId: string,
  playtimeSeconds: number
): Promise<void> {
  const { error } = await supabase.rpc("update_recently_played", {
    p_user_id: userId,
    p_game_id: gameId,
    p_playtime_seconds: playtimeSeconds,
  });
  if (error) console.error("Error updating recently played:", error);
}

export async function getUserRecentlyPlayed(
  userId: string,
  count: number = 5
): Promise<(Game & RecentlyPlayedInfo)[]> {
  const { data, error } = await supabase
    .from("recently_played")
    .select(
      `
            last_played,
            playtime_seconds,
            games (
                *
            )
        `
    )
    .eq("user_id", userId)
    .order("last_played", { ascending: false })
    .limit(count);

  if (error) {
    console.error("Error fetching recently played:", error);
    return [];
  }

  return (data || [])
    .filter((item) => item.games)
    .map((item) => ({
      ...mapGameData(item.games),
      last_played: item.last_played,
      playtime_seconds: item.playtime_seconds,
    }));
}

export async function getUserRatedGames(
  userId: string
): Promise<(Game & RatedGameInfo)[]> {
  const { data, error } = await supabase
    .from("game_ratings")
    .select(
      `
            rated_at,
            rating,
            games (
                *
            )
        `
    )
    .eq("user_id", userId)
    .order("rated_at", { ascending: false });

  if (error) {
    console.error("Error fetching rated games:", error);
    return [];
  }
  return (data || [])
    .filter((item) => item.games)
    .map((item) => ({
      ...mapGameData(item.games),
      userRating: item.rating,
      rated_at: item.rated_at,
    }));
}

export async function getUserRatingForGame(
  userId: string,
  gameId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("game_ratings")
    .select("rating")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .single();
  return error || !data ? null : data.rating;
}

export async function submitGameRating(
  userId: string,
  gameId: string,
  rating: number
): Promise<{ error: any }> {
  const { error } = await supabase.rpc('submit_game_rating', {
      p_user_id: userId,
      p_game_id: gameId,
      p_rating: rating,
  });
  return { error };
}

// --- Game Save Functions ---
export async function loadGameSaveData(
  userId: string,
  gameId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("game_saves")
    .select("save_data")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .single();
  return error || !data ? null : JSON.stringify(data.save_data);
}

export async function saveGameSaveData(
  userId: string,
  gameId: string,
  saveData: string
): Promise<{ error: any }> {
  const { error } = await supabase.from("game_saves").upsert({
    user_id: userId,
    game_id: gameId,
    save_data: JSON.parse(saveData),
    saved_at: new Date().toISOString(),
  });
  return { error };
}

export async function updateMediaProgress(
  userId: string,
  progressData: Omit<MediaWatchProgress, 'lastWatched'>
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('media_watch_history')
    .upsert({
      user_id: userId,
      media_id: progressData.mediaId,
      media_type: progressData.mediaType,
      title: progressData.title,
      poster_path: progressData.posterPath,
      last_watched_season: progressData.lastWatchedSeason,
      last_watched_episode: progressData.lastWatchedEpisode,
      progress_seconds: progressData.progressSeconds,
      last_watched: new Date().toISOString(), // Always update timestamp
    });

  if (error) {
    console.error("Error updating media progress:", error);
  }
  return { error };
}

/**
 * Fetches the list of media the user is currently watching.
 */
export async function getContinueWatchingList(
  userId: string
): Promise<MediaWatchProgress[]> {
  const { data, error } = await supabase
    .from('media_watch_history')
    .select('*')
    .eq('user_id', userId)
    .order('last_watched', { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching continue watching list:", error);
    return [];
  }

  // Map snake_case from DB to camelCase for the app
  return data.map(item => ({
      mediaId: item.media_id,
      mediaType: item.media_type,
      title: item.title,
      posterPath: item.poster_path,
      lastWatchedSeason: item.last_watched_season,
      lastWatchedEpisode: item.last_watched_episode,
      progressSeconds: item.progress_seconds,
      lastWatched: item.last_watched,
  }));
}

export async function incrementGameVisit(gameId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_game_visit', { game_id_to_update: gameId });
  if (error) {
    console.error('Error incrementing game visit:', error);
  }
}

/**
 * Fetches the watch progress for a single media item for a user.
 */
export async function getMediaProgress(
  userId: string,
  mediaId: string
): Promise<MediaWatchProgress | null> {
  const { data, error } = await supabase
    .from('media_watch_history')
    .select('*')
    .eq('user_id', userId)
    .eq('media_id', mediaId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching media progress:", error);
    return null;
  }
  if (!data) return null;

  return {
      mediaId: data.media_id,
      mediaType: data.media_type,
      title: data.title,
      posterPath: data.poster_path,
      lastWatchedSeason: data.last_watched_season,
      lastWatchedEpisode: data.last_watched_episode,
      progressSeconds: data.progress_seconds,
      lastWatched: data.last_watched,
  };
}
