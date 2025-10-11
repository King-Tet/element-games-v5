// src/app/api/users/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
// Import the new shared function instead of having the logic here
import { getProfileForPage } from '@/lib/user-actions';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    // Call the shared function to get the profile data
    const userProfileResponse = await getProfileForPage(username);

    if (!userProfileResponse) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the data, keeping the API route functional for any external use
    return NextResponse.json(userProfileResponse, {
        headers: {
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}

