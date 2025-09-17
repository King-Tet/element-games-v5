// src/app/admin/layout.tsx
'use client'; // Need hooks

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished, check authorization
    if (!loading) {
      // If no user logged in OR the logged-in user is NOT an admin
      if (!user || !isAdmin) {
        console.warn("[AdminLayout] Unauthorized access attempt. Redirecting to home.");
        router.replace('/'); // Redirect non-admins away
      } else {
         console.log("[AdminLayout] Admin access granted.");
      }
    }
  }, [user, isAdmin, loading, router]);

  // Render loading state or null while checking auth
  if (loading) {
    // Optional: Add a more specific loading indicator for admin area
    return <div>Loading Admin Area...</div>;
  }

  // If user is logged in AND is an admin, render the children (admin page content)
  // If check failed above, redirect already happened or is in progress.
  // We might briefly render children before redirect finishes, hence the null check below.
  return isAdmin && user ? <>{children}</> : null; // Render children only if authorized, otherwise null (or redirect message)
}