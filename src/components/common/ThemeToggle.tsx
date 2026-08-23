import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  id?: string;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ id = 'theme-toggle-btn', className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      id={id}
      type="button"
      onClick={toggleTheme}
      className={`relative p-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
        theme === 'dark'
          ? 'bg-slate-900 border border-slate-800 text-amber-300 hover:bg-slate-800 hover:text-amber-200'
          : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-blue-600'
      } ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
};
