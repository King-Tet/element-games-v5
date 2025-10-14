// src/context/AuthContext.tsx

'use client';

import React, {
  createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef
} from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { getUserProfileData } from '@/lib/supabase/db';
import { UserProfileData } from '@/types/user';

// ... (AuthContextType interface and other initializations remain the same) ...
interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  isAdmin: boolean;
  requiresUsernameSetup: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  reloadUserProfile: () => Promise<void>;
  profileVersion: number; // For cache-busting
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
interface AuthProviderProps { children: ReactNode; }
const adminUids = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',');

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requiresUsernameSetup, setRequiresUsernameSetup] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);
  const userIdRef = useRef<string | null>(null);

  const fetchUserProfile = useCallback(async (supabaseUser: User | null) => {
    setIsAdmin(false);
    setRequiresUsernameSetup(false);
    setUserProfile(null);

    if (supabaseUser) {
      if (adminUids.includes(supabaseUser.id)) {
        setIsAdmin(true);
      }
      try {
        const profileData = await getUserProfileData(supabaseUser.id);
        if (profileData) {
          setUserProfile(profileData);
          if (!profileData.username) {
            setRequiresUsernameSetup(true);
          }
        } else {
          setRequiresUsernameSetup(true);
        }
      } catch (error) {
         console.error("[AuthContext] Error fetching user profile:", error);
      }
    }
  }, []);

  // --- NEW: A function to check and validate the current session ---
  const validateSession = useCallback(async () => {
    // 1. Version Check
    const storedVersion = localStorage.getItem('appVersion');
    if (storedVersion !== APP_VERSION) {
      console.warn(`[AuthContext] App version mismatch. Forcing sign out.`);
      await supabase.auth.signOut();
      localStorage.setItem('appVersion', APP_VERSION);
      // Explicitly clear state to avoid waiting for the auth listener
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      setRequiresUsernameSetup(false);
      return; // Stop execution
    }

    // 2. Re-validate the session with Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("[AuthContext] Error re-validating session:", error);
      await supabase.auth.signOut(); // If getSession fails, sign out
    }
    
    const currentUser = session?.user ?? null;

    // 3. Update state only if the user has changed
    if (currentUser?.id !== userIdRef.current) {
        console.log('[AuthContext] User state changed after re-validation.');
        userIdRef.current = currentUser?.id ?? null;
        setUser(currentUser);
        await fetchUserProfile(currentUser);
    }

  }, [fetchUserProfile]);


  useEffect(() => {
    const initializeAndListen = async () => {
      // Run the initial validation on first load
      await validateSession();
      setLoading(false); // Set loading to false after the initial check is done

      // Set up the listener for subsequent auth events
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN') {
              localStorage.setItem('appVersion', APP_VERSION);
          }
          if (event === 'SIGNED_OUT') {
              localStorage.removeItem('appVersion');
          }

          const currentUser = session?.user ?? null;
          if (currentUser?.id !== userIdRef.current) {
              userIdRef.current = currentUser?.id ?? null;
              setUser(currentUser);
              await fetchUserProfile(currentUser);
          }
        }
      );

      // --- NEW: Set up the visibility change listener ---
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log('[AuthContext] Tab became visible. Re-validating session.');
          validateSession();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup function
      return () => {
        subscription.unsubscribe();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };

    initializeAndListen();
  }, [validateSession, fetchUserProfile]);


  const signInWithGoogle = async (): Promise<void> => {
    // ... (rest of the function is unchanged)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
  };

  const signOutUser = async () => {
    // ... (rest of the function is unchanged)
    await supabase.auth.signOut();
  };

  const reloadUserProfile = useCallback(async () => {
    // ... (rest of the function is unchanged)
       if (user) {
         setLoading(true);
         await fetchUserProfile(user);
         setProfileVersion(v => v + 1);
         setLoading(false);
       }
   }, [user, fetchUserProfile]);

  const value = {
    user,
    userProfile,
    loading,
    isAdmin,
    requiresUsernameSetup,
    signInWithGoogle,
    signOutUser,
    reloadUserProfile,
    profileVersion,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};