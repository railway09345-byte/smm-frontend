import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle({ className = '', variant = 'segmented', size = 'md' }) {
  const { theme, setTheme, toggleTheme, isDark } = useTheme();

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative inline-flex items-center justify-center rounded-xl bg-surface border border-border text-text hover:bg-surface/80 transition-all focus-visible:outline-2 focus-visible:outline-focus-ring ${
          size === 'sm' ? 'p-1.5' : 'p-2'
        } ${className}`}
        title={`Current: ${theme.toUpperCase()} (Click to toggle)`}
        aria-label="Toggle theme mode"
      >
        {theme === 'light' && <Sun className="w-4 h-4 text-warning" />}
        {theme === 'dark' && <Moon className="w-4 h-4 text-primary" />}
        {theme === 'system' && <Laptop className="w-4 h-4 text-accent" />}
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl bg-surface border border-border shadow-xs ${className}`}
      role="group"
      aria-label="Theme mode selector"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-focus-ring cursor-pointer ${
          theme === 'light'
            ? 'bg-primary text-primary-on shadow-xs font-semibold'
            : 'text-text-secondary hover:text-text hover:bg-surface'
        }`}
        title="Light Mode"
        aria-label="Switch to light mode"
        aria-pressed={theme === 'light'}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-focus-ring cursor-pointer ${
          theme === 'system'
            ? 'bg-primary text-primary-on shadow-xs font-semibold'
            : 'text-text-secondary hover:text-text hover:bg-surface'
        }`}
        title="System Auto Preference"
        aria-label="Use system preference"
        aria-pressed={theme === 'system'}
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-focus-ring cursor-pointer ${
          theme === 'dark'
            ? 'bg-primary text-primary-on shadow-xs font-semibold'
            : 'text-text-secondary hover:text-text hover:bg-surface'
        }`}
        title="Dark Mode"
        aria-label="Switch to dark mode"
        aria-pressed={theme === 'dark'}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default ThemeToggle;
