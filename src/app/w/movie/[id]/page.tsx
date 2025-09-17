// app/w/movie/[id]/page.tsx
'use client'; 

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Player from '@/components/w/Player';
import styles from './details.module.css';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genres: { id: number; name: string }[];
  runtime: number;
  vote_average: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function getMovieDetails(id: string): Promise<MovieDetails | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/tmdb/movie/${id}`);
    if (!res.ok) {
      console.error(`Failed to fetch movie ${id}:`, res.status, await res.text());
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(`Error fetching movie ${id}:`, error);
    return null;
  }
}

const formatRuntime = (minutes: number) => {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default function MovieDetailsPage() {
  const params = useParams();
  
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const movieId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    const fetchMovieData = async () => {
      if (!movieId) return;
      setIsLoading(true);
      const movieDetails = await getMovieDetails(movieId);
      setMovie(movieDetails);
      setIsLoading(false);
    };

    fetchMovieData();
  }, [movieId]);


  if (isLoading) {
    return <div className={styles.notFound}>Loading...</div>;
  }

  if (!movie) {
    return <div className={styles.notFound}>Movie not found.</div>;
  }

  const backdropUrl = movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}original${movie.backdrop_path}` : '/placeholder-backdrop.png';
  const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE_URL}w500${movie.poster_path}` : '/placeholder-poster.png';
  
  const playerSrc = `https://vidsrc.xyz/embed/movie?tmdb=${movie.id}`;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.backdrop}>
        <Image src={backdropUrl} alt={`Backdrop for ${movie.title}`} fill priority sizes="100vw" className={styles.backdropImage}/>
        <div className={styles.backdropOverlay}></div>
      </div>
      <main className={styles.mainContent}>
        <div className={styles.header}>
            <div className={styles.poster}>
                <Image src={posterUrl} alt={`Poster for ${movie.title}`} width={250} height={375} className={styles.posterImage}/>
            </div>
            <div className={styles.headerText}>
                <h1 className={styles.title}>{movie.title}</h1>
                <div className={styles.metaInfo}>
                    <span>{movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'}</span>
                    <span>•</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                    <span>•</span>
                    <span className={styles.rating}>⭐ {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
                <div className={styles.genres}>
                    {movie.genres && movie.genres.map(genre => (<span key={genre.id} className={styles.genreTag}>{genre.name}</span>))}
                </div>
            </div>
        </div>
        <div className={styles.overviewSection}>
            <h2 className={styles.sectionTitle}>Overview</h2>
            <p className={styles.overviewText}>{movie.overview}</p>
        </div>
        <div className={styles.playerSection}>
            <h2 className={styles.sectionTitle}>Watch Now</h2>
            <Player 
                key={movie.id}
                src={playerSrc} 
                title={movie.title}
            />
        </div>
      </main>
    </div>
  );
}