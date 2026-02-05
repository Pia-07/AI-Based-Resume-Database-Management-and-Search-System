import { useState, useEffect } from "react";

/**
 * ThemeToggle - Dark/Light mode toggle component
 * Features:
 * - Persists preference to localStorage
 * - Respects system preference as default
 * - Smooth transitions between themes
 */
const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem("theme");
        if (saved) {
            return saved === "dark";
        }
        // Fall back to system preference
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    return (
        <div
            className="theme-toggle"
            onClick={toggleTheme}
            role="button"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && toggleTheme()}
        >
            <span className="theme-toggle-icon">
                {isDark ? "🌙" : "☀️"}
            </span>
            <div className={`theme-toggle-track ${isDark ? 'active' : ''}`}>
                <div className="theme-toggle-thumb" />
            </div>
            <span className="theme-toggle-label">
                {isDark ? "Dark" : "Light"}
            </span>
        </div>
    );
};

export default ThemeToggle;
