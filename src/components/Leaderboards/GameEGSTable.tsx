// src/components/Leaderboards/GameEGSTable.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Game } from '@/types/game';
import styles from './LeaderboardTable.module.css';
import { FiStar, FiClock, FiEye } from 'react-icons/fi';
import { formatNumber, formatPlaytime } from '@/utils/calculations';

interface GameEGSTableProps {
    games: Game[];
    maxItems?: number;
}

const GameEGSTable: React.FC<GameEGSTableProps> = ({ games, maxItems = 10 }) => {
    
    const displayedGames = games.slice(0, maxItems);

    return (
        <div className={styles.tableContainer}>
            <table className={styles.leaderboardTable}>
                <thead>
                    <tr>
                        <th className={styles.rankCol}>Rank</th>
                        <th className={styles.itemCol}>Game</th>
                        <th className={`${styles.statsCol} ${styles.hideOnMobile}`}><FiStar /> Rating</th>
                        <th className={`${styles.statsCol} ${styles.hideOnMobile}`}><FiClock /> Playtime</th>
                        <th className={`${styles.statsCol} ${styles.hideOnMobile}`}><FiEye/> Visits</th>
                        <th className={`${styles.scoreCol} ${styles.scoreHeader}`}>EGS</th>
                    </tr>
                </thead>
                <tbody>
                    {displayedGames.map((game, index) => (
                        <tr key={game.id} className={styles.tableRow}>
                            <td className={`${styles.rankCol} ${index < 3 ? (index === 0 ? styles.rankGold : index === 1 ? styles.rankSilver : styles.rankBronze) : ''}`}>
                                {index + 1}
                            </td>
                            <td className={styles.itemCol}>
                                <Link href={`/g/play/${game.id}`} className={styles.itemLink}>
                                    <Image
                                        src={game.imageUrl || '/game-images/default-placeholder.png'}
                                        alt={game.name}
                                        width={40}
                                        height={30}
                                        className={styles.itemImage}
                                        unoptimized
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/game-images/default-placeholder.png'; }}
                                    />
                                    <span className={styles.itemName}>{game.name}</span>
                                </Link>
                            </td>
                            <td className={`${styles.statsCol} ${styles.hideOnMobile}`}>
                                {game.averageRating !== undefined ? game.averageRating.toFixed(1) : 'N/A'}
                                <span className={styles.subStat}> ({formatNumber(game.ratingCount)})</span>
                            </td>
                             <td className={`${styles.statsCol} ${styles.hideOnMobile}`}>
                                 {formatPlaytime(game.totalPlaytimeSeconds)}
                             </td>
                            <td className={`${styles.statsCol} ${styles.hideOnMobile}`}>{formatNumber(game.totalVisits)}</td>
                            <td className={`${styles.scoreCol} ${styles.scoreValue}`}>
                                {game.elementGamesScore}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GameEGSTable;
