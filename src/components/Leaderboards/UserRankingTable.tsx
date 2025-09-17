// src/components/Leaderboards/UserRankingTable.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserProfileData } from '@/types/user';
import styles from './LeaderboardTable.module.css';
import { FiStar, FiClock, FiGrid } from 'react-icons/fi';
import { formatPlaytime, formatNumber } from '@/utils/calculations';

interface UserRankingTableProps {
    users: (UserProfileData & { userScore: number })[];
    maxItems?: number;
    searchedUser?: (UserProfileData & { rank: number; userScore: number }) | null;
}

const UserRankingTable: React.FC<UserRankingTableProps> = ({ users, maxItems = 100, searchedUser }) => {
    
    // Check if the searched user is already in the top list to avoid duplication
    const isSearchedUserInTopList = searchedUser && users.slice(0, maxItems).some(u => u.id === searchedUser.id);
    const displayedUsers = users.slice(0, maxItems);

    const getRankClass = (rankIndex: number) => {
        if (rankIndex === 0) return styles.rankGold;
        if (rankIndex === 1) return styles.rankSilver;
        if (rankIndex === 2) return styles.rankBronze;
        return '';
    };

    const renderUserRow = (user: UserProfileData & { userScore: number }, index: number, isSearched: boolean = false) => (
        <tr key={user.id} className={`${styles.tableRow} ${isSearched ? styles.searchedUserRow : ''}`}>
            <td className={`${styles.rankCol} ${getRankClass(index)}`}>
                {index + 1}
            </td>
            <td className={styles.itemCol}>
                <Link href={`/u/${user.username}`} className={styles.itemLink}>
                    <Image
                        src={user.avatar_url || '/logos/default-avatar.png'}
                        alt={user.username || 'User'}
                        width={36}
                        height={36}
                        className={styles.itemImage}
                        unoptimized
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logos/default-avatar.png'; }}
                    />
                    <div className={styles.itemNameWrapper}>
                        <span className={styles.itemName}>{user.display_name || user.username}</span>
                        {user.display_name && user.username && user.display_name !== user.username && (
                            <span className={styles.subStat}>@{user.username}</span>
                        )}
                    </div>
                </Link>
            </td>
            <td className={`${styles.statsCol} ${styles.hideOnMobile}`}>
                {formatPlaytime(user.total_playtime_seconds)}
            </td>
            <td className={`${styles.statsCol} ${styles.hideOnMobile}`}>{formatNumber(user.total_ratings_submitted)}</td>
            <td className={`${styles.statsCol} ${styles.hideOnMobile}`}>{formatNumber(user.total_games_played)}</td>
            <td className={`${styles.scoreCol} ${styles.scoreValue}`}>
                {user.userScore?.toFixed(0)}
            </td>
        </tr>
    );


    return (
         <div className={styles.tableContainer}>
            <table className={styles.leaderboardTable}>
                <thead>
                    <tr>
                        <th className={styles.rankCol}>#</th>
                        <th className={styles.itemCol}>User</th>
                        <th className={`${styles.statsCol} ${styles.hideOnMobile}`}><FiClock /> Playtime</th>
                        <th className={`${styles.statsCol} ${styles.hideOnMobile}`}><FiStar /> Ratings</th>
                        <th className={`${styles.statsCol} ${styles.hideOnMobile}`}><FiGrid /> Games</th>
                        <th className={`${styles.scoreCol} ${styles.scoreHeader}`}>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {displayedUsers.map((user, index) => renderUserRow(user, index, searchedUser?.id === user.id))}
                    {searchedUser && !isSearchedUserInTopList && (
                        <>
                            <tr className={styles.separatorRow}><td colSpan={6}>...</td></tr>
                             {renderUserRow(searchedUser, searchedUser.rank - 1, true)}
                        </>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default UserRankingTable;
