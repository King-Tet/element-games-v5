// app/api/tmdb/[type]/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// This route gets details for a specific movie or TV show.
export async function GET(
  request: NextRequest,
  context: any
) {
  const { type, id } = context.params;
  return NextResponse.json({ type, id });
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