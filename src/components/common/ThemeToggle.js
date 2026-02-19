import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ className }) => {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const toggleTheme = () => {
        setIsDark(prev => {
            document.documentElement.classList.toggle('dark', !prev);
            return !prev;
        });
    };

    const defaultClassName = "p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors";

    return (
        <button onClick={toggleTheme} className={className || defaultClassName}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
    );
};

export default ThemeToggle;
