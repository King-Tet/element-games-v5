'use client'; // This component involves client-side interaction (hover state)

import React, { useState } from 'react';
import { FiStar } from 'react-icons/fi'; // Using Feather icons
import styles from './StarRating.module.css';

interface StarRatingProps {
  rating: number | null; // Current rating (null if not rated)
  maxRating?: number; // Maximum stars (default 5)
  onRate?: (rating: number) => void; // Callback when a star is clicked
  disabled?: boolean; // Whether interaction is disabled
  readOnly?: boolean; // Alias for disabled for display-only purposes
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  onRate,
  disabled = false,
  readOnly = false,
}) => {
  const isInteractive = !disabled && !readOnly;
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoverRating(null);
    }
  };

  const handleClick = (starValue: number) => {
    if (isInteractive && onRate) {
      onRate(starValue);
    }
  };

  return (
    <div
      className={styles.starRating}
      onMouseLeave={handleMouseLeave}
      aria-disabled={!isInteractive}
      role="radiogroup"
    >
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = (hoverRating ?? rating ?? 0) >= starValue;

        return (
          <span
            key={starValue}
            className={`
              ${styles.star}
              ${isFilled ? styles.filled : ''}
              ${!isInteractive ? styles.disabled : ''}
            `}
            onMouseEnter={() => isInteractive && setHoverRating(starValue)}
            onClick={() => handleClick(starValue)}
            role="radio"
            aria-checked={rating === starValue}
            aria-label={`Rate ${starValue} out of ${maxRating} stars`}
            tabIndex={!isInteractive ? -1 : 0}
            onKeyDown={(e) => {
                 if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
                     e.preventDefault();
                     handleClick(starValue);
                 }
            }}
          >
            <FiStar />
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;