// src/app/complete-profile/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './CompleteProfilePage.module.css';
import { FiUserCheck, FiLoader } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/client';
import { debounce } from 'lodash';

// Logger for this component
const logProfileSetup = (message: string, ...optionalParams: unknown[]) => {
    console.log(`[CompleteProfilePage] ${message}`, ...optionalParams);
};

// This is the new function that will replace the one in db.ts for this specific page's purpose
async function setUsernameAndFinalizeProfile(
  userId: string,
  username: string,
  displayName: string,
  avatarUrl: string
): Promise<{ error: unknown }> {
  // First, check if the username is taken by calling a Supabase Edge Function
  const { data: availability, error: availabilityError } = await supabase.functions.invoke('check-username', {
      body: { username }
  });

  if (availabilityError) return { error: availabilityError };
  if (!availability.available) return { error: { message: 'Username is already taken.' } };

  // If username is available, create the profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    username: username,
    display_name: displayName,
    avatar_url: avatarUrl,
  });

  return { error: profileError };
}


const CompleteProfilePage: React.FC = () => {
  const { user, userProfile, loading: authLoading, reloadUserProfile, signOutUser } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const latestUsernameForCheck = useRef<string>('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/');
      } else if (userProfile?.username) {
        router.replace('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const checkUsernameAvailability = async (currentUsername: string) => {
      const { data, error } = await supabase.functions.invoke('check-username', {
          body: { username: currentUsername }
      });
      if (error) throw new Error(error.message);
      return data.available;
  };

  const debouncedCheckAvailability = useCallback(
    debounce(async (currentUsername: string) => {
      if (
        currentUsername !== latestUsernameForCheck.current ||
        !validateUsernameFormat(currentUsername)
      ) {
        setIsCheckingUsername(false);
        return;
      }
      setIsCheckingUsername(true);
      setServerError(null);
      setIsUsernameAvailable(null);
      try {
        const available = await checkUsernameAvailability(currentUsername);
        if (currentUsername === latestUsernameForCheck.current) {
            setIsUsernameAvailable(available);
            setUsernameError(available ? null : "Username is already taken.");
        }} catch {
        if (currentUsername === latestUsernameForCheck.current) {
            setServerError("Could not check username. Please try again.");
            setIsUsernameAvailable(null);
        }
      } finally {
        if (currentUsername === latestUsernameForCheck.current) {
            setIsCheckingUsername(false);
        }
      }
    }, 500),
    [
      validateUsernameFormat,
      setIsCheckingUsername,
      setServerError,
      setIsUsernameAvailable,
      setUsernameError,
    ]
  );

  const validateUsernameFormat = useCallback((value: string): boolean => {
    let isValid = false;
    setUsernameError(null);
    if (!value) {}
    else if (value.length < 3) setUsernameError('Username must be at least 3 characters.');
    else if (value.length > 20) setUsernameError('Username cannot exceed 20 characters.');
    else if (!/^[a-zA-Z0-9_]+$/.test(value)) setUsernameError('Username can only contain letters, numbers, and underscores.');
    else isValid = true;
    setIsUsernameValid(isValid);
    return isValid;
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    latestUsernameForCheck.current = newUsername;
    const isValidFormat = validateUsernameFormat(newUsername);
    setIsUsernameAvailable(null);
    setServerError(null);
    if (isValidFormat) {
      setIsCheckingUsername(true);
      debouncedCheckAvailability(newUsername);
    } else {
      debouncedCheckAvailability.cancel();
      setIsCheckingUsername(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validateUsernameFormat(username)) return;
    if (isUsernameAvailable !== true) {
        setUsernameError("This username is taken or availability check failed.");
        return;
    }
    if (isSubmitting || !user) return;

    setIsSubmitting(true);
    // Correctly get the display name and avatar from Supabase user_metadata
    const displayName = user.user_metadata.full_name || username;
    const avatarUrl = user.user_metadata.avatar_url || '/logos/default-avatar.png';

    logProfileSetup(`Submitting profile: Username="${username.trim()}" for UID: ${user.id}`);

    const { error } = await setUsernameAndFinalizeProfile(user.id, username.trim(), displayName, avatarUrl);

    if (error) {
        logProfileSetup("Profile setup error during submission:", error);
        setServerError(error.message || "Failed to complete profile. Please try again.");
        setIsSubmitting(false);
    } else {
        logProfileSetup("Profile finalized successfully.");
        await reloadUserProfile();
        router.push('/');
    }
  };

  if (authLoading || !user) {
    return <div className={styles.loadingScreen}>Loading authentication...</div>;
  }

  const isSubmitButtonDisabled = !isUsernameValid || isUsernameAvailable !== true || isSubmitting || isCheckingUsername;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.setupCard}>
        <h1 className={styles.title}>Complete Your Profile</h1>
        <p className={styles.subtitle}>
          Welcome, {user?.user_metadata.full_name || 'New User'}! Choose a unique username.
        </p>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text" id="username" value={username} onChange={handleUsernameChange} required
              className={`${styles.inputField} ${usernameError ? styles.inputError : ''} ${isUsernameAvailable === true ? styles.inputValid : ''}`}
              placeholder="Choose your unique username" maxLength={20}
            />
            <div className={styles.statusContainer}>
              {usernameError && <span className={styles.errorMessage}>{usernameError}</span>}
              {isUsernameValid && isCheckingUsername && <span className={styles.loadingMessage}>Checking...</span>}
              {isUsernameValid && !isCheckingUsername && isUsernameAvailable === true && (
                <span className={styles.successMessage}>Username available!</span>
              )}
            </div>
            <small className={styles.inputHint}>3-20 characters, letters, numbers, and underscores only.</small>
          </div>
          {serverError && <p className={styles.errorMessage}>{serverError}</p>}
          <button type="submit" className={styles.submitButton} disabled={isSubmitButtonDisabled}>
            {isSubmitting ? <><FiLoader className={styles.spinner} /> Setting Up...</> : <><FiUserCheck /> Set Username & Continue</>}
          </button>
        </form>
        <div className={styles.footerText}>
          <button onClick={() => signOutUser()} className={styles.signOutLink}>Sign Out</button>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;