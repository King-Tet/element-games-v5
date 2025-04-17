// src/app/settings/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './SettingsPage.module.css';
// Import from the new utility file
import { TAB_PRESETS, DEFAULT_PRESET, TabPreset } from '@/utlis/tabPresets';

// Define default settings (used if localStorage is empty)
const DEFAULT_SETTINGS = {
  theme: 'dark',
  presetKey: DEFAULT_PRESET.key, // Use imported default
  panicKey: 'Escape',
  panicUrl: 'https://google.com',
};

const SettingsPage: React.FC = () => {
    // --- State Management ---
    const [currentTheme, setCurrentTheme] = useState<string>(DEFAULT_SETTINGS.theme);
    const [selectedPresetKey, setSelectedPresetKey] = useState<string>(DEFAULT_SETTINGS.presetKey);
    const [panicKeyInput, setPanicKeyInput] = useState<string>(DEFAULT_SETTINGS.panicKey);
    const [panicUrl, setPanicUrl] = useState<string>(DEFAULT_SETTINGS.panicUrl);

    const faviconLinkRef = useRef<HTMLLinkElement | null>(null);

    // --- Load settings from localStorage on mount ---
    useEffect(() => {
        // ... (loading logic remains the same) ...
        const loadedSettings = {
            theme: localStorage.getItem('settings:theme') || DEFAULT_SETTINGS.theme,
            presetKey: localStorage.getItem('settings:presetKey') || DEFAULT_SETTINGS.presetKey,
            panicKey: localStorage.getItem('settings:panicKey') || DEFAULT_SETTINGS.panicKey,
            panicUrl: localStorage.getItem('settings:panicUrl') || DEFAULT_SETTINGS.panicUrl,
        };

        setCurrentTheme(loadedSettings.theme);
        setSelectedPresetKey(loadedSettings.presetKey)
        setPanicKeyInput(loadedSettings.panicKey);
        setPanicUrl(loadedSettings.panicUrl);

        // Apply initial theme & find favicon ref
        applyTheme(loadedSettings.theme);
        faviconLinkRef.current = document.querySelector("link[rel*='icon']");
        // Initial cloak is now handled by MainLayout's mount effect

    }, []); // Run only once on mount


    // --- Theme ---
    const applyTheme = useCallback((theme: string) => {
        if (typeof window !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }, []);

    const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newTheme = event.target.value;
        setCurrentTheme(newTheme);
        localStorage.setItem('settings:theme', newTheme);
        applyTheme(newTheme);
    };


    // --- Tab Cloaker (Handles Changes and Icon Updates) ---
     const applyTabCloak = useCallback((presetKey: string) => {
        const preset = TAB_PRESETS.find(p => p.key === presetKey) || DEFAULT_PRESET;
        requestAnimationFrame(() => {
            document.title = preset.title; // Still set title here when changed in settings

            // Robust Favicon Update Logic
            let currentFavicon = faviconLinkRef.current;
            if (!currentFavicon) {
                 currentFavicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
            }
            // Create if absolutely necessary
            if (!currentFavicon) {
                currentFavicon = document.createElement('link');
                currentFavicon.rel = 'icon';
                document.head.appendChild(currentFavicon);
            }
             // Ensure we have a valid favicon element before setting href
            if (currentFavicon) {
                currentFavicon.href = preset.iconUrl;
                faviconLinkRef.current = currentFavicon; // Update ref just in case it was created
            } else {
                console.error("Could not find or create favicon link element.");
            }
        });
    }, []); // Dependency on DEFAULT_PRESET if used directly

    const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newKey = event.target.value;
        setSelectedPresetKey(newKey);
        localStorage.setItem('settings:presetKey', newKey);
        applyTabCloak(newKey); // Apply immediately on change
    };

    const resetTabSettings = () => {
        const defaultKey = DEFAULT_PRESET.key;
        setSelectedPresetKey(defaultKey);
        localStorage.setItem('settings:presetKey', defaultKey);
        applyTabCloak(defaultKey);
        alert('Tab settings reset to default!');
    };


    // --- Panic Button (Setup Only) ---
    // ... (panic key/url input handlers remain the same) ...
     const handlePanicUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = event.target.value;
        setPanicUrl(newUrl);
        localStorage.setItem('settings:panicUrl', newUrl);
    };
    const handlePanicKeyInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const typedKey = event.target.value;
        setPanicKeyInput(typedKey);
        localStorage.setItem('settings:panicKey', typedKey);
    };


    // --- JSX (render function) ---
    return (
        <div className={styles.settingsContainer}>
             {/* ... (Theme, Tab Cloaker, Panic Button, About sections as before) ... */}
             <h1>Site Settings</h1>

            {/* Theme Settings */}
            <section className={styles.settingsSection}>
                {/* ... theme radio buttons ... */}
                 <h2>Theme</h2>
                <div className={styles.radioGroup}>
                <label>
                    <input type="radio" name="theme" value="dark" checked={currentTheme === 'dark'} onChange={handleThemeChange}/> Dark Mode
                </label>
                <label>
                    <input type="radio" name="theme" value="light" checked={currentTheme === 'light'} onChange={handleThemeChange}/> Light Mode
                </label>
                </div>
            </section>

            {/* Tab Cloaker Settings */}
            <section className={styles.settingsSection}>
                {/* ... tab preset select and reset button ... */}
                 <h2>Tab Cloaker</h2>
                <p className={styles.description}>Choose a preset to change how the site appears in your browser tab.</p>
                <div className={styles.inputGroup}>
                    <label htmlFor="tabPreset">Select Preset:</label>
                    <select id="tabPreset" value={selectedPresetKey} onChange={handlePresetChange} className={styles.selectField}>
                        {TAB_PRESETS.map(preset => (<option key={preset.key} value={preset.key}>{preset.name}</option>))}
                    </select>
                </div>
                <div className={styles.buttonGroup}>
                    <button onClick={resetTabSettings} className={styles.buttonSecondary}>Reset Tab to Default</button>
                </div>
            </section>

             {/* Panic Button Settings */}
             <section className={styles.settingsSection}>
                 {/* ... panic key/url inputs ... */}
                  <h2>Panic Button</h2>
                <p className={styles.description}>Press the specified key anywhere on the site to quickly redirect away.</p>
                <div className={styles.inputGroup}>
                    <label htmlFor="panicKey">Panic Key:</label>
                    <input type="text" id="panicKey" value={panicKeyInput} onChange={handlePanicKeyInputChange} placeholder={DEFAULT_SETTINGS.panicKey} className={styles.inputField} maxLength={20}/>
                    <small className={styles.inputHint}>Enter the key name (e.g., 'Escape', 'Delete', 'Backquote', ']', 'a', '1'). Case-sensitive.</small>
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="panicUrl">Panic Redirect URL:</label>
                    <input type="url" id="panicUrl" value={panicUrl} onChange={handlePanicUrlChange} placeholder={DEFAULT_SETTINGS.panicUrl} className={styles.inputField}/>
                    <small className={styles.inputHint}>Enter the full URL (including http/https) or 'about:blank'.</small>
                </div>
             </section>

             {/* Site Info & Credits */}
            <section className={styles.settingsSection}>
                {/* ... site info ... */}
                 <h2>About</h2>
                <p><strong>Site Name:</strong> Element Games v5</p>
                <p><strong>Version:</strong> 1.0.1 (Example)</p>
                <p><strong>Credits:</strong> Built with Next.js, React, and Firebase. Icons from preset sources. Thanks to open-source libraries and game developers.</p>
            </section>

        </div>
    );
};

export default SettingsPage;