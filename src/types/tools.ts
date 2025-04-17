// src/types/tool.ts
export type ToolSourceType = 'component' | 'iframe' | 'external';

export interface Tool {
  id: string; // Unique identifier, used for URL slug/path
  name: string;
  description: string;
  iconUrl?: string; // Optional: Path to an icon image (e.g., /tool-icons/calculator.svg) or use React Icons
  iconName?: string; // Optional: Name of a react-icons icon (e.g., 'FiCalculator')
  category: string; // e.g., 'Utilities', 'AI', 'Development'
  sourceType: ToolSourceType;
  // sourcePath:
  // - for 'component': Next.js route path (e.g., '/t/calculator')
  // - for 'iframe': Path to the tool's index.html relative to /public (e.g., '/t/source/color-picker/index.html')
  // - for 'external': The full external URL (e.g., 'https://example-ai-tool.com')
  sourcePath: string;
  tags?: string[]; // Optional tags
}