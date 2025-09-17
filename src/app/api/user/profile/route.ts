// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { updateUserAvatar } from '@/lib/supabase/db';

export async function POST(request: NextRequest) {
  const { userId, avatarUrl } = await request.json();

  if (!userId || !avatarUrl) {
    return NextResponse.json({ error: 'User ID and avatar URL are required.' }, { status: 400 });
  }

  const { error } = await updateUserAvatar(userId, avatarUrl);

  if (error) {
    return NextResponse.json({ error: 'Failed to update avatar.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}