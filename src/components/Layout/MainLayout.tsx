// src/components/Layout/MainLayout.tsx
'use client';

import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation'; // Import usePathname
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import styles from './MainLayout.module.css';

// Import preset definitions (needed for applying cloak)
import { TAB_PRESETS } from '@/utlis/tabPresets'; // Assuming presets are moved to a shared file

// Define default panic settings here as well, for the listener fallback
const DEFAULT_PANIC_KEY = 'Escape';
const DEFAULT_PANIC_URL = 'https://google.com';
const DEFAULT_PRESET = TAB_PRESETS.find(p => p.key === 'default') || TAB_PRESETS[0];


interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname(); // Get current route path

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // --- Apply Tab Cloak on Mount & Route Change ---
  const applySavedTabCloak = useCallback(() => {
      if (typeof window !== 'undefined') { // Ensure this runs client-side
          const savedPresetKey = localStorage.getItem('settings:presetKey') || DEFAULT_PRESET.key;
          const preset = TAB_PRESETS.find(p => p.key === savedPresetKey) || DEFAULT_PRESET;

          // Using requestAnimationFrame helps ensure the update happens smoothly
          requestAnimationFrame(() => {
              document.title = preset.title;
              // Favicon update is handled separately/robustly in SettingsPage,
              // but we could add logic here too if needed for initial load.
              // Let's assume the initial HTML or SettingsPage load handles the icon.
          });
      }
  }, []); // Empty dependency array because it reads from localStorage directly

  useEffect(() => {
      applySavedTabCloak(); // Apply on initial mount

      // Re-apply whenever the pathname changes (client-side navigation)
      // This helps ensure the title sticks after navigation events.
  }, [pathname, applySavedTabCloak]); // Rerun when pathname changes

  // --- Global Panic Key Listener ---
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const savedPanicKey = localStorage.getItem('settings:panicKey') || DEFAULT_PANIC_KEY;
      const savedPanicUrl = localStorage.getItem('settings:panicUrl') || DEFAULT_PANIC_URL;

      if (event.key === savedPanicKey) {
        event.preventDefault();
        try {
            if (savedPanicUrl === 'about:blank' || new URL(savedPanicUrl).protocol.startsWith('http')) {
                 window.location.href = savedPanicUrl;
            } else {
                console.warn("Invalid Panic URL:", savedPanicUrl);
                window.location.href = DEFAULT_PANIC_URL;
            }
        } catch (e) {
             console.error("Error processing panic URL:", e);
             window.location.href = DEFAULT_PANIC_URL;
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []); // Setup listener once globally

  return (
    <div className={styles.layoutContainer}>
      <Sidebar isOpen={isSidebarOpen} />
      <Navbar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <main className={`${styles.contentArea} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
        <div className={styles.mainContent}>
           {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;