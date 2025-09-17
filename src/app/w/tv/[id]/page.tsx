// app/w/tv/[id]/page.tsx
import Image from 'next/image';
import EpisodeSelector from '@/components/w/sections/EpisodeSelector';
import styles from './details.module.css'; // Reusing the movie details styles

// Base URL for TMDB images
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// Define the structure of the TV details we expect from our API
interface TvShowDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genres: { id: number; name: string }[];
  vote_average: number;
  number_of_seasons: number;
  seasons: {
    air_date: string | null;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
  }[];
}

// Helper function to fetch TV show details from our internal API
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function getTvShowDetails(id: string): Promise<TvShowDetails | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/tmdb/tv/${id}`, {
      next: { revalidate: 3600 } // Revalidate once per hour
    });
    if (!res.ok) {
      console.error(`Failed to fetch TV show ${id}:`, res.status, await res.text());
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(`Error fetching TV show ${id}:`, error);
    return null;
  }
}

// The page component
export default async function TvShowDetailsPage({ params }: { params: { id: string } }) {
  const show = await getTvShowDetails(params.id);

  if (!show) {
    return <div className={styles.notFound}>TV Show not found.</div>;
  }

  const backdropUrl = show.backdrop_path ? `${TMDB_IMAGE_BASE_URL}original${show.backdrop_path}` : '/placeholder-backdrop.png';
  const posterUrl = show.poster_path ? `${TMDB_IMAGE_BASE_URL}w500${show.poster_path}` : '/placeholder-poster.png';

  return (
    <div className={styles.pageContainer}>
      {/* Backdrop Image */}
      <div className={styles.backdrop}>
        <Image
          src={backdropUrl}
          alt={`Backdrop for ${show.name}`}
          fill
          priority
          sizes="100vw"
          className={styles.backdropImage}
        />
        <div className={styles.backdropOverlay}></div>
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.poster}>
            <Image
              src={posterUrl}
              alt={`Poster for ${show.name}`}
              width={250}
              height={375}
              className={styles.posterImage}
            />
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.title}>{show.name}</h1>
            <div className={styles.metaInfo}>
              <span>{show.first_air_date.substring(0, 4)}</span>
              <span>•</span>
              <span>{show.number_of_seasons} Season(s)</span>
              <span>•</span>
              <span className={styles.rating}>
                ⭐ {show.vote_average.toFixed(1)}
              </span>
            </div>
            <div className={styles.genres}>
              {show.genres.map(genre => (
                <span key={genre.id} className={styles.genreTag}>{genre.name}</span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.overviewSection}>
          <h2 className={styles.sectionTitle}>Overview</h2>
          <p className={styles.overviewText}>{show.overview}</p>
        </div>

        <div className={styles.playerSection}>
            <h2 className={styles.sectionTitle}>Episodes</h2>
            <EpisodeSelector tvId={show.id} seasons={show.seasons} />
        </div>
      </main>
    </div>
  );
}
