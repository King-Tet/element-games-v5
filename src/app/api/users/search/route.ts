// src/app/api/users/search/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is a server-side route, so we use environment variables directly.
// The anon key is safe here because your Row Level Security (RLS) policies
// on the 'profiles' table allow public read access.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Fetch all profiles that have a username set.
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, display_name, username') // Select only the necessary columns
      .not('username', 'is', null);      // Ensure we only get users who have completed their profile

    if (error) {
      // If Supabase returns an error, throw it to be caught by the catch block.
      throw error;
    }

    // The frontend Navbar expects a 'uid' and 'displayName'.
    // Let's map the Supabase columns (id, display_name) to what the frontend needs.
    const searchResults = users.map(user => ({
        uid: user.id,
        displayName: user.display_name,
        username: user.username,
    }));

    return NextResponse.json(searchResults, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching users for search:', error);
    return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
    );
  }
}