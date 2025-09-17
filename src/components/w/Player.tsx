// components/w/Player.tsx
'use client'; 

import styles from './Player.module.css';

interface PlayerProps {
  src: string;
  title: string;
}

const Player = ({ src, title }: PlayerProps) => {
  return (
    <div className={styles.playerContainer}>
      <iframe
        src={src}
        title={title}
        className={styles.playerIframe}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default Player;