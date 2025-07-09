// --- src/contexts/ThemeContext.js ---
// Replace the entire contents of this file with the updated logic.

import React, { createContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // The user's explicit setting: 'light', 'dark', or 'auto'
    const [themeSetting, setThemeSetting] = useState(() => {
        return localStorage.getItem('themeSetting') || 'auto';
    });

    const applyTheme = useCallback(() => {
        const root = window.document.documentElement;
        
        // Determine the actual theme to apply
        let currentTheme = themeSetting;
        if (themeSetting === 'auto') {
            currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        root.classList.remove('light', 'dark');
        root.classList.add(currentTheme);
    }, [themeSetting]);


    useEffect(() => {
        applyTheme();
        
        // Save the user's preference to localStorage
        localStorage.setItem('themeSetting', themeSetting);

        // Listen for changes in the OS theme preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (themeSetting === 'auto') {
                applyTheme();
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);

    }, [themeSetting, applyTheme]);

    return (
        <ThemeContext.Provider value={{ themeSetting, setThemeSetting }}>
            {children}
        </ThemeContext.Provider>
    );
};