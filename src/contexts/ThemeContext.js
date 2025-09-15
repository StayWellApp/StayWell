// src/contexts/ThemeContext.js

import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default theme

  useEffect(() => {
    const root = window.document.documentElement;
    
    // --- ADDED: Logic to detect and apply system theme ---
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(systemTheme);

    // Add listener for changes in system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        setTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    // Set the class on the root HTML element
    root.classList.remove('light', 'dark');
    root.classList.add(systemTheme);

    // Cleanup listener on component unmount
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []); // Only runs once on initial load

  // This function can be used later to allow manual theme switching
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    const root = window.document.documentElement;
    root.classList.remove(theme);
    root.classList.add(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};