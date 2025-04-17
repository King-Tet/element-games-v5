// src/types/index.ts

// --- Existing Types (Game, Tool) should be here ---
export interface Game {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    category: string;
    rating: number;
    visits: number;
    sourceUrl: string;
    tags?: string[];
  }
  
  export type ToolSourceType = 'component' | 'iframe' | 'external';
  
  export interface Tool {
    id: string;
    name: string;
    description: string;
    iconUrl?: string;
    iconName?: string;
    category: string;
    sourceType: ToolSourceType;
    sourcePath: string;
    tags?: string[];
  }
  // --- End Existing Types ---
  
  // New Combined Search Item Type
  export type SearchItemType = 'game' | 'tool';
  
  export interface SearchItem {
    id: string;
    name: string;
    type: SearchItemType;
    category: string;
    // Path for linking. For external tools, this is the external URL.
    linkPath: string;
    // Indicates if the linkPath is an external URL
    isExternal: boolean;
    // Raw data for potential future use (e.g., showing icons)
    rawData: Game | Tool;
  }