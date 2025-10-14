// src/app/t/page.tsx
import React, { Suspense } from 'react';
import styles from './ToolsPage.module.css';
import ToolsPageClient from './ToolsPageClient'; // Import the new client component

// A simple loading fallback
const Loading = () => {
    return <div className={styles.loadingMessage}>Loading tools...</div>;
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ToolsPageClient />
    </Suspense>
  );
};