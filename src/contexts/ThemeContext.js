import React, { createContext, useState, useEffect, useMemo } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Initialize state from localStorage or default to 'light'
    const [theme, setTheme] = useState(() => {
        const storedTheme = localStorage.getItem('theme');
        return storedTheme || 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove the old theme class and add the new one
        const oldTheme = theme === 'dark' ? 'light' : 'dark';
        root.classList.remove(oldTheme);
        root.classList.add(theme);

        // Save the theme to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    
    // Memoize the value to prevent unnecessary re-renders
    const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};