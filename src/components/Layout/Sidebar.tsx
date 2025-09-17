// src/components/Layout/Sidebar.tsx
"use client";

import React, { useState, useEffect } from "react"; // Import useState and useEffect
import Link from "next/link";
import Image from "next/image"; // Import Next Image
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import { FiHome, FiPlayCircle, FiTool, FiMessageSquare, FiShield, FiBarChart, FiFilm } from 'react-icons/fi';

// Logger for Sidebar
const logSidebar = (message: string, ...optionalParams: unknown[]) => {
  const DEBUG_ENABLED = true; // Keep true for debugging
  if (DEBUG_ENABLED) console.log(`[Sidebar] ${message}`, ...optionalParams);
};

interface SidebarProps {
  isOpen: boolean;
  isAdmin?: boolean; // Receive admin status as prop (optional is okay)
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, isAdmin }) => {
  // *** ADDED LOG AT START ***
  logSidebar(`Rendering. Received isAdmin prop: ${isAdmin}`);

  const pathname = usePathname();
  const [currentTheme, setCurrentTheme] = useState("dark"); // Default to dark

  useEffect(() => {
    // Function to get theme from the attribute
    const getTheme = () => {
      return document.documentElement.getAttribute("data-theme") || "dark";
    };

    // Set initial theme
    setCurrentTheme(getTheme());

    // Observe changes to the data-theme attribute on <html>
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-theme"
        ) {
          const newTheme = getTheme();
          logSidebar("Theme changed via attribute mutation:", newTheme);
          setCurrentTheme(newTheme);
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      logSidebar("Cleaning up theme observer.");
      observer.disconnect();
    };
  }, []); // Run only once on mount

  const logoSrc = currentTheme === 'light'
    ? '/logos/logo-v5-transparent-rb.png' // Path to light theme logo
    : '/logos/logo-v5-transparent-rw.png'; // Path to dark theme logo


  // Base navigation items
  const navItems = [
    { href: "/", icon: FiHome, label: "Home" },
    { href: "/g", icon: FiPlayCircle, label: "Games" },
    { href: "/t", icon: FiTool, label: "Tools" },
    { href: '/leaderboards', icon: FiBarChart, label: 'Leaderboards' },
    { href: "/feedback", icon: FiMessageSquare, label: "Feedback" },
    { href: "/w", icon: FiFilm, label: "Movies & TV" },
  ];

  // Conditionally add admin link based on the received prop
  logSidebar(
    `Checking isAdmin value (${isAdmin}) before adding Admin Panel link.`
  );
  if (isAdmin === true) {
    // Explicit check for true might be safer
    logSidebar("isAdmin is true, adding Admin Panel link.");
    navItems.push({ href: "/admin", icon: FiShield, label: "Admin Panel" });
  } else {
    logSidebar("isAdmin is not true, Admin Panel link NOT added.");
  }

  // Helper to determine if a main nav link is active
  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    // Handle cases like /admin being active only for /admin, not /admin/users etc.
    if (["/admin", "/feedback", "/settings", "/account"].includes(href)) {
      // Add other exact match paths here
      return pathname === href;
    }
    // For sections like /g or /t, check prefix
    return pathname.startsWith(href);
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? "" : styles.closed}`}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logoLink}>
          <Image
            src={logoSrc}
            alt="Logo v5"
            // Specify width/height for layout stability OR use fill/priority
            width={90} // Adjust width as needed
            height={40} // Adjust height based on logo aspect ratio
            className={styles.logoImage}
            priority // Prioritize loading the logo
          />
           {/* Optionally keep text hidden visually but available for screen readers when collapsed */}
        </Link>
      </div>
      <nav>
        {/* Main Navigation */}
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.navItem} ${
                  isActive(item.href) ? styles.active : ""
                }`}
              >
                <item.icon className={styles.navIcon} />
                <span className={styles.navText}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* AD: <div className={styles.adContainer}><AdPlaceholder size="Skyscraper" className={styles.sidebarAd} id="sidebar-ad-placeholder"/></div>*/}
    </aside>
  );
};

export default Sidebar;
