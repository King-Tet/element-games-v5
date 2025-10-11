// src/app/u/[username]/page.tsx
import { notFound } from 'next/navigation';
import styles from './ProfilePage.module.css';
import UserInfo from '@/components/Profile/UserInfo';
import UserStats from '@/components/Profile/UserStats';
import ActivityFeed from '@/components/Profile/ActivityFeed';
// Import the new server action directly instead of using fetch
import { getProfileForPage } from '@/lib/user-actions';

// Revalidate this page every 60 seconds.
export const revalidate = 60;

// The main component for the user profile page
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params; // Await the params promise
  
  // Call the server function directly - this is more efficient and avoids the fetch error.
  const userProfile = await getProfileForPage(username);

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

