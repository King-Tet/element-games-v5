// components/w/sections/MediaCarousel.tsx
'use client'; // This component can be interactive, so it's a client component.

import Card from '../ui/Card';
import styles from './MediaCarousel.module.css';

// Define a flexible type for the items in the carousel.
// It can be a movie, a TV show, or from the user's watch history.
// We only need the properties that the Card component requires.
export interface CarouselItem {
  id: number;
  title: string;
  poster_path: string | null; // From TMDB movie/tv results
  posterPath?: string | null; // From our Firestore watch history
  media_type: 'movie' | 'tv'; // From TMDB search/discover
  mediaType?: 'movie' | 'tv'; // From our Firestore watch history
}

interface MediaCarouselProps {
  title: string;
  items: CarouselItem[];
  // Optional property to show a message when there are no items
  emptyMessage?: string; 
}

const MediaCarousel = ({ title, items, emptyMessage = "Nothing to show here yet." }: MediaCarouselProps) => {
  // Don't render the component if there are no items and no specific message to show.
  if (!items || items.length === 0) {
    return (
        <div className={styles.carouselWrapper}>
            <h2 className={styles.carouselTitle}>{title}</h2>
            <p className={styles.emptyMessage}>{emptyMessage}</p>
        </div>
    );
  }

  return (
    <section className={styles.carouselWrapper}>
      <h2 className={styles.carouselTitle}>{title}</h2>
      <div className={styles.scrollContainer}>
        {items.map((item) => (
          <div key={`${item.id}-${item.title}`} className={styles.cardContainer}>
            <Card
              id={item.id}
              // Use the correct property based on the data source (TMDB vs. Firestore)
              title={item.title}
              posterPath={item.poster_path ?? item.posterPath ?? null}
              mediaType={item.media_type ?? item.mediaType ?? 'movie'}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default MediaCarousel;
