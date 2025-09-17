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

export interface ActivityGame {
    id: string;
    title: string;
    bannerUrl: string;
    rating?: number;
    lastPlayed?: string;
}

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