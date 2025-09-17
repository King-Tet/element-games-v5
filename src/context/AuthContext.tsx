// src/context/AuthContext.tsx

'use client';

import React, {
  createContext, useContext, useState, useEffect, ReactNode, useCallback
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requiresUsernameSetup, setRequiresUsernameSetup] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0); // State for cache busting

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

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      
      if (JSON.stringify(user) !== JSON.stringify(currentUser)) {
        setUser(currentUser);
        if (currentUser) {
            await fetchUserProfile(currentUser);
        } else {
            setUserProfile(null);
            setIsAdmin(false);
            setRequiresUsernameSetup(false);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, user]);

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
    setUser(null);
    setUserProfile(null);
  };

  const reloadUserProfile = useCallback(async () => {
       if (user) {
         setLoading(true);
         await fetchUserProfile(user);
         setProfileVersion(v => v + 1); // Increment version to trigger re-renders
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
    profileVersion, // Export new value
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