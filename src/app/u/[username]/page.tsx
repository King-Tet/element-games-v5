// src/app/u/[username]/page.tsx
import { notFound } from 'next/navigation';
import { UserProfile } from '@/types/user';
import styles from './ProfilePage.module.css';
import UserInfo from '@/components/Profile/UserInfo';
import UserStats from '@/components/Profile/UserStats';
import ActivityFeed from '@/components/Profile/ActivityFeed';

interface ProfilePageProps {
  params: {
    username: string;
  };
}

// Function to fetch user data from the API
async function getUserProfile(username: string): Promise<UserProfile | null> {
  try {
    // We construct the absolute URL for fetching on the server-side
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/users/${username}`, {
        cache: 'no-store', // Don't cache user profile data
    });

    if (!res.ok) {
      // Log the specific error from the API for easier debugging
      const errorBody = await res.text();
      console.error(`API Error: Failed to fetch user data for ${username}. Status: ${res.status}. Body: ${errorBody}`);
      // Return null to allow the page to render a 'not found' state
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Fetch Error: An error occurred while calling the user profile API:", error);
    return null;
  }
}

// The main component for the user profile page
export default async function ProfilePage({ params }: ProfilePageProps) {
  // Await params directly before destructuring username
  const { username } = await params;
  const userProfile = await getUserProfile(username);

  // If the user profile couldn't be fetched, show the 404 page.
  if (!userProfile) {
    notFound();
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <UserInfo user={userProfile} />
      </div>
      <div className={styles.profileBody}>
        <UserStats stats={userProfile} />
        <ActivityFeed activity={userProfile} />
      </div>
    </div>
  );
}