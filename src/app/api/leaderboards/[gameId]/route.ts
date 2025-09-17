// src/app/api/leaderboards/[gameId]/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { GameLeaderboardEntry } from '@/types/leaderboard';
import { get } from 'lodash';

export async function GET(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  const { gameId } = params;
  const { searchParams } = new URL(request.url);
  const levelId = searchParams.get('level');

  if (!levelId) {
    return NextResponse.json({ error: 'A leaderboard level ID must be specified via the "level" query parameter.' }, { status: 400 });
  }

  // Fetch game config from Supabase instead of a local JSON file
  const { data: game, error: gameError } = await supabaseAdmin
    .from('games')
    .select('leaderboard_configs')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    console.error(`Error fetching game config for ${gameId}:`, gameError);
    return NextResponse.json({ error: 'Game not found or failed to fetch config.' }, { status: 404 });
  }

  const config = game.leaderboard_configs?.find((c: unknown) => c.id === levelId);

  if (!config) {
      return NextResponse.json({ error: `Leaderboard level "${levelId}" not found for this game.` }, { status: 404 });
  }

  try {
    const { data: allSaves, error: savesError } = await supabaseAdmin
      .from('game_saves')
      .select(`
        save_data,
        saved_at,
        profiles (id, username, display_name, avatar_url)
      `)
      .eq('game_id', gameId)
      .not('profiles', 'is', null);

    if (savesError) throw savesError;
    
    const scoredEntries: Omit<GameLeaderboardEntry, 'rank'>[] = [];
    
    for (const save of allSaves) {
      if (!save.save_data || !save.profiles) continue;

      let score: number | null = null;
      try {
        let saveDataJSON = save.save_data;
        if (typeof saveDataJSON === 'string') saveDataJSON = JSON.parse(saveDataJSON);

        const localStorageValue = saveDataJSON[config.localStorageKey];
        if (localStorageValue === null || localStorageValue === undefined) continue;
        
        let parsedValue = (typeof localStorageValue === 'string') ? JSON.parse(localStorageValue) : localStorageValue;

        if (Array.isArray(parsedValue) && parsedValue.length > 0) {
            parsedValue = parsedValue[0];
        }
        
        let extractedValue: unknown = null;
        if (config.scoreType === 'number') {
          extractedValue = Number(parsedValue);
        } else if (config.scoreType === 'jsonPath' && config.scorePath) {
          // First, try standard object path access
          extractedValue = get(parsedValue, config.scorePath, null);

          // FALLBACK for array of pairs format (like Doodle Jump)
          if (extractedValue === null && parsedValue.stats && Array.isArray(parsedValue.stats)) {
              const statsArray: [string, unknown][] = parsedValue.stats;
              const statEntry = statsArray.find(stat => Array.isArray(stat) && stat[0] === config.scorePath);
              if (statEntry && statEntry.length > 1) {
                  extractedValue = statEntry[1];
              }
          }
        }
        
        if (extractedValue !== null) {
            score = Number(extractedValue);
        }

        if (score !== null && !isNaN(score)) {
            const unit = config.unit || 'number';
            if (unit === 'seconds') score *= 1000;
            else if (unit === 'minutes') score *= 60000;
            if (config.scoreMultiplier) score *= config.scoreMultiplier;
        }

      } catch (e) {
        console.warn(`Could not parse score for user ${save.profiles.id} in game ${gameId}. Error: ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }

      if (score !== null && !isNaN(score)) {
        scoredEntries.push({
          userId: save.profiles.id,
          username: save.profiles.username,
          displayName: save.profiles.display_name,
          avatarUrl: save.profiles.avatar_url,
          score: Math.floor(score),
          lastPlayed: save.saved_at,
        });
      }
    }

    const sortedEntries = scoredEntries.sort((a, b) => {
      return config.sortOrder === 'high-to-low' ? b.score - a.score : a.score - b.score;
    });

    const rankedLeaderboard: GameLeaderboardEntry[] = sortedEntries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return NextResponse.json(rankedLeaderboard.slice(0, 100));

  } catch (error: unknown) {
    console.error(`API Error for game leaderboard ${gameId}:`, error);
    return NextResponse.json({ error: 'Failed to load leaderboard data.', details: error.message }, { status: 500 });
  }
}

