// src/components/Layout/MainLayout.tsx
'use client';

import React, { useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import styles from './MainLayout.module.css';
import { useAuth } from '@/context/AuthContext';
import { TAB_PRESETS, DEFAULT_PRESET } from '@/utils/tabPresets';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import ForcedSignIn from '@/components/Auth/ForcedSignIn'; // Import the new component

const DEFAULT_PANIC_KEY = '\`';
const DEFAULT_PANIC_URL = 'https://ixl.com/dashboard';

// ... (PRESENCE_MAPPINGS and getCurrentActivity function remain the same) ...
const PRESENCE_MAPPINGS: Array<{
    pattern: RegExp;
    getActivity: (match: RegExpMatchArray) => { type: 'game' | 'activity'; name: string } | null;
}> = [
    { pattern: /^\/g\/play\/(.+)$/, getActivity: (match) => ({ type: 'game', name: match[1] }) },
    { pattern: /^\/g$/, getActivity: () => ({ type: 'activity', name: 'Browsing Games' }) },
    { pattern: /^\/t$/, getActivity: () => ({ type: 'activity', name: 'Browsing Tools' }) },
    { pattern: /^\/settings$/, getActivity: () => ({ type: 'activity', name: 'In Settings' }) },
    { pattern: /^\/admin$/, getActivity: () => ({ type: 'activity', name: 'In Admin Panel' }) },
    { pattern: /^\/w$/, getActivity: () => ({ type: 'activity', name: 'Watching a Movie' }) },
    { pattern: /^\/feedback$/, getActivity: () => ({ type: 'activity', name: 'Reporting a Bug' }) },
    { pattern: /^\/leaderboards$/, getActivity: () => ({ type: 'activity', name: 'Browsing Leaderboards' }) },
    { pattern: /^\/$/, getActivity: () => ({ type: 'activity', name: 'Home Page' }) },
    { pattern: /^\/u\/(.+)$/, getActivity: () => ({ type: 'activity', name: 'Viewing a Profile' }) }
];

function getCurrentActivity(pathname: string): { type: 'game' | 'activity'; name: string } | null {
    for (const mapping of PRESENCE_MAPPINGS) {
        const match = pathname.match(mapping.pattern);
        if (match) {
            return mapping.getActivity(match);
        }
    }
    return null;
}


interface MainLayoutProps { children: ReactNode; }

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading: authLoading, requiresUsernameSetup, isAdmin } = useAuth();
  const faviconLinkRef = useRef<HTMLLinkElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const applySavedTabCloak = useCallback(() => {
    if (typeof window !== 'undefined') {
        const savedPresetKey = localStorage.getItem('settings:presetKey') || DEFAULT_PRESET.key;
        const preset = TAB_PRESETS.find(p => p.key === savedPresetKey) || DEFAULT_PRESET;
        let targetTitle = preset.title;
        if (preset.key === 'default') {
             targetTitle = `IXL | Dashboard`;
        }
        const targetIconUrl = preset.iconUrl;

        if (document.title !== targetTitle) document.title = targetTitle;
        let fav = faviconLinkRef.current || document.querySelector("link[rel*='icon']");
        if (!fav) {
            fav = document.createElement('link');
            fav.rel = 'icon';
            document.head.appendChild(fav);
        }
        if (fav.href !== targetIconUrl) fav.href = targetIconUrl;
        faviconLinkRef.current = fav as HTMLLinkElement;
    }
  }, []);

  useEffect(() => {
    applySavedTabCloak();
  }, [pathname, applySavedTabCloak]);

  // This useEffect handles redirects *after* a user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (requiresUsernameSetup && pathname !== '/complete-profile') {
           router.push('/complete-profile');
      } else if (!requiresUsernameSetup && pathname === '/complete-profile') {
            router.push('/');
      }
    }
  }, [user, authLoading, requiresUsernameSetup, pathname, router]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
        const savedPanicKey = localStorage.getItem('settings:panicKey') || DEFAULT_PANIC_KEY;
        const savedPanicUrl = localStorage.getItem('settings:panicUrl') || DEFAULT_PANIC_URL;
        if (event.key === savedPanicKey) {
            event.preventDefault();
            window.location.href = savedPanicUrl;
        }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // ... (Presence useEffects remain the same) ...
    // --- SUPABASE REALTIME PRESENCE ---
    useEffect(() => {
        if (!user || !userProfile || authLoading) {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        return;
        }

        if (!channelRef.current) {
        const channel = supabase.channel('online-users', {
            config: { presence: { key: user.id } },
        });
        channelRef.current = channel;

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
            const activity = getCurrentActivity(pathname);
            const payload = {
                username: userProfile.username,
                display_name: userProfile.display_name,
                activity,
            };
            channel.track(payload, { expires_in: 60 });
            }
        });
        }

        return () => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        };
    }, [user, userProfile, authLoading, pathname]);

    useEffect(() => {
        if (channelRef.current && channelRef.current.state === 'joined' && userProfile) {
        const activity = getCurrentActivity(pathname);
        const payload = {
            username: userProfile.username,
            display_name: userProfile.display_name,
            activity,
        };
        channelRef.current.track(payload, { expires_in: 60 });
        }
    }, [pathname, userProfile]);

  // Define paths that don't require authentication
  const publicPaths = ['/auth/callback'];
  const isPublicPath = publicPaths.includes(pathname);

   return (
     <div className={styles.layoutContainer}>
       <Sidebar isOpen={isSidebarOpen} isAdmin={isAdmin} />
       <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
       <main className={`${styles.contentArea} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
         <div className={styles.mainContent}>
            {isPublicPath ? (
              children // If it's a public path, render the content immediately
            ) : authLoading ? (
              <div className={styles.fullPageLoader}>Authenticating...</div>
            ) : !user ? (
              <ForcedSignIn /> // If not loading and no user, show the sign-in prompt
            ) : (
              children // Otherwise, the user is logged in, so show the page content
            )}
         </div>
       </main>
     </div>
   );
};

export default MainLayout;