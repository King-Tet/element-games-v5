// app/w/page.tsx
'use client'; 

import { useState, useEffect } from 'react';
import Hero from '@/components/w/sections/Hero';
import MediaCarousel, { CarouselItem } from '@/components/w/sections/MediaCarousel';
import SearchBar from '@/components/w/ui/SearchBar';
import { getContinueWatchingList } from '@/lib/supabase/db'; // Updated import
import { MediaWatchProgress } from '@/types/watch'; // Updated import
import styles from './page.module.css';
import { useAuth } from '@/context/AuthContext';

// Define types for the data we expect from our TMDB API routes
interface TmdbResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: 'movie' | 'tv';
}

interface TmdbApiResponse {
  results: TmdbResult[];
}

// Helper function to fetch data from our internal API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://142.56.210.107:3000';

async function getPopularMedia(type: 'movie' | 'tv'): Promise<TmdbApiResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/tmdb/discover?type=${type}`, {
        next: { revalidate: 3600 } 
    });
    if (!res.ok) {
      console.error(`Failed to fetch popular ${type}:`, res.status, await res.text());
      return { results: [] };
    }
    return res.json();
  } catch (error) {
    console.error(`Error fetching popular ${type}:`, error);
    return { results: [] };
  }
}

// The main page component for the /w route
export default function WatchHomePage() {
  const { user, loading: authLoading } = useAuth();
  const [popularMoviesData, setPopularMoviesData] = useState<TmdbApiResponse>({ results: [] });
  const [popularTvData, setPopularTvData] = useState<TmdbApiResponse>({ results: [] });
  const [continueWatchingItems, setContinueWatchingItems] = useState<MediaWatchProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllMedia = async () => {
      setIsLoading(true);
      const [movies, tv] = await Promise.all([
        getPopularMedia('movie'),
        getPopularMedia('tv'),
      ]);
      setPopularMoviesData(movies);
      setPopularTvData(tv);
      setIsLoading(false);
    };
    fetchAllMedia();
  }, []);

  // Fetch continue watching list when user is available
  useEffect(() => {
    if (!authLoading && user) {
      getContinueWatchingList(user.id).then(setContinueWatchingItems); // Use Supabase user.id
    } else if (!authLoading && !user) {
      setContinueWatchingItems([]); // Clear list if user logs out
    }
  }, [user, authLoading]);


  const heroItem = popularMoviesData.results?.[0];

  const movieItems: CarouselItem[] = popularMoviesData.results.map(item => ({
    ...item,
    title: item.title || item.name || 'Untitled',
    media_type: 'movie'
  }));

  const tvItems: CarouselItem[] = popularTvData.results.map(item => ({
    ...item,
    title: item.name || item.title || 'Untitled',
    media_type: 'tv'
  }));

  const continueWatchingCarouselItems: CarouselItem[] = continueWatchingItems.map(item => ({
    id: parseInt(item.mediaId, 10),
    title: item.title,
    poster_path: item.posterPath,
    media_type: item.mediaType,
  }));

  return (
    <main className={styles.main}>
      {heroItem && (
        <Hero item={{
            ...heroItem,
            title: heroItem.title || heroItem.name || 'Untitled',
            media_type: 'movie'
        }} />
      )}
      
      <div className={styles.searchSection}>
        <SearchBar />
      </div>
      
      <div className={styles.carouselsContainer}>
        {/* Only show "Continue Watching" if user is logged in */}
        {!authLoading && user && (
            <MediaCarousel 
                title="Continue Watching" 
                items={continueWatchingCarouselItems}
                emptyMessage="Start watching a show or movie to see it here!"
            />
        )}
        <MediaCarousel title="Popular Movies" items={movieItems} />
        <MediaCarousel title="Popular TV Shows" items={tvItems} />
        <p className={styles.disclaimer}>
          Note: This service was created by me but uses the following third-party services: Videasy (Video Player), TMDB (Movie and TV Show Data), and Firebase (User Watch History).
          </p>
      </div>
    </main>
  );
}