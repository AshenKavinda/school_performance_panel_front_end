import { useTheme } from '../../context/ThemeContext';

/**
 * ThemeToggle — sun/moon button that switches between light and dark mode.
 * Props:
 *   className — extra classes on the outer button
 *   size      — 'sm' | 'md' (default: 'md')
 */
const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { dark, toggleTheme } = useTheme();
  const iconCls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const btnCls  = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <button
      onClick={toggleTheme}
      className={`${btnCls} rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${className}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? (
        /* Sun icon — shown in dark mode (click to go light) */
        <svg className={`${iconCls} text-yellow-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        /* Moon icon — shown in light mode (click to go dark) */
        <svg className={`${iconCls} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
