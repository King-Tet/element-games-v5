// src/components/Games/GameCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Use Next.js Image for optimization
import { Game } from '@/types/game'; // Import the interface
import styles from './GameCard.module.css';
import { FiStar, FiEye } from 'react-icons/fi'; // Icons for rating/visits

interface GameCardProps {
  game: Game; // Expects the full Game object, including Firestore fields
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  // Format large numbers for visits using totalVisits from Firestore
  const formatVisits = (num: number | undefined): string => {
    const actualNum = num || 0; // Default to 0 if undefined
    if (actualNum >= 1000000) {
      return (actualNum / 1000000).toFixed(1) + 'M';
    }
    if (actualNum >= 1000) {
      return (actualNum / 1000).toFixed(actualNum < 10000 ? 1 : 0) + 'K';
    }
    return actualNum.toString();
  };

  // Use averageRating from Firestore, default to 0 if not present
  const displayRating = (game.averageRating || 0).toFixed(1);

  return (
    <Link href={`/g/play/${game.id}`} className={styles.card}>
      <div className={styles.imageContainer}>
        <Image
          src={game.imageUrl || '/game-images/default-placeholder.png'} // Add fallback directly here
          alt={game.name}
          layout="fill"
          objectFit="cover"
          className={styles.image}
          unoptimized={game.imageUrl?.startsWith('http')}
          onError={(e) => {
            console.warn(`Failed to load image: ${game.imageUrl}`);
            (e.target as HTMLImageElement).src = '/game-images/default-placeholder.png';
          }}
          priority={false} // Can set priority=true for above-the-fold images if needed
        />
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{game.name}</h3>
        <div className={styles.details}>
           <span className={styles.category}>{game.category}</span>
           <span className={styles.rating}>
              {/* Display averageRating */}
              <FiStar /> {displayRating}
           </span>
           <span className={styles.visits}>
              {/* Display totalVisits */}
              <FiEye /> {formatVisits(game.totalVisits)}
           </span>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;