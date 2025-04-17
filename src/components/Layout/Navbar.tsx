// src/components/Layout/Navbar.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { FiMenu, FiSettings, FiSearch, FiX } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

// Import data and types
import gameData from '@/data/games.json';
import toolData from '@/data/tools.json';
import { Game } from '@/types/game';
import { Tool } from '@/types/tool';
import { SearchItem, SearchItemType } from '@/types'; // Import the new SearchItem type


// Debounce function helper
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
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
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const pathname = usePathname(); // Get current path to close results on navigation
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
    const combinedData: SearchItem[] = [
      ...gameData.map((game: Game) => ({
        id: game.id,
        name: game.name,
        type: 'game' as SearchItemType,
        category: game.category,
        linkPath: `/g/play/${game.id}`, // Link path for games
        isExternal: false,
        rawData: game,
      })),
      ...toolData.map((tool: Tool) => ({
        id: tool.id,
        name: tool.name,
        type: 'tool' as SearchItemType,
        category: tool.category,
        // Determine link path based on tool type
        linkPath:
          tool.sourceType === 'external'
            ? tool.sourcePath
            : tool.sourceType === 'iframe'
            ? `/t/embed/${tool.id}`
            : tool.sourcePath, // Component type uses sourcePath directly
        isExternal: tool.sourceType === 'external',
        rawData: tool,
      })),
    ];
    setAllSearchableData(combinedData);
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
              // Search in name, category, and tags (if they exist)
              const nameMatch = item.name.toLowerCase().includes(lowerCaseQuery);
              const categoryMatch = item.category.toLowerCase().includes(lowerCaseQuery);
              const tagsMatch = item.rawData.tags
                  ? item.rawData.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
                  : false;
              const descriptionMatch = item.rawData.description // Also search description
                  ? item.rawData.description.toLowerCase().includes(lowerCaseQuery)
                  : false;

              return nameMatch || categoryMatch || tagsMatch || descriptionMatch;
          })
          .slice(0, 7); // Limit results (e.g., top 7)

      setFilteredResults(results);
      setIsSearchLoading(false);
      setIsResultsVisible(results.length > 0 || !!query.trim()); // Keep visible if typing, even with no results yet

  }, [allSearchableData]); // Recreate only if data changes

  // Create the debounced version of performSearch
  const debouncedSearch = useCallback(debounce(performSearch, 300), [performSearch]);

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
  }, []);

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
        <Link href="/" className={styles.logo}>
          Element Games v5
        </Link>
      </div>

      {/* Center Section: Search Bar & Results */}
      <div className={styles.centerSection}>
        <div className={styles.searchContainer}>
          <FiSearch className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search games and tools..."
            className={styles.searchBar}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocus}
            aria-label="Search Games and Tools"
          />
          {searchQuery && (
             <button onClick={clearSearch} className={styles.clearSearchButton} aria-label="Clear search">
                 <FiX />
             </button>
          )}

          {/* Search Results Dropdown */}
          {isResultsVisible && (
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
                      <span className={styles.resultType}>{item.type}</span>
                    </a>
                  </Link>
                ))
              ) : searchQuery.trim() && !isSearchLoading ? (
                <div className={styles.searchStatus}>No results found for "{searchQuery}"</div>
              ) : null /* Don't show anything if query is empty and not loading */}
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Settings & Auth */}
      <div className={styles.rightSection}>
        <Link href="/settings" passHref>
          <button className={styles.settingsButton} aria-label="Settings">
            <FiSettings />
          </button>
        </Link>

        {authLoading ? (
          <div style={{ width: '80px' }}></div>
        ) : user ? (
          <Link href="/account" passHref>
             <img
                src={user.photoURL || '/default-avatar.png'}
                alt={user.displayName || 'User Profile'}
                className={styles.profilePic}
                referrerPolicy="no-referrer"
              />
          </Link>
        ) : (
          <button className={styles.signInButton} onClick={signInWithGoogle}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;