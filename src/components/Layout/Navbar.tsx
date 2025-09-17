// src/components/Layout/Navbar.tsx
'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { FiMenu, FiSettings, FiSearch, FiX} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

// Import data and types
import gameData from '@/data/games.json';
import toolData from '@/data/tools.json';
import { Game } from '@/types/game';
import { Tool } from '@/types/tool';
import { SearchItem, SearchItemType, } from '@/types';
import Image from 'next/image';


// Debounce function helper
function debounce<F extends (...args: unknown[]) => unknown>(func: F, waitFor: number) {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        timeoutId = null; // Clear timeoutId after execution
        resolve(func(...args));
      }, waitFor);
    });
}


interface NavbarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const { user, userProfile, loading: authLoading, signInWithGoogle, profileVersion } = useAuth();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [allSearchableData, setAllSearchableData] = useState<SearchItem[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchItem[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isResultsVisible, setIsResultsVisible] = useState(false);

  // --- Load and prepare data on mount ---
  useEffect(() => {
    const loadAllData = async () => {
      // Fetch users from our API endpoint
      let users: { uid: string; displayName: string; username: string }[] = [];
      try {
        const res = await fetch('/api/users/search');
        if (res.ok) {
          users = await res.json();
        } else {
          console.error('Failed to fetch users for search');
        }
      } catch (error) {
        console.error('Error fetching users for search:', error);
      }

      const combinedData: SearchItem[] = [
        ...gameData.map((game: Game) => ({
          id: game.id,
          name: game.name,
          type: 'game' as SearchItemType,
          category: game.category,
          linkPath: `/g/play/${game.id}`,
          isExternal: false,
          rawData: game,
        })),
        ...toolData.map((tool: Tool) => ({
          id: tool.id,
          name: tool.name,
          type: 'tool' as SearchItemType,
          category: tool.category,
          linkPath:
            tool.sourceType === 'external'
              ? tool.sourcePath
              : tool.sourceType === 'iframe'
              ? `/t/embed/${tool.id}`
              : tool.sourcePath,
          isExternal: tool.sourceType === 'external',
          rawData: tool,
        })),
        ...users.map(user => ({
          id: user.uid,
          name: user.displayName || user.username, // Display name, fallback to username
          type: 'user' as SearchItemType,
          linkPath: `/u/${user.username}`, // Link to user profile page
          isExternal: false,
          rawData: user, // Keep all user data for more detailed search
        })),
      ];
      setAllSearchableData(combinedData);
    };

    loadAllData();
  }, []); // Empty dependency array: run only once

  // --- Debounced search function ---
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
        setFilteredResults([]);
        setIsSearchLoading(false);
        setIsResultsVisible(false); // Hide if query is empty
        return;
    }

    setIsSearchLoading(true); // Indicate loading (optional)
    const lowerCaseQuery = query.toLowerCase();

    const results = allSearchableData
        .filter(item => {
            const nameMatch = item.name?.toLowerCase().includes(lowerCaseQuery);

            if (item.type === 'user') {
                // For users, search displayName (already in `name`) and username
                const usernameMatch = item.rawData.username?.toLowerCase().includes(lowerCaseQuery);
                return nameMatch || usernameMatch;
            }

            // For games and tools, search name, category, tags, and description
            const categoryMatch = item.category?.toLowerCase()?.includes(lowerCaseQuery);
            const tagsMatch = item.rawData.tags ? item.rawData.tags.some((tag: string) => tag?.toLowerCase()?.includes(lowerCaseQuery)) : false;
            const descriptionMatch = item.rawData.description ? item.rawData.description.toLowerCase().includes(lowerCaseQuery) : false;

            return nameMatch || categoryMatch || tagsMatch || descriptionMatch;
        })
        .slice(0, 7); // Limit results (e.g., top 7)

      setFilteredResults(results);
      setIsSearchLoading(false);
      setIsResultsVisible(results.length > 0 || !!query.trim()); // Keep visible if typing, even with no results yet

  }, [allSearchableData]); // Recreate only if data changes

  // Create the debounced version of performSearch
  const debouncedSearch = useMemo(() => debounce(performSearch, 300), [performSearch]);

  // --- Handle search input change ---
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    setIsSearchLoading(true); // Show loading immediately on input change
    debouncedSearch(query); // Call the debounced search
  };

  // --- Handle focus and blur/click outside ---
  const handleFocus = () => {
    // Show results immediately on focus if there's already a query and results
    if (searchQuery.trim() && filteredResults.length > 0) {
        setIsResultsVisible(true);
    } else if (searchQuery.trim()) {
        // If focused and query exists but no results yet (maybe due to debounce delay), show loading/empty state
        setIsResultsVisible(true);
    }
    // Don't automatically show if query is empty on focus
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current && !searchInputRef.current.contains(event.target as Node) &&
        searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)
      ) {
        setIsResultsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Empty dependency array, so it only runs once. searchResultsRef will be stable.

    // Close results on route change
    useEffect(() => {
        setIsResultsVisible(false);
        setSearchQuery(''); // Optionally clear search on navigation
    }, [pathname]);


  // Clear search input
  const clearSearch = () => {
      setSearchQuery('');
      setFilteredResults([]);
      setIsResultsVisible(false);
      searchInputRef.current?.focus(); // Keep focus on input after clearing
  };


  // --- Dynamic Navbar Style ---
  const sidebarWidth = isSidebarOpen ? 'var(--sidebar-width-open)' : 'var(--sidebar-width-closed)';

  return (
    <nav className={styles.navbar} style={{ left: sidebarWidth }}>
      {/* Left Section: Toggle & Logo */}
      <div className={styles.leftSection}>
        <button onClick={toggleSidebar} className={styles.sidebarToggle} aria-label="Toggle Sidebar">
          <FiMenu />
        </button>

      </div>

      {/* Center Section: Search Bar & Results */}
      <div className={styles.centerSection}>
        <div className={styles.searchContainer}>
          <FiSearch className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search for games, tools, or users..."
            className={styles.searchBar}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocus}
            aria-label="Search for games, tools, or users"
          />
          {searchQuery && (
              <button onClick={clearSearch} className={styles.clearSearchButton} aria-label="Clear search">
                  <FiX />
              </button>
          )}

          {/* Search Results Dropdown */}
          {isResultsVisible && searchQuery.trim() && (
            <div ref={searchResultsRef} className={styles.searchResultsContainer}>
              {isSearchLoading && filteredResults.length === 0 && searchQuery.trim() ? (
                  <div className={styles.searchStatus}>Loading...</div>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.linkPath}
                    passHref
                    legacyBehavior // Needed for child `<a>` tag
                    target={item.isExternal ? '_blank' : '_self'}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  >
                    <a
                      className={styles.searchResultItem}
                      onClick={() => setIsResultsVisible(false)} // Close on click
                    >
                      <span className={styles.resultName}>{item.name}</span>
                      <span className={styles.resultType}>
                        {item.type === 'user'
                          ? `@${item.rawData.username}` // Show username for users
                          : item.type}
                      </span>
                    </a>
                  </Link>
              ))
              ) : searchQuery.trim() && !isSearchLoading ? (
                <div className={styles.searchStatus}>No results found for &quot;{searchQuery}&quot;</div>
              ) : null /* Don't show anything if query is empty and not loading */}
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Settings & Auth */}
      <div className={styles.rightSection}>
            <Link href="/settings" passHref> <button className={styles.settingsButton} aria-label="Settings"> <FiSettings /> </button> </Link>

            {/* --- UPDATED Auth Section --- */}
            {authLoading ? (
                <div style={{ width: '36px', height: '36px' }}></div>
            ) : user && userProfile ? (
                <Link href="/account" passHref>
                    <Image
                        src={`${userProfile.avatar_url || '/logos/default-avatar.png'}?v=${profileVersion}`}
                        alt={userProfile.display_name || 'Profile'}
                        className={styles.profilePic}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logos/default-avatar.png'; }}
                        width={36} height={36}
                    />
                </Link>
            ) : (
                <button className={styles.signInButton} onClick={signInWithGoogle}>
                    Sign In with Google
                </button>
            )}
            </div>
        </nav>
    );
};
export default Navbar;