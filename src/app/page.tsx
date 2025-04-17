// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Game } from '@/types/game';
import { Tool } from '@/types/tool';
import styles from './HomePage.module.css';
import { getTrendingGames, getUserRecentlyPlayed, RecentlyPlayedInfo } from '@/lib/firebase/firestore';
import toolData from '@/data/tools.json';

// Simple Game Card for Home Page
const HomePageGameCard: React.FC<{ game: Game }> = ({ game }) => (
    <Link href={`/g/play/${game.id}`} className={styles.gameCard}>
        <img src={game.imageUrl || '/game-images/default-placeholder.png'} alt={game.name} className={styles.gameCardImage} loading="lazy" />
        <div className={styles.gameCardTitle}>{game.name}</div>
    </Link>
);

// Simple Tool Icon for Home Page
const ToolIconLink: React.FC<{ tool: Tool }> = ({ tool }) => {
     const href = tool.sourceType === 'external' ? tool.sourcePath :
                  tool.sourceType === 'iframe' ? `/t/embed/${tool.id}` :
                  tool.sourcePath;
     const target = tool.sourceType === 'external' ? '_blank' : '_self';
     const Icon = () => <span className={styles.toolIconPlaceholder}>{tool.name.substring(0, 1)}</span>;
     return (
        <Link href={href} target={target} className={styles.toolLink} title={tool.name}>
            <div className={styles.toolIconWrapper}><Icon /></div>
            <span className={styles.toolName}>{tool.name}</span>
        </Link>
    );
}

const HomePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trendingGames, setTrendingGames] = useState<Game[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<(Game & RecentlyPlayedInfo)[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [proxyUrlInput, setProxyUrlInput] = useState('');

  const featuredTools = toolData.slice(0, 4);

  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoadingTrending(true);
      const games = await getTrendingGames(6);
      setTrendingGames(games);
      setIsLoadingTrending(false);
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    const fetchRecent = async () => {
      if (user) {
        setIsLoadingRecent(true);
        const games = await getUserRecentlyPlayed(user.uid, 6);
        setRecentlyPlayed(games);
        setIsLoadingRecent(false);
      } else {
        setRecentlyPlayed([]);
        setIsLoadingRecent(false);
      }
    };
    if (!authLoading) { fetchRecent(); }
  }, [user, authLoading]);

  const handleProxySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proxyUrlInput.trim()) return;
    let urlToProxy = proxyUrlInput.trim();
    if (!urlToProxy.startsWith('http://') && !urlToProxy.startsWith('https://')) {
        urlToProxy = 'https://' + urlToProxy;
    }
    try {
        new URL(urlToProxy);
        router.push(`/p?url=${encodeURIComponent(urlToProxy)}`);
    } catch (err) {
        alert("Please enter a valid URL");
    }
  };

  return (
    <div className={styles.homeContainer}>

      {/* Recently Played Section */}
      {!authLoading && user && recentlyPlayed.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recently Played</h2>
          {isLoadingRecent ? <p>Loading recently played...</p> : (
            <div className={styles.gameGrid}>
              {recentlyPlayed.map(game => <HomePageGameCard key={`recent-${game.id}`} game={game} />)}
            </div>
          )}
        </section>
      )}

      {/* Trending Games Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Trending Games</h2>
        {isLoadingTrending ? <p>Loading trending games...</p> : (
            trendingGames.length > 0 ? (
                <> {/* Use Fragment */}
                    <div className={styles.gameGrid}>
                        {trendingGames.map(game => <HomePageGameCard key={`trending-${game.id}`} game={game} />)}
                    </div>
                    {/* ADDED VIEW ALL LINK HERE */}
                    <Link href="/g" className={`${styles.viewAllLink} ${styles.viewAllGames}`}>View All Games →</Link>
                </>
            ) : (
                <p>No trending games found.</p>
            )
        )}
      </section>

       {/* Proxy Section */}
       <section className={`${styles.section} ${styles.proxySection}`}>
           <h2 className={styles.sectionTitle}>Web Proxy</h2>
           <p className={styles.proxyDescription}>Enter a URL to browse securely and bypass blocks.</p>
           <form onSubmit={handleProxySubmit} className={styles.proxyForm}>
               <input type="text" value={proxyUrlInput} onChange={(e) => setProxyUrlInput(e.target.value)} placeholder="Enter URL (e.g., google.com)" className={styles.proxyInput} aria-label="URL to proxy"/>
               <button type="submit" className={styles.proxyButton}>Go</button>
           </form>
       </section>

        {/* Tools Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Featured Tools</h2>
        {featuredTools.length > 0 ? (
           <div className={styles.toolsGrid}>
               {featuredTools.map(tool => <ToolIconLink key={`tool-${tool.id}`} tool={tool} />)}
           </div>
        ) : <p>No tools available.</p>}
        <Link href="/t" className={`${styles.viewAllLink} ${styles.viewAllTools}`}>View All Tools →</Link>
      </section>
    </div>
  );
};

export default HomePage;