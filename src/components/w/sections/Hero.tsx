// components/w/sections/Hero.tsx
import Link from 'next/link';
import Image from 'next/image';
import styles from './Hero.module.css';

// Define the properties for the featured item in the Hero section
interface HeroItem {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string | null;
  media_type: 'movie' | 'tv';
}

interface HeroProps {
  item: HeroItem;
}

// Base URL for TMDB backdrop images
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

const Hero = ({ item }: HeroProps) => {
  if (!item) {
    return null; // Don't render if no item is provided
  }

  const imageUrl = item.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}${item.backdrop_path}`
    : '/placeholder-backdrop.png'; // A fallback image in your /public directory

  const linkHref = `/w/${item.media_type}/${item.id}`;

  return (
    <section className={styles.hero}>
      <div className={styles.backdrop}>
        <Image
          src={imageUrl}
          alt={`Backdrop for ${item.title}`}
          fill
          priority // Load this image first as it's LCP (Largest Contentful Paint)
          sizes="100vw"
          className={styles.backdropImage}
        />
        <div className={styles.backdropOverlay}></div>
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>{item.title}</h1>
        <p className={styles.overview}>{item.overview}</p>
        <Link href={linkHref} className={styles.ctaButton}>
          Watch Now
        </Link>
      </div>
    </section>
  );
};

export default Hero;
