// app/w/search/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/w/ui/Card';
import styles from './page.module.css';

// Define the structure of a single search result item
interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
}

// A wrapper component to handle client-side logic
function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get initial query from URL, or default to empty string
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This effect runs when the component mounts or when the initialQuery from the URL changes.
  useEffect(() => {
    if (initialQuery) {
      setIsLoading(true);
      setError(null);
      fetch(`/api/tmdb/search?query=${encodeURIComponent(initialQuery)}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch search results.');
          }
          return res.json();
        })
        .then(data => {
          setResults(data.results || []);
        })
        .catch(err => {
          console.error(err);
          setError('Could not load results. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setResults([]); // Clear results if query is empty
    }
  }, [initialQuery]);

  // This effect handles debouncing the user's input to update the URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query) {
        // Use router.replace to avoid adding to browser history for every letter typed
        router.replace(`/w/search?q=${encodeURIComponent(query)}`);
      } else if (initialQuery) {
        // If the user clears the search box, go back to the base search page
        router.push('/w/search');
      }
    }, 500); // 500ms delay after user stops typing

    return () => {
      clearTimeout(handler);
    };
  }, [query, router, initialQuery]);

  return (
    <main className={styles.main}>
      <div className={styles.searchBarContainer}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for movies or TV shows..."
          className={styles.searchInput}
          autoFocus
        />
      </div>

      <div className={styles.resultsContainer}>
        {isLoading && <div className={styles.message}>Loading...</div>}
        {error && <div className={styles.message}>{error}</div>}
        {!isLoading && !error && results.length === 0 && initialQuery && (
          <div className={styles.message}>No results found for "{initialQuery}".</div>
        )}
        
        <div className={styles.resultsGrid}>
          {results.map((item) => (
            <Card
              key={item.id}
              id={item.id}
              title={item.title || item.name || 'Untitled'}
              posterPath={item.poster_path}
              mediaType={item.media_type}
            />
          ))}
        </div>
      </div>
    </main>
  );
}


// The default export needs to wrap the client component in Suspense
// because useSearchParams requires it.
export default function SearchPage() {
    return (
        <Suspense fallback={<div className={styles.message}>Loading...</div>}>
            <SearchPageClient />
        </Suspense>
    );
}
