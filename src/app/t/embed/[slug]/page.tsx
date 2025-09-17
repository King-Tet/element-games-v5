// src/app/t/embed/[slug]/page.tsx
'use client'; // Needed for hooks and potential iframe interaction

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tool } from '@/types/tool';
import styles from './EmbedPage.module.css';
import toolData from '@/data/tools.json';
import { FiArrowLeft } from 'react-icons/fi';

// Helper function to find tool by slug (case-insensitive)
const findToolBySlug = (slug: string | undefined): Tool | undefined => {
    if (!slug) return undefined;
    const lowerCaseSlug = slug.toLowerCase();
    // Find only iframe tools matching the ID
    return toolData.find(tool => tool.id.toLowerCase() === lowerCaseSlug && tool.sourceType === 'iframe');
};


const ToolEmbedPage: React.FC = () => {
    const params = useParams();
    const slug = params.slug as string;
    const router = useRouter();
    const [tool, setTool] = useState<Tool | null | undefined>(undefined); // undefined = loading, null = not found

    useEffect(() => {
        const foundTool = findToolBySlug(slug);
        setTool(foundTool ?? null);
    }, [slug]);

    if (tool === undefined) {
        return <div className={styles.loadingContainer}>Loading tool...</div>;
    }

    if (tool === null) {
        return (
            <div className={styles.notFoundContainer}>
                <h2>Tool Not Found or Not Embeddable</h2>
                <p>Sorry, the tool you are looking for could not be embedded.</p>
                <button onClick={() => router.back()} className={styles.backButton} style={{marginTop: '20px', fontSize: '1.1rem'}}>
                    <FiArrowLeft /> Go Back
                </button>
            </div>
        );
    }

    // Tool found, render the iframe
    return (
        <div className={styles.embedContainer}>
             <div className={styles.header}>
                <h1>{tool.name}</h1>
                 <button onClick={() => router.back()} className={styles.backButton}>
                    <FiArrowLeft /> Back
                </button>
             </div>
            <div className={styles.iframeWrapper}>
                <iframe
                    src={tool.sourcePath}
                    className={styles.toolIframe}
                    title={tool.name}
                    // Add sandbox attributes if needed for security, but might break some tools
                    // sandbox="allow-scripts allow-same-origin"
                >
                    Your browser does not support iframes.
                </iframe>
            </div>
        </div>
    );
};

export default ToolEmbedPage;