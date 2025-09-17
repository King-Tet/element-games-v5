// app/w/layout.tsx
'use client'; // This must be a client component to use hooks

import { useEffect } from 'react';
import { usePathname } from 'next/navigation'; // Import usePathname

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get the current path
  // The name of the theme class from your globals.css file
  const themeClassName = 'stream';

  // This hook manages the theme class on the <body> tag.
  useEffect(() => {
    // When this layout mounts (i.e., when a user enters any page in the /w section),
    // we add our theme class to the body.
    document.body.classList.add(themeClassName);

    // --- NEW: Alert Logic ---
    // Check if the current path is for a specific movie or TV show page.
    if (pathname.startsWith('/w/movie/') || pathname.startsWith('/w/tv/')) {
      alert(
        "Note: The service used for playing video content may open tabs as advertisements. If this happens to you just close the tab and continue watching."
      );
    }
    // --- End of New Logic ---

    // When the layout unmounts (when the user navigates away from the /w section),
    // the cleanup function runs, removing the theme class. This is crucial for
    // restoring your site's default theme.
    return () => {
      document.body.classList.remove(themeClassName);
    };
    // Add pathname as a dependency so this effect re-runs on navigation within the /w section.
  }, [pathname]); 

  // This layout no longer needs to render its own wrapper div.
  // It just renders the page content that it contains.
  return <>{children}</>;
}
