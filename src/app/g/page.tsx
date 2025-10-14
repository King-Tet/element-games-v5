// src/app/g/page.tsx
import React, { Suspense } from 'react';
import styles from './GamesPage.module.css';
import GamesPageClient from './GamesPageClient';
import { getAllGames } from '@/lib/supabase/db'; 

const Loading = () => {
    return <div className={styles.loadingMessage}>Loading games page...</div>;
}

// This is now a Server Component that fetches the initial game data
export default async function GamesPage() {
  const allGames = await getAllGames();

  return (
    <Suspense fallback={<Loading />}>
      {/* Pass the server-fetched data down to the client component as a prop */}
      <GamesPageClient initialGames={allGames} />
    </Suspense>
  );
};