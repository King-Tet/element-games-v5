// src/app/g/page.tsx
import React, { Suspense } from 'react';
import styles from './GamesPage.module.css';
import GamesPageClient from './GamesPageClient'; // Import the new client component

// A simple loading fallback component
const Loading = () => {
    return <div className={styles.loadingMessage}>Loading games page...</div>;
}

export default function GamesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <GamesPageClient />
    </Suspense>
  );
};