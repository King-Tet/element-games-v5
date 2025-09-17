// src/components/Tools/ToolCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tool } from '@/types/tool'; // Import the interface
import styles from './ToolCard.module.css';
import * as FiIcons from 'react-icons/fi'; // Import all Feather icons

interface ToolCardProps {
  tool: Tool;
}

// Helper to get icon component by name string
const getIconComponent = (iconName: string | undefined): React.ElementType | null => {
    if (!iconName || !(iconName in FiIcons)) {
        return FiIcons.FiTool; // Default icon if not found or not specified
    }
    return FiIcons[iconName as keyof typeof FiIcons];
};


const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const IconComponent = getIconComponent(tool.iconName);

  const cardContent = (
    <>
      <div className={styles.header}>
        {tool.iconUrl ? (
          <div className={styles.iconWrapper}>
            <Image
              src={tool.iconUrl}
              alt={`${tool.name} icon`}
              width={24} // Or appropriate size
              height={24} // Or appropriate size
              unoptimized={tool.iconUrl.startsWith('http')} // Don't optimize external images if not configured
            />
          </div>
        ) : IconComponent ? (
            <div className={styles.iconWrapper}>
                <IconComponent />
            </div>
        ) : null }
        <h3 className={styles.title}>{tool.name}</h3>
      </div>
      <p className={styles.description}>{tool.description}</p>
      <div className={styles.footer}>
        <span className={styles.category}>{tool.category}</span>
        {tool.sourceType === 'external' && (
            <FiIcons.FiExternalLink className={styles.externalIcon} />
        )}
      </div>
    </>
  );

  // Conditionally render Link or <a>
  if (tool.sourceType === 'external') {
    // External links still use <a>
    return (
      <a
        href={tool.sourcePath}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.card}
      >
        {cardContent}
      </a>
    );
  } else {
     // Internal links (component or iframe) use Link
     // REMOVED legacyBehavior and child <a>. Applied styles directly to Link.
     const href = tool.sourceType === 'iframe' ? `/t/embed/${tool.id}` : tool.sourcePath;
     return (
        <Link href={href} className={styles.card}>
            {cardContent}
        </Link>
     );
  }
};

export default ToolCard;