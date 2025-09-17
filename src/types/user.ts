// src/types/user.ts
import { Game } from './game';

// This interface defines the shape of user data from the 'profiles' table.
export interface UserProfileData {
    id: string;
    uid?: string;
    username: string;
    display_name?: string | null;
    avatar_url?: string | null;
    created_at?: string;
    total_playtime_seconds?: number;
    total_games_played?: number;
    total_ratings_submitted?: number;
    user_score?: number;
}

// A specific type for the game object within the activity feed
export interface ActivityGame {
    id: string;
    title: string;
    bannerUrl: string;
    rating?: number;
    lastPlayed?: string;
}

// This is the comprehensive type for the profile page.
export interface UserProfile extends UserProfileData {
    avatar?: string | null;
    displayName?: string | null;
    createdAt: string;
    rank: number | 'Unranked';
    score: number;
    totalPlaytime: string;
    gamesPlayed: number;
    ratingsSubmitted: number;
    recentlyPlayed: ActivityGame[];
    recentlyRated: ActivityGame[];
}