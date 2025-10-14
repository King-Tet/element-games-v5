// src/context/AuthContext.tsx

'use client';

import React, {
  createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef
} from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { getUserProfileData } from '@/lib/supabase/db';
import { UserProfileData } from '@/types/user';

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

  const validateSession = useCallback(async () => {
    const storedVersion = localStorage.getItem('appVersion');
    if (storedVersion !== APP_VERSION) {
      console.warn(`[AuthContext] App version mismatch. Forcing sign out.`);
      await supabase.auth.signOut();
      localStorage.setItem('appVersion', APP_VERSION);
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      setRequiresUsernameSetup(false);
      return;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("[AuthContext] Error re-validating session:", error);
      await supabase.auth.signOut();
    }
    
    const currentUser = session?.user ?? null;

    if (currentUser?.id !== userIdRef.current) {
        console.log('[AuthContext] User state changed after re-validation.');
        userIdRef.current = currentUser?.id ?? null;
        setUser(currentUser);
        await fetchUserProfile(currentUser);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    const initializeAndListen = async () => {
      // --- MODIFICATION: Wrap initial validation in a try/finally block ---
      try {
        await validateSession();
      } catch (e) {
        console.error("[AuthContext] Critical error during session initialization:", e);
      } finally {
        // This guarantees that loading is set to false, preventing the stuck screen.
        setLoading(false);
      }
      // --- END MODIFICATION ---

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

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log('[AuthContext] Tab became visible. Re-validating session.');
          validateSession();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        subscription.unsubscribe();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };

    initializeAndListen();
  }, [validateSession, fetchUserProfile]);

  const signInWithGoogle = async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
  };

  const signOutUser = async () => {
    await supabase.auth.signOut();
  };

  const reloadUserProfile = useCallback(async () => {
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