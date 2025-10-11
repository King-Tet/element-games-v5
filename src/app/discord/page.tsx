// src/app/discord/page.tsx
import React from 'react';
import Image from 'next/image';
import styles from './DiscordPage.module.css';
import { LiaDiscord } from 'react-icons/lia';

// This is a server component, so no 'use client' is needed.
const DiscordPage = () => {
    // IMPORTANT: Replace this with your actual Discord invite link.
    const discordInviteLink = ' https://discord.gg/XUaXy5gEYN'; 

    return (
        <div className={styles.discordContainer}>
            <div className={styles.card}>
                <LiaDiscord className={styles.mainIcon} />
                <h1 className={styles.title}>Join the Community</h1>
                <p className={styles.description}>
                    Become a part of the Discord server to get updates, chat with others, suggest new games, and get more links if its ever blocked.
                </p>

                <div className={styles.qrContainer}>
                    <Image
                        // IMPORTANT: Make sure you add a 'discord-qr.png' file to your /public folder.
                        src="/discord-qr.png" 
                        alt="Discord Invite QR Code"
                        width={200}
                        height={200}
                        className={styles.qrCode}
                        unoptimized // QR codes are sharp and don't need optimization.
                    />
                    <p className={styles.qrInstruction}>Scan this QR code with your phone to join</p>
                </div>

                <div className={styles.linkContainer}>
                    <p className={styles.linkInstruction}>Or use the link below:</p>
                    <div className={styles.linkWrapper}>
                        <a href={discordInviteLink} target="_blank" rel="noopener noreferrer" className={styles.discordLink}>
                            {discordInviteLink}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscordPage;
