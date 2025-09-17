// src/app/api/admin/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// This function handles fetching detailed data for a specific user by their ID.
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    try {
        // NOTE: Add admin verification here in a real application.

        // Fetch all user data in parallel for efficiency
        const [profileRes, savesRes, ratingsRes, recentRes] = await Promise.all([
            supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
            supabaseAdmin.from('game_saves').select('*').eq('user_id', userId),
            supabaseAdmin.from('game_ratings').select('*, games(id, name, image_url)').eq('user_id', userId),
            supabaseAdmin.from('recently_played').select('*, games(id, name, image_url)').eq('user_id', userId)
        ]);
        
        // Error handling for each query
        if (profileRes.error) throw new Error(`Profile fetch failed: ${profileRes.error.message}`);
        if (savesRes.error) throw new Error(`Saves fetch failed: ${savesRes.error.message}`);
        if (ratingsRes.error) throw new Error(`Ratings fetch failed: ${ratingsRes.error.message}`);
        if (recentRes.error) throw new Error(`Recent plays fetch failed: ${recentRes.error.message}`);

        // Combine the data into a single response object
        const responseData = {
            profile: profileRes.data,
            gameSaves: savesRes.data,
            gameRatings: ratingsRes.data,
            recentlyPlayed: recentRes.data,
        };

        return NextResponse.json(responseData);

    } catch (error: unknown) {
        console.error(`API Error fetching details for user ${userId}:`, error);
        return NextResponse.json({ error: 'Failed to fetch user details', details: error.message }, { status: 500 });
    }
}