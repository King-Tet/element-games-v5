// src/app/feedback/page.tsx
import React from 'react';
import styles from './FeedbackPage.module.css';

// This can be a Server Component as it just renders static content + iframe
const FeedbackPage = () => {
  return (
    <div className={styles.feedbackContainer}>
      <h1 className={styles.pageTitle}>Feedback & Requests</h1>
      <p className={styles.description}>
        Use the form below to report a bug, request a new game, or suggest a feature.
        Please provide as much detail as possible!
      </p>

      <div className={styles.iframeWrapper}>
        <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLScBR9k6H8oORdoRbAoQ5sG9t53DgTM50nmFbf9lIlY_4dBdZA/viewform?embedded=true"
            // Use 100% width for responsiveness within the wrapper
            width="100%"
            // Height from Google Forms - adjust if needed, or make wrapper control height
            height="800"
            frameBorder="0" // Use frameBorder (camelCase) in React JSX
            marginHeight={0} // Use marginHeight (camelCase)
            marginWidth={0} // Use marginWidth (camelCase)
            className={styles.googleForm} // Add class for potential styling
            title="Feedback and Request Form" // Add title for accessibility
        >
            Loading… {/* Fallback text */}
        </iframe>
      </div>
    </div>
  );
};

export default FeedbackPage;