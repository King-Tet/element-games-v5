// src/components/Ads/AdPlaceholder.tsx
import React from 'react';
import styles from './AdPlaceholder.module.css';

// Define possible size strings based on common ad names/types
type AdSize =
  | 'Leaderboard' // 728x90
  | 'Large Leaderboard' // 970x90
  | 'Billboard' // 970x250
  | 'Banner' // 468x60
  | 'Mobile Banner' // 320x50
  | 'Large Mobile Banner' // 320x100
  | 'Medium Rectangle' // 300x250
  | 'Large Rectangle' // 336x280
  | 'Square' // 250x250
  | 'Skyscraper' // 120x600 / 160x600
  | 'Wide Skyscraper' // 160x600
  | 'Half Page' // 300x600
  | 'Responsive Horizontal' // Flexible width, common banner height
  | 'Responsive Vertical'; // Flexible height, common vertical width

interface AdPlaceholderProps {
  size: AdSize;
  style?: React.CSSProperties; // Allow passing custom styles
  className?: string; // Allow passing custom classes
  id?: string; // For potential future targeting
}

// Helper to map size prop to CSS class name
const getSizeClass = (size: AdSize): string => {
    switch (size) {
        case 'Leaderboard': return styles.sizeLeaderboard;
        case 'Large Leaderboard': return styles.sizeLargeLeaderboard;
        case 'Billboard': return styles.sizeBillboard;
        case 'Banner': return styles.sizeBanner;
        case 'Mobile Banner': return styles.sizeMobileBanner;
        case 'Large Mobile Banner': return styles.sizeLargeMobileBanner;
        case 'Medium Rectangle': return styles.sizeMediumRectangle;
        case 'Large Rectangle': return styles.sizeLargeRectangle;
        case 'Square': return styles.sizeSquare;
        case 'Skyscraper': return styles.sizeSkyscraper;
        case 'Wide Skyscraper': return styles.sizeWideSkyscraper;
        case 'Half Page': return styles.sizeHalfPage;
        case 'Responsive Horizontal': return styles.sizeResponsiveHorizontal;
        case 'Responsive Vertical': return styles.sizeResponsiveVertical;
        default: return styles.sizeMobileBanner; // Default fallback
    }
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({
    size,
    style,
    className,
    id
}) => {
  const sizeClass = getSizeClass(size);

  // When AdSense is integrated, this component will render the <ins> tag etc.
  // For now, it just renders a styled div.

  return (
    <div
      id={id}
      className={`${styles.adPlaceholder} ${sizeClass} ${className || ''}`}
      style={style}
      aria-label={`Advertisement placeholder - ${size}`} // Accessibility
      data-ad-size={size} // Data attribute for potential future use
    >
      {/* You can customize placeholder text */}
      Ad Placeholder ({size})
    </div>
  );
};

export default AdPlaceholder;