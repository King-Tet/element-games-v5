// sw.js - Service Worker for Mocking API Responses

// The base URL of the backend API we want to intercept requests for.
const MOCK_BACKEND_URL =
  "https://us-central1-justbuild-cdb86.cloudfunctions.net";

// --- WHITELIST: Add any URL paths you want to mock here ---
// The service worker will only intercept and mock requests whose paths
// start with one of the strings in this array.
const endpointsToMock = [
  "/userSettings/group", // Provides the main inventory and currency data
  "/player/rvSkinLastTime",
  "/product/coinPurchase",
  "/player/login", // We can mock this to avoid an error
];

// --- MOCK DATA: The fake data we want to send back ---
// This object contains the mock response for the "/userSettings/group" endpoint.
const mockUserSettings = {
  inventory: {
    skins: [
      "lol.1v1.playerskins.pack.quick.golden",
      "lol.1v1.playerskins.pack.quick.cyber",
      "lol.1v1.playerskins.pack.3",
      "lol.1v1.playerskins.pack.6",
      "lol.1v1.playerskins.pack.9",
      "lol.1v1.playerskins.pack.12",
      "lol.1v1.playerskins.pack.26",
      "lol.1v1.playerskins.pack.28",
      "lol.1v1.playerskins.pack.40",
      "lol.1v1.playerskins.pack.41",
      "lol.1v1.playerskins.pack.42",
      "lol.1v1.playerskins.pack.46",
      "lol.1v1.playerskins.pack.53",
      "lol.1v1.playerskins.pack.65",
      "lol.1v1.playerskins.pack.66",
      "lol.1v1.playerskins.pack.67",
      "lol.1v1.playerskins.pack.68",
      "lol.1v1.playerskins.pack.69",
    ],
    emotes: [
      "lol.1v1.playeremotes.pack.1",
      "lol.1v1.playeremotes.pack.4",
      "lol.1v1.playeremotes.pack.13",
      "lol.1v1.playeremotes.pack.17",
      "lol.1v1.playeremotes.pack.22",
    ],
  },
  currencies: {
    LC: 888888, // Regular Coins
    LT: 8888, // Gems
  },
};

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const uid = `${getRandomInt(1000)}`;

const mockLogin = {
  ID: `slave-${uid}`,
  Nickname: `slave-${uid}`,
  Country: "",
  Region: "",
  IsMigrated: true,
  BoxRating: 0,
  DuosRating: 0,
  Elo: 10000,
  OpenskillModel: {
    RatingData: {
      mu: 25,
      sigma: 8.333333333333334,
    },
    Ranking: null,
  },
  SoftCurrency: 30,
  CustomRating: 40,
  HardCurrency: `${getRandomInt(10000)}`,
  LoLTokens: 200,
  CreatedAt: "2025-07-23T01:42:15.724Z",
  Logins: {
    LastLoginTime: 1753234935724,
    CurrentLoginTime: 1753234935724,
    TotalLogins: 2893,
    DailyConsecutiveLogins: 237,
  },
  Stats: {
    TotalGamesPlayed: 466,
    TotalKills: `${getRandomInt(69001)}`,
    TotalDeaths: 6,
    Victories: {},
    Defeats: {},
    Ties: {},
    ConsecutiveWins: 42,
  },
  PrivacySettings: {
    HasSeenTailoredAdsPopup: false,
    HasAcceptedTailoredAds: false,
  },
  Premium: {
    AdsDisabled: true,
    LTV: 1,
  },
  NonconsumablePacks: [],
  XP: 60000000,
  BoxReset: false,
  RVData: {
    Watched: 3,
    CurrentSkin: "lol.1v1.playerskins.pack.12",
    LastRvSkinTime: "1970-01-01T00:00:00.000Z",
  },
  MatchHistory: {
    MatchSampleTimestamp: 0,
    MatchesSinceSample: 0,
    Exceeds: 0,
  },
  FriendInviteLink: {},
  Skins: {
    EquippedChampionSkins: {},
    CharacterSkins: [
      "lol.1v1.playerskins.pack.12",
    ],
    EquippedCharacterSkin: `lol.1v1.playerskins.pack.12`,
    OwnedEmotes: [
      "lol.1v1.playeremotes.pack.1",
      "lol.1v1.playeremotes.pack.2",
      "lol.1v1.playeremotes.pack.3",
      "lol.1v1.playeremotes.pack.4",
      "lol.1v1.playeremotes.pack.5",
      "lol.1v1.playeremotes.pack.6",
      "lol.1v1.playeremotes.pack.7",
      "lol.1v1.playeremotes.pack.8",
    ],
    EquippedEmotes: [
      "lol.1v1.playeremotes.pack.1",
      "lol.1v1.playeremotes.pack.2",
      "lol.1v1.playeremotes.pack.3",
      "lol.1v1.playeremotes.pack.4",
      "lol.1v1.playeremotes.pack.5",
      "lol.1v1.playeremotes.pack.6",
      "lol.1v1.playeremotes.pack.7",
      "lol.1v1.playeremotes.pack.8",
    ],
    CompensationVersion: 1,
  },
  
};

/**
 * Installation event listener.
 * self.skipWaiting() forces the waiting service worker to become the
 * active service worker.
 */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

/**
 * Activation event listener.
 * self.clients.claim() allows an active service worker to take control of
 * all clients (open tabs/windows) that are in its scope.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Fetch event listener.
 * This is where we intercept network requests.
 */
self.addEventListener("fetch", function (event) {
  const requestUrl = new URL(event.request.url);

  // We only care about requests going to our target backend.
  // If the request is for a different domain, we ignore it and let the
  // browser handle it normally.
  if (requestUrl.hostname === new URL(MOCK_BACKEND_URL).hostname) {
    // Check if the request's path is in our whitelist of endpoints to mock.
    const shouldMock = endpointsToMock.some((endpoint) =>
      requestUrl.pathname.startsWith(endpoint)
    );

    if (shouldMock) {
      console.log(
        `%c[Service Worker] INTERCEPTED: ${requestUrl.pathname}`,
        "color: #00dd00; font-weight: bold;"
      );

      let responseBody = {};

      // Determine which mock data to use based on the path.
      if (requestUrl.pathname.startsWith("/userSettings/group")) {
        responseBody = mockUserSettings;
      } else if (requestUrl.pathname.startsWith("/player/rvSkinLastTime")) {
        responseBody = { lastTime: "dogshit"};
      } else if (requestUrl.pathname.startsWith("/player/login")) {
        responseBody = mockLogin;
      } else if (requestUrl.pathname.startsWith("/product/coinPurchase")) {
        responseBody = {};
      }
      // Create a new Response object with our mock data.
      const mockResponse = new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

      // Fulfill the fetch event with our mock response.
      event.respondWith(mockResponse);
    } else {
      // If the request is to our backend but NOT in our mock list,
      // we must explicitly pass it through to the network.
      console.log(
        `%c[Service Worker] PASSING THROUGH: ${requestUrl.pathname}`,
        "color: #ffaa00;"
      );

      // *** FIX: Explicitly fetch the original request from the network ***
      // Without this, the request would hang and fail.
      event.respondWith(fetch(event.request));
    }
  }
});
