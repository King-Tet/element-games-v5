// components/w/ui/Card.tsx
import Link from 'next/link';
import Image from 'next/image';
import styles from './Card.module.css';

// Define the properties the Card component will accept
interface CardProps {
  id: number;
  title: string;
  posterPath: string | null;
  mediaType: 'movie' | 'tv';
}

// Base URL for TMDB poster images
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const Card = ({ id, title, posterPath, mediaType }: CardProps) => {
  // Construct the full image URL
  const imageUrl = posterPath 
    ? `${TMDB_IMAGE_BASE_URL}${posterPath}`
    : '/placeholder-poster.png'; // A fallback image in your /public directory

  // The link to the details page for the movie or tv show
  const linkHref = `/w/${mediaType}/${id}`;

  return (
    <Link href={linkHref} className={styles.cardLink}>
      <div className={styles.card}>
        <Image
          src={imageUrl}
          alt={`Poster for ${title}`}
          fill // 'fill' makes the image cover the parent div
          sizes="(max-width: 768px) 33vw, (max-width: 1200px) 20vw, 15vw" // Responsive image sizes
          className={styles.posterImage}
          // Optional: Add a placeholder for loading
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/vx7PQAIuAM4x5sYvQAAAABJRU5ErkJggg=="
        />
        <div className={styles.overlay}>
          <h3 className={styles.title}>{title}</h3>
        </div>
      </div>
    </Link>
  );
};

export default Card;
