"use client";

import Link from 'next/link';
import Image from 'next/image';
import { UserProfile } from '@/types/user';
import styles from './ActivityFeed.module.css';
import StarRating from '@/components/ui/StarRating';

interface ActivityFeedProps {
  activity: Pick<UserProfile, 'recentlyPlayed' | 'recentlyRated'>;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activity }) => {
  return (
    <div className={styles.activityContainer}>
      <section>
        <h2 className={styles.title}>Recently Played</h2>
        <div className={styles.gameList}>
          {activity.recentlyPlayed.map((game) => (
            <Link href={`/g/play/${game.id}`} key={game.id} className={styles.gameCard}>
              <Image 
                src={game.bannerUrl || 'https://placehold.co/160x90/222/fff.png?text=Error'} 
                alt={game.title || 'Game banner'} 
                width={160} 
                height={90} 
                className={styles.gameBanner}
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/160x90/222/fff.png?text=Error'; }}
              />
              <span className={styles.gameTitle}>{game.title}</span>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className={styles.title}>Recently Rated</h2>
        <div className={styles.gameList}>
          {activity.recentlyRated.map((game) => (
            <Link href={`/g/play/${game.id}`} key={game.id} className={styles.gameCard}>
                <Image 
                    src={game.bannerUrl || 'https://placehold.co/160x90/222/fff.png?text=Error'} 
                    alt={game.title || 'Game banner'} 
                    width={160} 
                    height={90} 
                    className={styles.gameBanner}
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/160x90/222/fff.png?text=Error'; }}
                />
                <div className={styles.ratingInfo}>
                    <span className={styles.gameTitle}>{game.title}</span>
                    <StarRating rating={game.rating || null} readOnly />
                </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ActivityFeed;