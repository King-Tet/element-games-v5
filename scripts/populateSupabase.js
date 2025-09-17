require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const gamesData = require('../src/data/games.json');

// --- Configuration ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Service Role Key is missing.");
  console.error("Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file.");
  process.exit(1);
}

// Initialize Supabase client with the service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

// Filter out the instructional object from the JSON data
const gamesToSync = gamesData.filter(game => game.id);

// --- Main Sync Function ---
async function syncGamesToSupabase() {
  console.log(`Syncing ${gamesToSync.length} games from games.json to Supabase...`);

  // 1. Fetch all existing games from the Supabase 'games' table
  const { data: existingGames, error: fetchError } = await supabase
    .from('games')
    .select('id');

  if (fetchError) {
    console.error("Error fetching existing games from Supabase:", fetchError.message);
    return;
  }

  const existingGameIds = new Set(existingGames.map(game => game.id));
  const jsonGameIds = new Set(gamesToSync.map(game => game.id));
  console.log(`Found ${existingGameIds.size} existing game documents in Supabase.`);

  // 2. Prepare data for upsert (create or update)
  // This maps the camelCase keys from your JSON to the snake_case columns in your database
  const gamesToUpsert = gamesToSync.map(game => ({
    id: game.id,
    name: game.name,
    description: game.description,
    image_url: game.imageUrl,
    category: game.category,
    source_url: game.sourceUrl,
    tags: game.tags,
    local_storage_keys: game.localStorageKeys,
    leaderboard_configs: game.leaderboardConfigs, // CORRECTED THIS LINE
    indexed_db_config: game.indexedDbConfig,
    release_date: game.releaseDate ? new Date(game.releaseDate).toISOString() : null,
  }));

  if (gamesToUpsert.length > 0) {
      const { error: upsertError } = await supabase.from('games').upsert(gamesToUpsert, { onConflict: 'id' });

      if (upsertError) {
          console.error('Error upserting games:', upsertError.message);
      } else {
          const createdCount = gamesToUpsert.filter(g => !existingGameIds.has(g.id)).length;
          const updatedCount = gamesToUpsert.length - createdCount;
          console.log(`- ${createdCount} games created.`);
          console.log(`- ${updatedCount} games updated.`);
      }
  }


  // 3. Determine which games to delete
  const gamesToDelete = [...existingGameIds].filter(id => !jsonGameIds.has(id));

  if (gamesToDelete.length > 0) {
    console.warn(`Found ${gamesToDelete.length} games to delete...`);
    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .in('id', gamesToDelete);

    if (deleteError) {
      console.error('Error deleting games:', deleteError.message);
    } else {
      console.log(`- ${gamesToDelete.length} games removed successfully.`);
    }
  }

  console.log('Supabase sync completed.');
}

// --- Run the Sync ---
syncGamesToSupabase();
