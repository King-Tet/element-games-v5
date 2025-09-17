// src/components/Leaderboards/CurrentUserRankDisplay.tsx
import React from 'react';
import Image from 'next/image';
import { UserProfileData } from '@/types/user'; // Adjust path if needed
import styles from './LeaderboardTable.module.css'; // Reuse some table styles
import localStyles from './CurrentUserRankDisplay.module.css'; // Specific styles
import { formatPlaytime, formatNumber } from '@/utils/calculations'; // Adjust path
import { FiUser, FiStar, FiClock, FiGrid } from 'react-icons/fi';

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
                            src={userData.photoURL || '/logos/defualt-avatar.png'}
                            alt={userData.username || 'User'}
                            width={32} height={32}
                            className={styles.itemImage} style={{ borderRadius: '50%' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/logos/defualt-avatar'; }}
                         />
                         <span className={styles.itemName}>
                            {userData.username || userData.displayName || 'You'}
                         </span>
                     </div>
                </span>
                 <span className={`${styles.statsCol} ${localStyles.statItem}`}>
                     <FiClock /> {formatPlaytime(userData.totalPlaytimeSeconds)}
                 </span>
                 <span className={`${styles.statsCol} ${localStyles.statItem}`}>
                      <FiStar /> {formatNumber(userData.totalRatingsSubmitted)}
                 </span>
                 <span className={`${styles.statsCol} ${localStyles.statItem}`}>
                     <FiGrid /> {formatNumber(userData.totalGamesPlayed)}
                </span>
                <span className={`${styles.scoreCol} ${styles.scoreValue} ${localStyles.score}`}>
                    {userData.userScore?.toFixed(0)}
                </span>
            </div>
        </div>
    );
};

export default CurrentUserRankDisplay;