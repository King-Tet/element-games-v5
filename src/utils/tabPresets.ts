// src/utils/tabPresets.ts

export interface TabPreset {
  key: string;
  name: string;
  title: string;
  iconUrl: string;
}

// --- Function to generate the dynamic title ---
/**
* Gets the current month name and year and formats them into a string
* for the Google Calendar title.
* @returns {string} The formatted string "Google Calendar - [Month] [Year]".
*/
function getCalendarTitle(): string {
// Create a new Date object to get the current date and time
const currentDate = new Date();

// Get the current year (four digits)
const currentYear = currentDate.getFullYear();

// Get the current month (0-indexed, so 0 for January, 11 for December)
const monthIndex = currentDate.getMonth();

// Array of month names for easy lookup
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Get the name of the current month using the index
const currentMonthName = monthNames[monthIndex];

// Construct the final string using a template literal
const outputString = `Google Calendar - ${currentMonthName} ${currentYear}`;

return outputString;
}

// Calculate the title dynamically *before* defining the presets array
const dynamicGoogleCalendarTitle = getCalendarTitle();
// --- End of dynamic title generation ---


export const TAB_PRESETS: TabPreset[] = [
  // Use the dynamically generated title for the 'default' preset
  { key: 'default', name: 'Google Calendar', title: dynamicGoogleCalendarTitle, iconUrl: '/preset-icons/google-calendar.ico' },
  { key: 'google', name: 'Google', title: 'Google', iconUrl: '/preset-icons/google.ico' },
  { key: 'google-docs', name: 'Google Docs', title: 'Google Docs - Untitled Document', iconUrl: '/preset-icons/google-docs.ico' },
  { key: 'google-drive', name: 'Google Drive', title: 'My Drive - Google Drive', iconUrl: '/preset-icons/google-drive.ico' },
  { key: 'classroom', name: 'Google Classroom', title: 'Home', iconUrl: '/preset-icons/google-classroom.ico' },
  { key: 'clever', name: 'Clever', title: 'Clever | Portal', iconUrl: '/preset-icons/clever.ico' },
  { key: 'ixl', name: 'IXL', title: 'IXL | Math, Language Arts, Science, Social Studies, and Spanish', iconUrl: '/preset-icons/ixl.ico' }
  // Add more presets
];

// Export the default preset separately for easy access
// This will now correctly reference the preset with the dynamic title calculated above
export const DEFAULT_PRESET = TAB_PRESETS.find(p => p.key === 'default') || TAB_PRESETS[0];