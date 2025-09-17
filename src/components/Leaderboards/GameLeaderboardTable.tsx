// src/components/Leaderboards/GameLeaderboardTable.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './LeaderboardTable.module.css';
import { GameLeaderboardEntry } from '@/types/leaderboard';
import { FiClock } from 'react-icons/fi';

interface GameLeaderboardTableProps {
    entries: GameLeaderboardEntry[];
    unit: 'number' | 'ms' | 'seconds' | 'minutes';
}

const formatScore = (score: number, unit: GameLeaderboardTableProps['unit']): string => {
    if (unit === 'number') {
        return score.toLocaleString();
    }
    
    // Handle time-based scores (stored in milliseconds)
    const totalMilliseconds = score;
    const minutes = Math.floor(totalMilliseconds / 60000);
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
    const milliseconds = totalMilliseconds % 1000;

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');
    const paddedMilliseconds = String(milliseconds).padStart(3, '0');

    return `${paddedMinutes}:${paddedSeconds}.${paddedMilliseconds}`;
};

const GameLeaderboardTable: React.FC<GameLeaderboardTableProps> = ({ entries, unit }) => {
    
    const getRankClass = (rank: number) => {
        if (rank === 1) return styles.rankGold;
        if (rank === 2) return styles.rankSilver;
        if (rank === 3) return styles.rankBronze;
        return '';
    };

    return (
        <div className={styles.tableContainer}>
            <table className={styles.leaderboardTable}>
                <thead>
                    <tr>
                        <th className={styles.rankCol}>#</th>
                        <th className={styles.itemCol}>User</th>
                        <th className={styles.statsCol}><FiClock /> Last Submitted</th>
                        <th className={`${styles.scoreCol} ${styles.scoreHeader}`}>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry) => (
                        <tr key={entry.userId} className={styles.tableRow}>
                            <td className={`${styles.rankCol} ${getRankClass(entry.rank)}`}>
                                {entry.rank}
                            </td>
                            <td className={styles.itemCol}>
                                <Link href={`/u/${entry.username}`} className={styles.itemLink}>
                                    <Image
                                        src={entry.avatarUrl || '/logos/default-avatar.png'}
                                        alt={entry.username || 'User'}
                                        width={36} height={36}
                                        className={styles.itemImage}
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/logos/default-avatar.png'; }}
                                    />
                                    <div className={styles.itemNameWrapper}>
                                        <span className={styles.itemName}>{entry.displayName || entry.username}</span>
                                        <span className={styles.subStat}>@{entry.username}</span>
                                    </div>
                                </Link>
                            </td>
                            <td className={styles.statsCol}>
                               {new Date(entry.lastPlayed).toLocaleDateString()}
                            </td>
                            <td className={`${styles.scoreCol} ${styles.scoreValue}`}>
                                {formatScore(entry.score, unit)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GameLeaderboardTable;

