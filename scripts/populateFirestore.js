// scripts/populateFirestore.js
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Adjust path if needed
const gamesData = require('../src/data/games.json'); // Adjust path if needed

// Initialize Firebase Admin SDK
try {
    if (!admin.apps.length) { // Prevent re-initialization error
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
} catch (error) {
    console.error("Firebase Admin initialization failed:", error.message);
    // If already initialized, it might throw. Check for specific error code if needed.
    if (error.code !== 'app/duplicate-app') {
        process.exit(1); // Exit if it's a different critical error
    }
}


const db = admin.firestore();
const gamesCollection = db.collection('games');

async function syncGamesToFirestore() {
  console.log(`Syncing ${gamesData.length} games from games.json to Firestore...`);

  // Use a Set for efficient ID lookup from the JSON file
  const jsonGameIds = new Set(gamesData.map(game => game.id));

  // Get all existing game IDs from Firestore (optional but good for finding deleted ones)
  let firestoreGameIds = new Set();
  try {
      const snapshot = await gamesCollection.select().get(); // select() fetches only document IDs
      snapshot.forEach(doc => firestoreGameIds.add(doc.id));
      console.log(`Found ${firestoreGameIds.size} existing game documents in Firestore.`);
  } catch(error) {
       console.error("Error fetching existing game IDs from Firestore:", error);
       // Decide if you want to continue without this check
  }


  // --- Process Updates/Creations ---
  const batch = db.batch();
  let updatedCount = 0;
  let createdCount = 0;

  gamesData.forEach(gameFromJson => {
    if (!gameFromJson.id) {
        console.warn("Skipping game entry with missing ID:", gameFromJson.name || '[No Name]');
        return; // Skip games without an ID
    }

    const gameRef = gamesCollection.doc(gameFromJson.id);

    // Prepare the payload: Contains ONLY the data from games.json
    // DO NOT include totalVisits, averageRating, ratingCount here!
    // Spread operator works well as these fields aren't in the JSON structure.
    const updatePayload = {
      ...gameFromJson
      // Ensure no dynamic fields accidentally sneak in if your source structure changes
      // delete updatePayload.totalVisits; // Example defensive deletion
      // delete updatePayload.averageRating;
      // delete updatePayload.ratingCount;
    };

    // Use set with merge: true
    // - If doc exists: Updates fields present in updatePayload, leaves others untouched.
    // - If doc doesn't exist: Creates the doc with fields from updatePayload.
    //   (Dynamic fields will be missing initially, added later by app logic)
    batch.set(gameRef, updatePayload, { merge: true });

    // Keep track of counts (optional)
    if (firestoreGameIds.has(gameFromJson.id)) {
        updatedCount++;
    } else {
        createdCount++;
    }
  });

  // --- (Optional) Process Deletions ---
  // Find games in Firestore that are *not* in games.json anymore
  firestoreGameIds.forEach(firestoreId => {
      if (!jsonGameIds.has(firestoreId)) {
          console.warn(`Game ID "${firestoreId}" exists in Firestore but not in games.json. Deleting...`);
          const gameToDeleteRef = gamesCollection.doc(firestoreId);
          batch.delete(gameToDeleteRef);
          // Note: Deleting associated user data (saves, ratings) is complex
          // and usually requires a Cloud Function or separate cleanup script.
      }
  });


  // --- Commit the Batch ---
  try {
    await batch.commit();
    console.log('Firestore sync completed.');
    console.log(`- ${createdCount} games created.`);
    console.log(`- ${updatedCount} games updated.`);
    const deletedCount = firestoreGameIds.size - updatedCount; // Calculate deleted
    if (deletedCount > 0) {
        console.log(`- ${deletedCount} games removed (were in Firestore but not JSON).`);
    }

  } catch (error) {
    console.error('Error committing batch to Firestore:', error);
  }
}

syncGamesToFirestore();