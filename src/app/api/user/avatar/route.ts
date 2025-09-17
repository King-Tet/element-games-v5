// src/app/api/user/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { avatarUrl } = await request.json();
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  // Create a temporary Supabase client to verify the user's token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Get the authenticated user from the token. This is the secure part.
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated. Invalid token.' }, { status: 401 });
  }

  if (!avatarUrl) {
    return NextResponse.json({ error: 'Avatar URL is required.' }, { status: 400 });
  }

  // 2. Use the admin client to bypass RLS and update the profile.
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (updateError) {
    console.error('Supabase admin error updating avatar:', updateError);
    return NextResponse.json({ error: 'Failed to update avatar in database.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Avatar updated successfully.' });
}