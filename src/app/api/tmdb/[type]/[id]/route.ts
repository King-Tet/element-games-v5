// app/api/tmdb/[type]/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const API_URL = 'https://api.themoviedb.org/3';

// This route gets details for a specific movie or TV show.
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const { type, id } = params;


  // Common headers for the response
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key is not configured' }, { status: 500, headers });
  }

  if (!type || (type !== 'movie' && type !== 'tv')) {
    return NextResponse.json({ error: "Invalid type parameter. Use 'movie' or 'tv'." }, { status: 400, headers });
  }

  if (!id) {
    return NextResponse.json({ error: 'ID parameter is required' }, { status: 400, headers });
  }

  const url = `${API_URL}/${type}/${id}?language=en-US`;

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
      return NextResponse.json({ error: 'Failed to fetch data from TMDB' }, { status: res.status, headers });
    }

    const data = await res.json();
    // Return the data with the CORS headers
    return NextResponse.json(data, { status: 200, headers });

  } catch (error) {
    console.error('Network or other error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500, headers });
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}