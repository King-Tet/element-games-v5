// src/lib/user-actions.ts
import { UserProfileData, UserProfile, ActivityGame } from '@/types/user';
import { formatPlaytime } from '@/utils/calculations';
import { supabase } from '@/lib/supabase/client';

// Helper functions to fetch user data, moved from the API route.
async function getProfileByUsername(username: string): Promise<UserProfileData | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

async function getRecentlyPlayed(userId: string): Promise<unknown[]> {
    const { data, error } = await supabase
        .from('recently_played')
        .select('*, games(*)')
        .eq('user_id', userId)
        .order('last_played', { ascending: false })
        .limit(4);
    return error ? [] : data || [];
}

async function getRecentlyRated(userId: string): Promise<unknown[]> {
    const { data, error } = await supabase
        .from('game_ratings')
        .select('*, games(*)')
        .eq('user_id', userId)
        .order('rated_at', { ascending: false })
        .limit(4);
    return error ? [] : data || [];
}

/**
 * A shared server-side function to fetch and assemble all data for a user profile page.
 * This can be called directly from Server Components or from API routes.
 * @param username The username of the profile to fetch.
 * @returns A complete UserProfile object or null if not found.
 */
export async function getProfileForPage(username: string): Promise<UserProfile | null> {
    const profileData = await getProfileByUsername(username);

    if (!profileData) {
        return null;
    }

    const [recentlyPlayed, recentlyRated, userRankData] = await Promise.all([
        getRecentlyPlayed(profileData.id),
        getRecentlyRated(profileData.id),
        supabase.rpc("get_user_rank", { p_user_id: profileData.id })
    ]);

    // Type definition for mapping recently played games
    type RecentlyPlayedRow = {
        games: { id: string; name: string; image_url: string; };
        last_played: string;
    };
    
    const recentlyPlayedGames: ActivityGame[] = (recentlyPlayed as RecentlyPlayedRow[])
        .filter((p) => p.games) // Ensure game data exists
        .map((p) => ({
            id: p.games.id,
            title: p.games.name,
            bannerUrl: p.games.image_url,
            lastPlayed: p.last_played,
        }));

    // Type guard and mapping for recently rated games
    const recentlyRatedGames: ActivityGame[] = recentlyRated
        .filter((r): r is { games: { id: string; name: string; image_url: string }, rating: number } => 
            typeof r === 'object' && r !== null && 'games' in r && (r as { games?: unknown }).games !== undefined
        )
        .map((r) => ({
            id: r.games.id,
            title: r.games.name,
            bannerUrl: r.games.image_url,
            rating: r.rating,
        }));

    // Assemble the final response object
    const userProfileResponse: UserProfile = {
        ...profileData,
        uid: profileData.id,
        avatar: profileData.avatar_url,
        displayName: profileData.display_name,
        createdAt: profileData.created_at || new Date().toISOString(),
        rank: userRankData.data ?? 'Unranked',
        score: profileData.user_score ?? 0,
        totalPlaytime: formatPlaytime(profileData.total_playtime_seconds),
        gamesPlayed: profileData.total_games_played ?? 0,
        ratingsSubmitted: profileData.total_ratings_submitted ?? 0,
        recentlyPlayed: recentlyPlayedGames,
        recentlyRated: recentlyRatedGames,
    };
    
    return userProfileResponse;
}

