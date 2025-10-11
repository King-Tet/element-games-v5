// src/components/Profile/UserInfo.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/types/user';
import styles from './UserInfo.module.css';
import { getGameById } from '@/lib/supabase/db';
import { supabase } from '@/lib/supabase/client';

interface UserInfoProps {
  user: UserProfile;
}

// Interfaces for better type-safety with presence data
interface ActivityState {
  type: 'game' | 'activity';
  name: string;
}

interface PresencePayload {
    username?: string | null;
    display_name?: string | null;
    activity?: ActivityState | null;
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

    // Handles the initial state of the channel
    const handleSync = () => {
      const presenceState = channel.presenceState<PresencePayload>();
      const userPresence = presenceState[user.uid];
      if (userPresence && userPresence.length > 0) {
        setPresence({ isOnline: true, activity: userPresence[0]?.activity });
      } else {
        setPresence({ isOnline: false, activity: null });
      }
    };

    // Handles when a new user joins
    const handleJoin = ({ key, newPresences }: { key: string; newPresences: PresencePayload[] }) => {
      if (key === user.uid) {
        setPresence({ isOnline: true, activity: newPresences[0]?.activity });
      }
    };

    // Handles when a user leaves
    const handleLeave = ({ key }: { key: string; leftPresences: PresencePayload[] }) => {
      if (key === user.uid) {
        setPresence({ isOnline: false, activity: null });
      }
    };

    channel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, handleJoin)
      .on('presence', { event: 'leave' }, handleLeave)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.uid]);


  useEffect(() => {
    const updateStatusDetail = async () => {
      if (presence?.activity) {
        if (presence.activity.type === 'game') {
          const gameData = await getGameById(presence.activity.name);
          setStatusDetail(gameData ? `Playing ${gameData.name}` : 'Playing a game');
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