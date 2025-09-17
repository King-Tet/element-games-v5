// src/app/api/admin/users/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
        return NextResponse.json({ error: 'Search query must be at least 2 characters.' }, { status: 400 });
    }

    try {
        // The original RPC call that was causing the permission error has been replaced.
        // const { data, error } = await supabaseAdmin.rpc('search_users', {
        //     search_term: query
        // });

        // New implementation: Directly and securely query the 'profiles' table.
        // This searches for the query text in both 'username' and 'display_name' fields.
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, username, display_name') // Selects the necessary fields for the search results.
            .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`) // Performs a case-insensitive search.
            .limit(20); // Limits the number of results for performance.

        if (error) {
            console.error('Supabase RPC error in search_users:', error);
            // Provide a more specific error message to the client
            return NextResponse.json({ error: 'Database search failed.', details: error.message }, { status: 500 });
        }

        // The front-end expects an object with a 'users' property.
        return NextResponse.json({ users: data });

    } catch (error: any) {
        console.error('API Error searching users:', error);
        return NextResponse.json({ error: 'An unexpected server error occurred.', details: error.message }, { status: 500 });
    }
}