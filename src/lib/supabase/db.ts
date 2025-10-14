// src/lib/supabase/db.ts
import { supabase } from "./client";
import { UserProfileData, UserProfile } from "@/types/user";
import { Game, LeaderboardConfig, IndexedDbConfig } from "@/types/game";

export interface RecentlyPlayedInfo {
  last_played: string;
  playtime_seconds?: number;
}

export interface RatedGameInfo {
  userRating: number;
  rated_at: string;
}

interface DbGame {
  id: string;
  name: string;
  description: string;
  image_url: string;
  source_url: string;
  category: string;
  average_rating?: number;
  rating_count?: number;
  total_visits?: number;
  total_playtime_seconds?: number;
  release_date: string | null;
  local_storage_keys?: string[];
  indexed_db_config?: IndexedDbConfig;
  leaderboard_configs?: LeaderboardConfig[];
  element_games_score?: number;
  rating: number;
  visits: number;
  pinned_note?: string | null;
}

const mapGameData = (game: DbGame): Game => ({
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
  leaderboardConfigs: game.leaderboard_configs,
  elementGamesScore: game.element_games_score,
  rating: game.rating,
  visits: game.visits,
  pinned_note: game.pinned_note,
});

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

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);
  return { error };
}

export async function getUserDataByUsername(username: string): Promise<
  (UserProfileData & { rank: number | null; user_score: number }) | null
> {
  const { data: user, error } = await supabase
    .from("profiles")
    .select("*, user_score")
    .eq("username", username)
    .single();
  if (error || !user) return null;
  
  const { data: rankData, error: rpcError } = await supabase.rpc("get_user_rank", {
    p_user_id: user.id,
  });

  if (rpcError) {
      console.error("Error getting user rank from RPC:", rpcError);
      return { ...user, rank: null, user_score: user.user_score ?? 0 };
  }
  return { ...user, rank: rankData, user_score: user.user_score ?? 0 };
}

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
  return data.map((user: UserProfile) => ({
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

export async function logPlaytime(
  userId: string,
  gameId: string,
  playtimeSeconds: number
): Promise<void> {
  // This now calls the new, more powerful RPC function
  const { error } = await supabase.rpc("update_playtime_and_total", {
    p_user_id: userId,
    p_game_id: gameId,
    p_playtime_seconds_increment: playtimeSeconds,
  });
  if (error) {
    console.error("Error logging playtime:", error);
  }
}

export async function getUserRecentlyPlayed(
  userId: string,
  count: number = 5
): Promise<(Game & RecentlyPlayedInfo)[]> {
  const { data, error } = await supabase
    .from("recently_played")
    .select("last_played, playtime_seconds, games(*)")
    .eq("user_id", userId)
    .order("last_played", { ascending: false })
    .limit(count);

  if (error) {
    console.error("Error fetching recently played:", error);
    return [];
  }

  return (data || [])
    .filter((item) => item.games)
    .map((item) => {
      const gameData = Array.isArray(item.games) ? item.games[0] : item.games;
      return {
        ...mapGameData(gameData),
        last_played: item.last_played,
        playtime_seconds: item.playtime_seconds,
      };
    });
}

export async function getUserRatedGames(
  userId: string
): Promise<(Game & RatedGameInfo)[]> {
  const { data, error } = await supabase
    .from("game_ratings")
    .select("rated_at, rating, games(*)")
    .eq("user_id", userId)
    .order("rated_at", { ascending: false });

  if (error) {
    console.error("Error fetching rated games:", error);
    return [];
  }
  return (data || [])
    .filter((item) => item.games)
    .map((item) => {
        const gameData = Array.isArray(item.games) ? item.games[0] : item.games;
        return {
            ...mapGameData(gameData),
            userRating: item.rating,
            rated_at: item.rated_at,
        };
    });
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
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('submit_game_rating', {
      p_user_id: userId,
      p_game_id: gameId,
      p_rating: rating,
  });
  return { error };
}

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
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("game_saves").upsert({
    user_id: userId,
    game_id: gameId,
    save_data: JSON.parse(saveData),
    saved_at: new Date().toISOString(),
  });
  return { error };
}

export async function incrementGameVisit(gameId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_game_visit', { game_id_to_update: gameId });
  if (error) {
    console.error('Error incrementing game visit:', error);
  }
}