// src/app/settings/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'; // No longer need useRef here
import styles from './SettingsPage.module.css'; // Ensure path is correct
// Import presets and default from the utility file
import { TAB_PRESETS, DEFAULT_PRESET, TabPreset } from '@/utils/tabPresets'; // Ensure path is correct
import { FiExternalLink } from 'react-icons/fi'; // Icon for the button

// Define default settings (used if localStorage is empty)
// These serve as fallbacks if nothing is found in localStorage
const DEFAULT_SETTINGS = {
  theme: 'dark',
  presetKey: DEFAULT_PRESET.key, // Use imported default preset key
  panicKey: '`', // Default panic key
  panicUrl: 'https://classroom.google.com', // Default panic redirect URL
};

// Logger for Settings Page (optional, set DEBUG_ENABLED to false to disable)
const logSettings = (message: string, ...optionalParams: any[]) => {
    const DEBUG_ENABLED = true; // Toggle logs
    if (DEBUG_ENABLED) console.log(`[SettingsPage] ${message}`, ...optionalParams);
};

const SettingsPage: React.FC = () => {
  // --- State Management ---
  // State holds the *currently selected* values in the UI, reflecting localStorage
  const [currentTheme, setCurrentTheme] = useState<string>(DEFAULT_SETTINGS.theme);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>(DEFAULT_SETTINGS.presetKey);
  const [panicKeyInput, setPanicKeyInput] = useState<string>(DEFAULT_SETTINGS.panicKey);
  const [panicUrl, setPanicUrl] = useState<string>(DEFAULT_SETTINGS.panicUrl);
  // No longer need faviconLinkRef here

  // --- Load settings from localStorage on initial component mount ---
  useEffect(() => {
    // Ensure running on client side before accessing localStorage
    if (typeof window !== 'undefined') {
      const loadedSettings = {
          theme: localStorage.getItem('settings:theme') || DEFAULT_SETTINGS.theme,
          presetKey: localStorage.getItem('settings:presetKey') || DEFAULT_SETTINGS.presetKey,
          panicKey: localStorage.getItem('settings:panicKey') || DEFAULT_SETTINGS.panicKey,
          panicUrl: localStorage.getItem('settings:panicUrl') || DEFAULT_SETTINGS.panicUrl,
      };
      logSettings("Loaded settings from localStorage:", loadedSettings);

      // Update state with loaded values to populate the UI correctly
      setCurrentTheme(loadedSettings.theme);
      setSelectedPresetKey(loadedSettings.presetKey)
      setPanicKeyInput(loadedSettings.panicKey);
      setPanicUrl(loadedSettings.panicUrl);

      // Apply initial theme visually (cloak is handled by MainLayout)
      applyTheme(loadedSettings.theme);
    }
  }, []); // Empty dependency array ensures this runs only once on mount


  // --- Theme Section Logic ---
  // Function to apply the theme class/attribute to the document
  const applyTheme = useCallback((theme: string) => {
    if (typeof window !== 'undefined') {
        logSettings("Applying theme:", theme);
        // Using data attribute on <html> is common practice
        document.documentElement.setAttribute('data-theme', theme);
    }
  }, []); // No dependencies needed

  // Handler for theme radio button changes
  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = event.target.value;
    logSettings("Theme changed to:", newTheme);
    setCurrentTheme(newTheme); // Update state
    localStorage.setItem('settings:theme', newTheme); // Persist to localStorage
    applyTheme(newTheme); // Apply the change visually
  };


  // --- Tab Cloaker Section Logic ---
   // Handler for preset dropdown changes - ONLY saves to localStorage now
  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newKey = event.target.value;
    logSettings("Preset changed to:", newKey);
    setSelectedPresetKey(newKey); // Update local state for the dropdown
    localStorage.setItem('settings:presetKey', newKey); // Persist the choice
    // MainLayout will apply this change on next navigation/reload
  };

  // Handler for resetting tab cloaker to default - ONLY saves to localStorage now
  const resetTabSettings = () => {
    const defaultKey = DEFAULT_PRESET.key;
    logSettings("Resetting tab settings to default key:", defaultKey);
    setSelectedPresetKey(defaultKey); // Update local state
    localStorage.setItem('settings:presetKey', defaultKey); // Persist default key
    // MainLayout will apply this change on next navigation/reload
    alert('Tab settings reset to default! Changes will apply fully on next navigation or reload.'); // User feedback
  };


  // --- Panic Button Section Logic ---
  // Handler for panic URL input changes
  const handlePanicUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.target.value;
    setPanicUrl(newUrl); // Update state
    localStorage.setItem('settings:panicUrl', newUrl); // Persist
  };

   // Handler for panic key input changes
   const handlePanicKeyInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const typedKey = event.target.value;
        setPanicKeyInput(typedKey); // Update state
        localStorage.setItem('settings:panicKey', typedKey); // Persist immediately
   };
   // Note: The actual panic key listener is global and defined in MainLayout.tsx


   // --- Cloaked Window Section Logic ---
   // Function to open the site in an about:blank window
   const openInAboutBlank = () => {
       logSettings("Attempting to open cloaked window...");
       try {
           // Ensure running on client side
           if (typeof window === 'undefined') return;

           const currentOrigin = window.location.origin;
           logSettings("Current origin:", currentOrigin);

           // Open a new blank window/tab
           const win = window.open('about:blank', '_blank');

           if (!win) {
               logSettings('Failed to open new window (pop-up blocker?).');
               alert('Failed to open new window. Please disable your pop-up blocker for this site.');
               return;
           }
            logSettings("New window opened.");

           // Inject the iframe
           win.document.body.style.margin = '0';
           win.document.body.style.height = '100vh';
           win.document.body.style.overflow = 'hidden';

           const iframe = win.document.createElement('iframe');
           iframe.style.border = 'none';
           iframe.style.width = '100%';
           iframe.style.height = '100%';
           iframe.style.margin = '0';
           iframe.style.display = 'block';
           iframe.src = currentOrigin; // Point to the site's root

           win.document.body.appendChild(iframe);
           logSettings("Iframe appended to new window body.");

            // Attempt to set the title based on current cloaker settings in localStorage
            const savedPresetKey = localStorage.getItem('settings:presetKey') || DEFAULT_PRESET.key;
            const preset = TAB_PRESETS.find(p => p.key === savedPresetKey) || DEFAULT_PRESET;
            let targetTitle = preset.title;
            if (preset.key === 'default') { // Regenerate dynamic title if needed
                 const currentDate = new Date(); const currentYear = currentDate.getFullYear(); const monthIndex = currentDate.getMonth();
                 const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                 targetTitle = `Google Calendar - ${monthNames[monthIndex]} ${currentYear}`;
            }
            win.document.title = targetTitle;
            logSettings(`Attempted to set new window title to: "${targetTitle}"`);

            // Attempt to set the favicon
            try {
                let link = win.document.createElement('link');
                // Use the preset's icon URL directly
                link.type = 'image/x-icon';
                link.rel = 'shortcut icon';
                link.href = preset.iconUrl; // Use icon from preset object
                win.document.head.appendChild(link);
                logSettings(`Attempted to set new window favicon to: "${preset.iconUrl}"`);
            } catch (iconError) {
                 console.error("[SettingsPage] Error setting favicon in new window:", iconError);
            }

       } catch (error) {
           console.error("[SettingsPage] Error opening cloaked window:", error);
           alert('An error occurred while trying to open the cloaked window.');
       }
   };


  // --- JSX Rendering ---
  return (
    <div className={styles.settingsContainer}>
      <h1>Site Settings</h1>

      {/* --- Theme Settings Section --- */}
      <section className={styles.settingsSection}>
        <h2>Theme</h2>
        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={currentTheme === 'dark'}
              onChange={handleThemeChange}
            />
            Dark Mode
          </label>
          <label>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={currentTheme === 'light'}
              onChange={handleThemeChange}
            />
            Light Mode
          </label>
        </div>
      </section>

      {/* --- Tab Cloaker Settings Section --- */}
      <section className={styles.settingsSection}>
        <h2>Tab Cloaker</h2>
        <p className={styles.description}>Choose a preset to change how the site appears in your browser tab.</p>
        <div className={styles.inputGroup}>
            <label htmlFor="tabPreset">Select Preset:</label>
            <select
              id="tabPreset"
              value={selectedPresetKey}
              onChange={handlePresetChange}
              className={styles.selectField} // Use select styling
            >
                {/* Map over the imported TAB_PRESETS array */}
                {TAB_PRESETS.map(preset => (
                    <option key={preset.key} value={preset.key}>
                        {preset.name}
                    </option>
                ))}
            </select>
        </div>
        <div className={styles.buttonGroup}>
             {/* Button to reset to the default preset */}
             <button onClick={resetTabSettings} className={styles.buttonSecondary}>Reset Tab to Default</button>
        </div>
         <small className={styles.inputHint} style={{marginTop: '10px'}}>
            Changes to title/icon apply fully after navigating or reloading the page.
        </small>
      </section>

       {/* --- Panic Button Settings Section --- */}
       <section className={styles.settingsSection}>
            <h2>Panic Button</h2>
            <p className={styles.description}>Press the specified key anywhere on the site to quickly redirect away.</p>
             <div className={styles.inputGroup}>
                <label htmlFor="panicKey">Panic Key:</label>
                <input
                    type="text"
                    id="panicKey"
                    value={panicKeyInput}
                    onChange={handlePanicKeyInputChange}
                    placeholder={DEFAULT_SETTINGS.panicKey}
                    className={styles.inputField}
                    maxLength={20} // Limit input length
                />
                 <small className={styles.inputHint}>
                    Enter the key name (e.g., 'Escape', 'Delete', 'Backquote', ']', 'a', '1'). Case-sensitive.
                 </small>
            </div>
             <div className={styles.inputGroup}>
                <label htmlFor="panicUrl">Panic Redirect URL:</label>
                <input
                    type="url" // Use type="url" for basic browser validation
                    id="panicUrl"
                    value={panicUrl}
                    onChange={handlePanicUrlChange}
                    placeholder={DEFAULT_SETTINGS.panicUrl}
                    className={styles.inputField}
                />
                 <small className={styles.inputHint}>
                    Enter the full URL (including http/https) or 'about:blank'.
                 </small>
            </div>
       </section>

       {/* --- Cloaked Window Section --- */}
        <section className={styles.settingsSection}>
            <h2>Cloaked Window</h2>
            <p className={styles.description}>Open the site in a new tab that appears as "about:blank" in the address bar. This can sometimes help bypass basic network restrictions.</p>
            <div className={styles.buttonGroup}>
                {/* Button to trigger the cloaked window function */}
                <button onClick={openInAboutBlank} className={styles.buttonPrimary}>
                    <FiExternalLink style={{ marginRight: '8px' }}/> Open Cloaked Window
                </button>
            </div>
             <small className={styles.inputHint} style={{marginTop: '10px'}}>
                Note: This may be blocked by pop-up blockers or more advanced filters. The tab title and icon will attempt to match your current cloaker preset.
            </small>
        </section>

      {/* --- Site Info & Credits Section --- */}
      <section className={styles.settingsSection}>
        <h2>About</h2>
        <p><strong>Site Name:</strong> Element Games v5</p>
        {/* Update version manually or implement dynamic reading later */}
        <p><strong>Version:</strong> 1.0.4 (Example)</p>
        <p><strong>Credits:</strong> Built with Next.js, React, and Firebase. Icons from preset sources. Thanks to open-source libraries, game developers, and contributors.</p>
        {/* Add more credits or links as needed */}
      </section>
    </div>
  );
};

export default SettingsPage;