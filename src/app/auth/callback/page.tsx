// src/app/auth/callback/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CallbackPage.module.css';

const AuthCallbackPage: React.FC = () => {
  const router = useRouter();

  // The Supabase client listener in AuthContext handles the session.
  // This page just needs to redirect the user after the auth event is processed.
  useEffect(() => {
    // Redirect to the homepage after a short delay to ensure the session is set.
    const timer = setTimeout(() => {
      router.replace('/');
    }, 500); // A small delay can help ensure the auth state is updated.

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.loader}></div>
      <p>Authentication successful. Redirecting...</p>
    </div>
  );
};

export default AuthCallbackPage;
