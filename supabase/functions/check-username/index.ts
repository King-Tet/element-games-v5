// supabase/functions/check-username/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();

    if (!username) {
        throw new Error("Username not provided in request body.");
    }

    // Create a Supabase admin client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Check if a profile with the given username already exists
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('username', username)
      .limit(1)
      .maybeSingle(); // Use maybeSingle() to return null instead of erroring if no row is found

    if (error) {
      throw error;
    }

    // Return whether the username is available
    return new Response(
      JSON.stringify({ available: !data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// You may also need a shared CORS file if you don't have one:
// Create supabase/functions/_shared/cors.ts
/*
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
*/