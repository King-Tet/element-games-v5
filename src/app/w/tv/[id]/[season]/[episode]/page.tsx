// app/w/tv/[id]/[season]/[episode]/page.tsx
'use client'; 

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Player from '@/components/w/Player';
import styles from './details.module.css';

interface TvShowInfo {
  id: number;
  name: string;
  poster_path: string | null;
}

export default function TvEpisodePlayerPage({
  params,
}: {
  params: { id: string; season: string; episode: string };
}) {
  const { id, season, episode } = params;
  const [show, setShow] = useState<TvShowInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tmdb/tv/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch show data');
        return res.json();
      })
      .then(data => {
        setShow({ id: data.id, name: data.name, poster_path: data.poster_path });
      })
      .catch(err => {
        console.error(err);
        setShow(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return <div className={styles.notFound}>Loading...</div>;
  }

  if (!show) {
    return <div className={styles.notFound}>TV Show not found.</div>;
  }

  const playerSrc = `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`;
  const playerTitle = `${show.name} - Season ${season} Episode ${episode}`;

  return (
    <div className={styles.pageContainer}>
        <main className={styles.mainContent} style={{ paddingTop: '5vh' }}>
            <div className={styles.playerSection}>
                <h1 className={styles.title}>{playerTitle}</h1>
                <Link href={`/w/tv/${id}`} className={styles.backLink} style={{display: 'inline-block', marginBottom: '2rem', color: '#ccc'}}>
                    &larr; Back to Episode List
                </Link>
                <Player 
                    src={playerSrc} 
                    title={playerTitle}
                />
            </div>
        </main>
    </div>
  );
}
