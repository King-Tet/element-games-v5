// src/utils/tabPresets.ts

export interface TabPreset {
    key: string;
    name: string;
    title: string;
    iconUrl: string;
  }
  
  export const TAB_PRESETS: TabPreset[] = [
    { key: 'default', name: 'Default (Element Games)', title: 'Element Games v5', iconUrl: '/favicon.ico' },
    { key: 'google', name: 'Google', title: 'Google', iconUrl: '/preset-icons/google.ico' },
    { key: 'google-docs', name: 'Google Docs', title: 'Google Docs', iconUrl: '/preset-icons/google-docs.ico' },
    { key: 'google-drive', name: 'Google Drive', title: 'My Drive - Google Drive', iconUrl: '/preset-icons/google-drive.ico' },
    { key: 'classroom', name: 'Google Classroom', title: 'Home', iconUrl: '/preset-icons/google-classroom.ico' },
    { key: 'clever', name: 'Clever', title: 'Clever | Portal', iconUrl: '/preset-icons/clever.ico' },
    { key: 'ixl', name: 'IXL', title: 'IXL | Math, Language Arts, Science, Social Studies, and Spanish', iconUrl: '/preset-icons/ixl.ico' },
    { key: 'canvas', name: 'Canvas', title: 'Dashboard', iconUrl: '/preset-icons/canvas.ico'},
    // Add more presets
  ];
  
  // Export the default preset separately for easy access
  export const DEFAULT_PRESET = TAB_PRESETS.find(p => p.key === 'default') || TAB_PRESETS[0];