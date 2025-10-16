// src/components/Leaderboards/CurrentUserRankDisplay.tsx
import React from 'react';
import Image from 'next/image';
import { UserProfileData } from '@/types/user'; // Adjust path if needed
import styles from './LeaderboardTable.module.css'; // Reuse some table styles
import localStyles from './CurrentUserRankDisplay.module.css'; // Specific styles
import { formatPlaytime, formatNumber } from '@/utils/calculations'; // Adjust path
import { FiStar, FiClock, FiGrid } from 'react-icons/fi';

interface CurrentUserRankDisplayProps {
    userData: UserProfileData & { userScore: number }; // User data with score
    rank: number; // User's calculated rank
}

const CurrentUserRankDisplay: React.FC<CurrentUserRankDisplayProps> = ({ userData, rank }) => {
    return (
        <div className={localStyles.currentUserContainer}>
            <h3 className={localStyles.title}>Your Rank</h3>
            <div className={`${styles.tableRow} ${localStyles.highlightRow}`}> {/* Re-use table row style */}
                <span className={`${styles.rankCol} ${localStyles.rank}`}>
                    #{rank}
                </span>
                <span className={styles.itemCol}>
                     <div className={styles.itemLink} style={{cursor: 'default'}}>
                         <Image
                            src={userData.avatar_url || '/logos/default-avatar.png'}
                            alt={userData.username || 'User'}
                            width={32} height={32}
                            className={styles.itemImage} style={{ borderRadius: '50%' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/logos/default-avatar.png'; }}
                         />
                         <span className={styles.itemName}>
                            {userData.username || userData.display_name || 'You'}
                         </span>
                     </div>
                </span>
                 <span className={`${styles.statsCol} ${localStyles.statItem}`}>
                     <FiClock /> {formatPlaytime(userData.total_playtime_seconds)}
                 </span>
                 <span className={`${styles.statsCol} ${localStyles.statItem}`}>
                      <FiStar /> {formatNumber(userData.total_ratings_submitted)}
                 </span>
                 <span className={`${styles.statsCol} ${localStyles.statItem}`}>
                     <FiGrid /> {formatNumber(userData.total_games_played)}
                </span>
                <span className={`${styles.scoreCol} ${styles.scoreValue} ${localStyles.score}`}>
                    {userData.userScore?.toFixed(0)}
                </span>
            </div>
        </div>
    );
};

export default CurrentUserRankDisplay;