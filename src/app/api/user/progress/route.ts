// app/api/user/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase/firebaseAdmin';
import { verifyUser, handleApiError } from '@/lib/firebase/adminAuthHelper';
import { FieldValue } from 'firebase-admin/firestore';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// The GET handler is not used by the player but is left for completeness.
// Note: It would also need token verification to be secure.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400, headers: corsHeaders });
  }

  try {
    // This part is insecure and should be updated to use token verification
    // For now, we focus on the POST request fix.
    // const continueWatching = await getContinueWatchingList(userId);
    // return NextResponse.json(continueWatching, { status: 200, headers: corsHeaders });
    return NextResponse.json({ error: 'GET method not fully implemented securely.' }, { status: 501, headers: corsHeaders });
  } catch (error) {
    console.error('Failed to get continue watching list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

/**
 * POST handler to update a user's watch progress for a specific media item.
 * This is now secure and uses the Admin SDK.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the user's ID token from the Authorization header.
    const verifiedUid = await verifyUser(request);

    // 2. Safely parse the request body.
    const body = await request.json();
    const { userId, ...progressData } = body;
    
    // 3. Ensure the user from the token is the one whose progress is being updated.
    if (verifiedUid !== userId) {
        console.warn(`Forbidden attempt: User ${verifiedUid} tried to write to user ${userId}'s data.`);
        return handleApiError(new Error('FORBIDDEN: You can only update your own progress.'));
    }

    // 4. Validate the payload.
    if (!userId || !progressData.mediaId || !progressData.mediaType || !progressData.title) {
        return handleApiError(new Error('BAD_REQUEST: Missing required fields in request body.'));
    }

    // 5. Perform the write operation using the Firebase Admin SDK to bypass security rules.
    const admin = await initAdmin();
    const db = admin.firestore();

    const progressRef = db.collection('users').doc(userId).collection('mediaWatchHistory').doc(String(progressData.mediaId));
  
    const dataToSet = {
      ...progressData,
      lastWatched: FieldValue.serverTimestamp(), // Use the admin server timestamp
    };

    await progressRef.set(dataToSet, { merge: true });
    
    return NextResponse.json({ success: true, message: 'Progress updated successfully' }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Failed to update media progress:', error);
    // The handleApiError function will return the correct HTTP status code.
    return handleApiError(error);
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
