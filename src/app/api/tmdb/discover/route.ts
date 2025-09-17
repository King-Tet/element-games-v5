// app/api/tmdb/discover/route.ts
import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const API_URL = 'https://api.themoviedb.org/3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key is not configured' }, { status: 500, headers: corsHeaders });
  }

  if (!type || (type !== 'movie' && type !== 'tv')) {
    return NextResponse.json({ error: "Invalid type parameter. Use 'movie' or 'tv'." }, { status: 400, headers: corsHeaders });
  }

  const url = `${API_URL}/discover/${type}?include_adult=false&language=en-US&page=1&sort_by=popularity.desc`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('TMDB API Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch data from TMDB' }, { status: res.status, headers: corsHeaders });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Network or other error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
