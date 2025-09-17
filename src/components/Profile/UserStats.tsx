import { UserProfile } from '@/types/user';
import styles from './UserStats.module.css';

interface UserStatsProps {
  stats: Pick<UserProfile, 'rank' | 'score' | 'totalPlaytime' | 'gamesPlayed' | 'ratingsSubmitted'>;
}

const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  return (
    <div className={styles.statsContainer}>
      <h2 className={styles.title}>Statistics</h2>
      <div className={styles.statItem}>
        <span className={styles.label}>Rank</span>
        {/* Handle the case where a user might be unranked */}
        <span className={styles.value}>{stats.rank ? `#${stats.rank}` : 'Unranked'}</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.label}>Score</span>
        <span className={styles.value}>{(stats.score || 0).toLocaleString()}</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.label}>Total Playtime</span>
        <span className={styles.value}>{stats.totalPlaytime || '0m'}</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.label}>Games Played</span>
        <span className={styles.value}>{stats.gamesPlayed || 0}</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.label}>Ratings Submitted</span>
        <span className={styles.value}>{stats.ratingsSubmitted || 0}</span>
      </div>
    </div>
  );
};

export default UserStats;
