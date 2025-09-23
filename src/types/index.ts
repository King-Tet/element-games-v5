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

// Type for user data used in search
export interface UserSearchInfo {
  uid: string;
  displayName: string;
  username: string;
}

// Base interface for all searchable items
interface SearchItemBase {
  id: string;
  name: string;
  linkPath: string;
  isExternal: boolean;
}

// Discriminated union for specific search item types
export type SearchItem =
  | (SearchItemBase & {
      type: 'game';
      category: string;
      rawData: Game;
    })
  | (SearchItemBase & {
      type: 'tool';
      category: string;
      rawData: Tool;
    })
  | (SearchItemBase & {
      type: 'user';
      rawData: UserSearchInfo;
      // Users don't have a category in the same way, can be empty or a default
      category?: string;
    });

// The SearchItemType can be inferred from the SearchItem union
export type SearchItemType = SearchItem['type'];
