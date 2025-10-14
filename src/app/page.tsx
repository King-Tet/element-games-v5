// src/app/page.tsx
import React from 'react';
import Link from 'next/link';
import { Tool } from '@/types/tools';
import styles from './HomePage.module.css';
import GameCard from '@/components/Games/GameCard';
import toolData from '@/data/tools.json';
import { getNewGames, getTrendingGames } from '@/lib/supabase/db';
import RecentlyPlayedSection from '@/components/Home/RecentlyPlayedSection'; // Import the new component

const ToolIconLink: React.FC<{ tool: Tool }> = ({ tool }) => {
  const href = tool.sourceType === 'iframe' ? `/t/embed/${tool.id}` : tool.sourcePath;
  return (
    <Link href={href} target={tool.sourceType === 'external' ? '_blank' : '_self'} className={styles.toolLink} title={tool.name}>
      <div className={styles.toolIconWrapper}><span>{tool.name.substring(0, 1)}</span></div>
      <span className={styles.toolName}>{tool.name}</span>
    </Link>
  );
};

// Make the component async to fetch data on the server
const HomePage = async () => {
  // Fetch static game lists directly on the server
  const [trendingGames, newGames] = await Promise.all([
    getTrendingGames(6),
    getNewGames(6)
  ]);

  const featuredTools = toolData.slice(0, 4);

  return (
    <div className={styles.homeContainer}>
      {/* The "Recently Played" section is now a self-contained client component */}
      <RecentlyPlayedSection />

      {/* The rest of the page is rendered on the server with pre-fetched data */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Trending Games</h2>
        {trendingGames.length > 0 ? (
          <>
            <div className={styles.gameGrid}>
              {trendingGames.map((game, index) => (
                <GameCard key={`trending-${game.id}`} game={game} priority={index < 6} />
              ))}
            </div>
            <Link href="/g" className={`${styles.viewAllLink}`}>
              View All Games →
            </Link>
          </>
        ) : (
          <p className={styles.loadingText}>Could not load trending games.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>New Games</h2>
        {newGames.length > 0 ? (
          <>
            <div className={styles.gameGrid}>
              {newGames.map((game, index) => (
                <GameCard key={`new-${game.id}`} game={game} priority={index < 6} />
              ))}
            </div>
            <Link href="/g" className={`${styles.viewAllLink}`}>
              View All Games →
            </Link>
          </>
        ) : (
           <p className={styles.loadingText}>Could not load new games.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Featured Tools</h2>
        <div className={styles.toolsGrid}>
          {featuredTools.map((tool) => (
            <ToolIconLink
              key={`tool-${tool.id}`}
              tool={{ ...tool, sourceType: tool.sourceType as Tool["sourceType"] }}
            />
          ))}
        </div>
        <Link href="/t" className={`${styles.viewAllLink}`}>
          View All Tools →
        </Link>
      </section>
    </div>
  );
};

export default HomePage;