// src/app/p/page.tsx
'use client'; // Required for searchParams hook and client-side logic

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation'; // For the back button
import styles from './ProxyPage.module.css';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi'; // Icons

const ProxyPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the base URL of your proxy service from environment variables
  const proxyServiceBaseUrl = process.env.NEXT_PUBLIC_PROXY_SERVICE_URL;

  useEffect(() => {
    const targetUrlParam = searchParams.get('url');

    if (!proxyServiceBaseUrl) {
        console.error("Proxy service URL (NEXT_PUBLIC_PROXY_SERVICE_URL) is not defined in environment variables.");
        setError("Proxy service is not configured correctly.");
        return;
    }

    if (!targetUrlParam) {
      setError("No target URL provided. Please add '?url=...' to the address.");
      return;
    }

    // Basic URL validation (optional, but recommended)
    let formattedTargetUrl = targetUrlParam;
    if (!formattedTargetUrl.startsWith('http://') && !formattedTargetUrl.startsWith('https://')) {
        // Attempt to prepend https:// if no scheme is present
        formattedTargetUrl = 'https://' + formattedTargetUrl;
    }

    try {
      // Validate if it's a somewhat valid URL structure after formatting
      new URL(formattedTargetUrl);

      // Construct the final URL for the iframe SRC
      // IMPORTANT: Ensure the target URL is properly encoded for use within the proxy URL
      const encodedTargetUrl = encodeURIComponent(formattedTargetUrl);
      const fullProxyUrl = `${proxyServiceBaseUrl}${encodedTargetUrl}`;

      setIframeUrl(fullProxyUrl);
      setError(null); // Clear any previous errors

    } catch (e) {
      console.error("Invalid target URL provided:", targetUrlParam, e);
      setError(`Invalid URL format: "${targetUrlParam}"`);
      setIframeUrl(null);
    }

  }, [searchParams, proxyServiceBaseUrl]); // Re-run when searchParams or base URL changes

  // --- Render Logic ---

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FiAlertTriangle size={40} style={{ marginBottom: '20px', color: 'var(--danger-color)' }} />
        <h2>Proxy Error</h2>
        <p>{error}</p>
        <button onClick={() => router.back()} className={styles.backButton}>
           <FiArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  if (!iframeUrl) {
    // Show loading state or handle initial undefined state if needed
    // For simplicity, we can just show nothing until the URL is ready or an error occurs
    // Or add a dedicated loading indicator:
    // return <div className={styles.loadingContainer}>Loading Proxy...</div>;
     return null; // Render nothing initially
  }

  // Render the iframe with the constructed proxy URL
  return (
    <div className={styles.proxyContainer}>
      <iframe
        src={iframeUrl}
        className={styles.proxyIframe}
        title="Proxied Content"
        // Sandbox attribute: Start with minimal/none for proxy compatibility.
        // Proxies often need broad permissions. Add restrictions only if you know
        // the proxy service supports them and it enhances security without breaking functionality.
        // sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
        allow="fullscreen; clipboard-write;" // Allow fullscreen and potentially clipboard access
      />
    </div>
  );
};

export default ProxyPage;