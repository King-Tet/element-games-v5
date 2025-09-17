// src/data/mockLeaderboardUsers.ts
import { UserProfileData } from '@/types/user'; // Adjust path if needed

// Add more users with varying stats
export const mockUsersData: Omit<UserProfileData, 'userScore'>[] = [
    {
        uid: "user001",
        username: "GamerPro",
        displayName: "Pro Gamer",
        photoURL: "/logos/defualt-avatar.png", // Placeholder avatar
        totalPlaytimeSeconds: 1450 * 3600, // 1450 hours
        totalRatingsSubmitted: 150,
        totalGamesPlayed: 35,
    },
    {
        uid: "user002",
        username: "TimeMaster",
        displayName: "Master Of Time",
        photoURL: "/logos/defualt-avatar.png",
        totalPlaytimeSeconds: 1320 * 3600, // 1320 hours
        totalRatingsSubmitted: 80,
        totalGamesPlayed: 38,
    },
    {
        uid: "user003",
        username: "RatingChamp",
        displayName: "Champ",
        photoURL: "/logos/defualt-avatar.png",
        totalPlaytimeSeconds: 500 * 3600, // 500 hours
        totalRatingsSubmitted: 250, // High rating count
        totalGamesPlayed: 25,
    },
    {
        uid: "user004",
        username: "EndlessPlay",
        displayName: "Endless",
        photoURL: "/logos/defualt-avatar.png",
        totalPlaytimeSeconds: 1105 * 3600, // 1105 hours
        totalRatingsSubmitted: 95,
        totalGamesPlayed: 40, // Played many games
    },
     {
        uid: "user005",
        username: "CasualChris",
        displayName: "Chris P.",
        photoURL: "/logos/defualt-avatar.png",
        totalPlaytimeSeconds: 980 * 3600, // 980 hours
        totalRatingsSubmitted: 30,
        totalGamesPlayed: 28,
    },
     {
        uid: "user006",
        username: "NewbieNick",
        displayName: "Nick N.",
        photoURL: "/logos/defualt-avatar.png",
        totalPlaytimeSeconds: 50 * 3600, // 50 hours
        totalRatingsSubmitted: 5,
        totalGamesPlayed: 10,
    },
     {
        uid: "user007",
        username: "CriticKate",
        displayName: "Kate Review",
        photoURL: "/logos/defualt-avatar.png",
        totalPlaytimeSeconds: 200 * 3600, // 200 hours
        totalRatingsSubmitted: 180, // Lots of ratings
        totalGamesPlayed: 30,
    },
     {
        uid: "user008",
        username: "VarietyVera",
        displayName: "Vera V.",
        photoURL: "/logos/defualt-avatar.png",
        totalPlaytimeSeconds: 150 * 3600, // 150 hours
        totalRatingsSubmitted: 40,
        totalGamesPlayed: 45, // Played most games
    },
    // Add more users (at least 10-12 for testing)
];