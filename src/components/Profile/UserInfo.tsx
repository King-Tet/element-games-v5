// src/components/Profile/UserInfo.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/types/user'; // Use the comprehensive UserProfile type
import styles from './UserInfo.module.css';
import { getGameById } from '@/lib/supabase/db';
import { supabase } from '@/lib/supabase/client';

interface UserInfoProps {
  user: UserProfile; // Update prop type
}

interface ActivityState {
  type: 'game' | 'activity';
  name: string;
}

interface PresenceState {
  isOnline: boolean;
  activity?: ActivityState | null;
}

const UserInfo: React.FC<UserInfoProps> = ({ user }) => {
  const [presence, setPresence] = useState<PresenceState | null>(null);
  const [statusDetail, setStatusDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!user.uid) return;

    const channel = supabase.channel('online-users');

    const updatePresence = () => {
        const presenceState = channel.presenceState<any>();
        const userPresence = presenceState[user.uid];

        if (userPresence && userPresence.length > 0) {
            const statusData = userPresence[0];
            setPresence({
                isOnline: true,
                activity: statusData.activity || null,
            });
        } else {
            setPresence({ isOnline: false });
        }
    };

    channel
        .on('presence', { event: 'sync' }, updatePresence)
        .on('presence', { event: 'join' }, updatePresence)
        .on('presence', { event: 'leave' }, updatePresence)
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                updatePresence();
            }
        });

    return () => {
        supabase.removeChannel(channel);
    };
  }, [user.uid]);

  useEffect(() => {
    const updateStatusDetail = async () => {
      if (presence?.activity) {
        if (presence.activity.type === 'game') {
          const gameData = await getGameById(presence.activity.name);
          setStatusDetail(gameData ? `Playing ${gameData.name}` : null);
        } else if (presence.activity.type === 'activity') {
          setStatusDetail(presence.activity.name);
        } else {
          setStatusDetail(null);
        }
      } else {
        setStatusDetail(null);
      }
    };

    updateStatusDetail();
  }, [presence?.activity]);

  const isOnline = presence?.isOnline ?? false;
  const statusText = isOnline
    ? `Online${statusDetail ? ` - ${statusDetail}` : ''}`
    : 'Offline';

  return (
    <div className={styles.userInfoContainer}>
      <div className={styles.avatarContainer}>
        <Image
          src={user.avatar || 'https://placehold.co/150x150/333/fff.png?text=?'}
          alt={`${user.displayName}'s avatar`}
          width={150}
          height={150}
          className={styles.avatar}
          priority
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/150x150/333/fff.png?text=?';
          }}
        />
        <span className={`${styles.statusIndicator} ${isOnline ? styles.online : styles.offline}`} title={statusText} />
      </div>
      <div className={styles.userDetails}>
        <h1 className={styles.displayName}>{user.displayName}</h1>
        <p className={styles.username}>@{user.username}</p>
        <div className={styles.status}>{statusText}</div>
        <p className={styles.memberSince}>
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default UserInfo;