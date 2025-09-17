// src/app/p/page.tsx
'use client'; // Keep client for potential future re-enablement

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProxyPage.module.css'; // Keep styles for layout
import { FiInfo, FiArrowLeft } from 'react-icons/fi';

const ProxyPageDisabled: React.FC = () => {
  const router = useRouter();

  return (
    // Use existing error container style for similar layout
    <div className={styles.errorContainer} style={{minHeight: '60vh'}}>
        <FiInfo size={40} style={{ marginBottom: '20px', color: 'var(--text-sec-col)' }} />
        <h2>𝗣𝗿𝗼𝘅𝘆 𝗗𝗶𝘀𝗮𝗯𝗹𝗲𝗱</h2>
        <p>The web 𝗽𝗿𝗼𝘅𝘆 feature is temporarily disabled.</p>
        <button onClick={() => router.back()} className={styles.backButton} style={{marginTop: '20px'}}>
           <FiArrowLeft /> Go Back
        </button>
        {/* Or link directly home */}
        {/* <Link href="/" passHref>
             <button className={styles.backButton} style={{marginTop: '20px'}}>
                <FiHome /> Go Home
             </button>
         </Link> */}
    </div>
  );
};

export default ProxyPageDisabled;

// --- Original Proxy Page Code (Commented Out) ---
/*
import { useSearchParams } from 'next/navigation';
// ... other imports

const ProxyPage: React.FC = () => {
  // ... original useEffect and state logic ...
  const proxyServiceBaseUrl = process.env.NEXT_PUBLIC_PROXY_SERVICE_URL;
  // ... useEffect logic ...

  if (error) { return ( <div className={styles.errorContainer}> ... </div> ); }
  if (!iframeUrl) { return null; }

  return (
    <div className={styles.proxyContainer}>
      <iframe
        src={iframeUrl}
        className={styles.proxyIframe}
        title="Proxied Content"
        // ... sandbox/allow attributes ...
      />
    </div>
  );
};
export default ProxyPage;
*/