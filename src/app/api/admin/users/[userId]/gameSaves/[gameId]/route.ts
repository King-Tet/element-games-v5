// src/app/api/admin/users/[userId]/gameSaves/[gameId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// NOTE: A robust application should have proper admin verification middleware for all admin routes.
// This endpoint currently follows the existing security pattern of the project.

/**
 * Handles PUT requests to update a specific game save for a user.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string; gameId: string }> }
) {
    const { userId, gameId } = await params;

    if (!userId || !gameId) {
        return NextResponse.json({ error: 'User ID and Game ID are required.' }, { status: 400 });
    }

    try {
        const body = await request.json();
        // The request body should contain the save data as a string.
        const newSaveDataString = body.saveData;

        if (typeof newSaveDataString !== 'string') {
            return NextResponse.json({ error: 'The "saveData" field must be a string in the request body.' }, { status: 400 });
        }

        // Validate that the provided string is valid JSON before saving.
        let parsedSaveData;
        try {
            parsedSaveData = JSON.parse(newSaveDataString);
        } catch {
            return NextResponse.json({ error: 'Provided saveData is not valid JSON.' }, { status: 400 });
        }

        // Use supabaseAdmin to upsert (update or create) the game save.
        const { error } = await supabaseAdmin
            .from('game_saves')
            .upsert({
                user_id: userId,
                game_id: gameId,
                save_data: parsedSaveData,
                saved_at: new Date().toISOString(),
                // NOTE: To track which admin made the change, you would need to implement
                // a way to get the admin's UID from the request.
                // last_edited_by_admin: adminUid 
            });

        if (error) {
            console.error('Supabase error updating game save:', error);
            return NextResponse.json({ error: 'Failed to update game save.', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Game save updated successfully.' });

    } catch (error: unknown) {
        console.error(`API Error updating save for user ${userId}, game ${gameId}:`, error);
        return NextResponse.json({ error: 'An unexpected server error occurred.', details: (error as Error).message }, { status: 500 });
    }
}