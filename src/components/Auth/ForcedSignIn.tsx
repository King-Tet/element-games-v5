// src/components/Auth/ForcedSignIn.tsx
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './ForcedSignIn.module.css';

const ForcedSignIn = () => {
    const { signInWithGoogle } = useAuth();

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Authentication Required</h1>
                <p className={styles.description}>
                    Please sign in with your Google account to access this page and the rest of the site.
                </p>
                <button
                    className={styles.signInButton}
                    onClick={signInWithGoogle}
                >
                    Sign In with Google
                </button>
            </div>
        </div>
    );
};

export default ForcedSignIn;