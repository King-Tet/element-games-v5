// src/app/api/users/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { UserProfileData, UserProfile, ActivityGame } from '@/types/user';
import { formatPlaytime } from '@/utils/calculations';

// Helper functions (getProfileByUsername, etc.) remain the same...
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

async function getRecentlyPlayed(userId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('recently_played')
        .select('*, games(*)')
        .eq('user_id', userId)
        .order('last_played', { ascending: false })
        .limit(4);
    return error ? [] : data || [];
}

async function getRecentlyRated(userId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('game_ratings')
        .select('*, games(*)')
        .eq('user_id', userId)
        .order('rated_at', { ascending: false })
        .limit(4);
    return error ? [] : data || [];
}


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    const profileData = await getProfileByUsername(username);

    if (!profileData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [recentlyPlayed, recentlyRated, userRankData] = await Promise.all([
        getRecentlyPlayed(profileData.id),
        getRecentlyRated(profileData.id),
        supabase.rpc("get_user_rank", { p_user_id: profileData.id })
    ]);

    // Explicitly map game data to the structure the frontend expects
    const recentlyPlayedGames: ActivityGame[] = recentlyPlayed
        .filter(p => p.games) // Ensure game data exists
        .map(p => ({
            id: p.games.id,
            title: p.games.name,
            bannerUrl: p.games.image_url,
            lastPlayed: p.last_played,
        }));

    const recentlyRatedGames: ActivityGame[] = recentlyRated
        .filter(r => r.games) // Ensure game data exists
        .map(r => ({
            id: r.games.id,
            title: r.games.name,
            bannerUrl: r.games.image_url,
            rating: r.rating,
        }));

    // Construct the final, consistent user profile object
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

    return NextResponse.json(userProfileResponse, {
        headers: {
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}