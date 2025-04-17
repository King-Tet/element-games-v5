// src/app/t/page.tsx
'use client'; // Needed for client-side filtering

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ToolCard from '@/components/Tools/ToolCard';
import { Tool } from '@/types/tool';
import styles from './ToolsPage.module.css';
import toolData from '@/data/tools.json'; // Import the static data

const ToolsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');

  const allTools: Tool[] = toolData;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(allTools.map(tool => tool.category));
    return ['All', ...Array.from(uniqueCategories).sort()];
  }, [allTools]);

  const filteredTools = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') {
      return allTools;
    }
    return allTools.filter(
      (tool) => tool.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [allTools, selectedCategory]);

  return (
    <div className={styles.toolsContainer}>
      <div className={styles.header}>
         <h1>Tools</h1>
         {/* Add sorting or search here later if needed */}
      </div>

       {/* Category Filter Buttons */}
       <div className={styles.categoryFilter}>
          {categories.map(category => (
              <Link
                  key={category}
                  href={category === 'All' ? '/t' : `/t?category=${category.toLowerCase()}`}
                  passHref
                  scroll={false}
              >
                 <button
                    className={`${styles.categoryButton} ${
                        (selectedCategory === category.toLowerCase() || (category === 'All' && !selectedCategory))
                            ? styles.active
                            : ''
                        }`}
                    onClick={() => setSelectedCategory(category === 'All' ? null : category.toLowerCase())}
                  >
                      {category}
                  </button>
              </Link>
          ))}
       </div>

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className={styles.toolsGrid}>
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
         <p className={styles.noToolsMessage}>
            No tools found{selectedCategory ? ` in the "${selectedCategory}" category` : ''}.
        </p>
      )}
    </div>
  );
};

export default ToolsPage;