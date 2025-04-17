// src/components/Layout/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation'; // Hook to check current route/params
import styles from './Sidebar.module.css';
// Added FiGlobe for Proxy link
import { FiHome, FiPlayCircle, FiTool, FiGrid, FiGlobe } from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const pathname = usePathname(); // Get current path
  const searchParams = useSearchParams(); // Get query params
  const currentCategory = searchParams.get('category'); // Get the category param

  const navItems = [
    { href: '/', icon: FiHome, label: 'Home' },
    { href: '/g', icon: FiPlayCircle, label: 'Games' },
    { href: '/t', icon: FiTool, label: 'Tools' },
    // Added Proxy Link
    { href: '/p', icon: FiGlobe, label: 'Proxy' },
  ];

  // Example categories (consider fetching dynamically later)
  const gameCategories = [
    { key: 'action', label: 'Action' },
    { key: 'puzzle', label: 'Puzzle' },
    { key: 'sports', label: 'Sports' },
    { key: 'arcade', label: 'Arcade' },
    { key: 'idle', label: 'Idle' },
  ];

  const isActive = (href: string): boolean => {
     // Handle exact matches first (like /, /g, /t, /p)
    if (href !== '/' && pathname.startsWith(href)) {
      return true;
    }
    return pathname === href;
  };

  const isCategoryActive = (categoryKey: string): boolean => {
    return pathname === '/g' && currentCategory === categoryKey;
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? '' : styles.closed}`}>
      <nav>
        {/* Main Navigation */}
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.href}>
              {/* REMOVED legacyBehavior and child <a> */}
              <Link
                href={item.href}
                className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
              >
                <item.icon className={styles.navIcon} />
                <span className={styles.navText}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Example: Game Categories Section */}
        <div className={styles.sectionTitle}>
             <span className={styles.navText}>Categories</span>
        </div>
         <ul className={styles.navList} style={{marginTop: '0px'}}>
            {gameCategories.map((category) => (
                <li key={category.key}>
                    {/* REMOVED legacyBehavior and child <a> */}
                    <Link
                        href={`/g?category=${category.key}`}
                        scroll={false} // Prevent scroll jump
                        className={`${styles.navItem} ${isCategoryActive(category.key) ? styles.active : ''}`}
                     >
                        <FiGrid className={styles.navIcon} /> {/* Use a generic icon */}
                        <span className={styles.navText}>{category.label}</span>
                    </Link>
                </li>
            ))}
        </ul>

        {/* Add more sections like Pinned Tools here */}

      </nav>
    </aside>
  );
};

export default Sidebar;