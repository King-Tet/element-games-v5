// app/api/tmdb/search/route.ts
import { NextResponse } from 'next/server';

interface TmdbSearchResult {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  // Add other properties as needed, but media_type is sufficient for the filter.
}

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const API_URL = 'https://api.themoviedb.org/3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key is not configured' }, { status: 500, headers: corsHeaders });
  }

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400, headers: corsHeaders });
  }

  const url = `${API_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;

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
    const filteredResults = data.results.filter((item: TmdbSearchResult) => item.media_type !== 'person');

    return NextResponse.json({ ...data, results: filteredResults }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Network or other error:', error);
    return NextResponse.json({ error: 'An internal server error occurred', details: (error as Error).message }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
