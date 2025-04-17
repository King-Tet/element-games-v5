// src/components/ui/StarRating.tsx
'use client'; // This component involves client-side interaction (hover state)

import React, { useState } from 'react';
import { FiStar } from 'react-icons/fi'; // Using Feather icons
import styles from './StarRating.module.css';

interface StarRatingProps {
  rating: number | null; // Current rating (null if not rated)
  maxRating?: number; // Maximum stars (default 5)
  onRate: (rating: number) => void; // Callback when a star is clicked
  disabled?: boolean; // Whether interaction is disabled
  // Optional: Add a callback for clearing the rating
  // onClear?: () => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  onRate,
  disabled = false,
  // onClear, // Uncomment if implementing clear button
}) => {
  // State to track the rating being hovered over
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(null);
    }
  };

  const handleClick = (starValue: number) => {
    if (!disabled) {
      onRate(starValue); // Call the parent's onRate function
    }
  };

  // const handleClearClick = () => {
  //   if (!disabled && onClear) {
  //     onClear();
  //   }
  // };

  return (
    <div
      className={styles.starRating}
      onMouseLeave={handleMouseLeave}
      aria-disabled={disabled}
      role="radiogroup" // Semantically group the stars
    >
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        // Determine if the star should appear filled based on hover or actual rating
        const isFilled = (hoverRating ?? rating ?? 0) >= starValue;

        return (
          <span
            key={starValue}
            className={`
              ${styles.star}
              ${isFilled ? styles.filled : ''}
              ${disabled ? styles.disabled : ''}
            `}
            onMouseEnter={() => !disabled && setHoverRating(starValue)}
            onClick={() => handleClick(starValue)}
            role="radio" // Each star acts like a radio button
            aria-checked={rating === starValue} // Indicate which one is selected
            aria-label={`Rate ${starValue} out of ${maxRating} stars`}
            tabIndex={disabled ? -1 : 0} // Make focusable if not disabled
            onKeyDown={(e) => { // Allow keyboard interaction
                 if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                     e.preventDefault(); // Prevent page scroll on space
                     handleClick(starValue);
                 }
            }}
          >
            <FiStar />
          </span>
        );
      })}

      {/* Optional Clear Button */}
      {/* {rating && !disabled && onClear && (
                <button
                    onClick={handleClearClick}
                    className={styles.clearRatingButton}
                    aria-label="Clear rating"
                    title="Clear rating"
                    disabled={disabled}
                 >
                    ×
                 </button>
            )} */}
    </div>
  );
};

export default StarRating;