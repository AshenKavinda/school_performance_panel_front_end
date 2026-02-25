/**
 * Badge — compact color-coded label chip.
 *
 * Props:
 *   variant — 'default' | 'success' | 'error' | 'warning' | 'info' | 'purple' | 'teal'
 *   size    — 'sm' | 'md'
 *   dot     — boolean: show a leading dot indicator
 */

const VARIANT_MAP = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  error:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  info:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  purple:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  teal:    'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  orange:  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
};

const DOT_MAP = {
  default: 'bg-gray-500',
  success: 'bg-green-500',
  error:   'bg-red-500',
  warning: 'bg-yellow-500',
  info:    'bg-blue-500',
  purple:  'bg-purple-500',
  teal:    'bg-teal-500',
  orange:  'bg-orange-500',
  emerald: 'bg-emerald-500',
};

const SIZE_MAP = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

const Badge = ({ children, variant = 'default', size = 'md', dot = false, className = '' }) => {
  const variantCls = VARIANT_MAP[variant] ?? VARIANT_MAP.default;
  const sizeCls    = SIZE_MAP[size] ?? SIZE_MAP.md;
  const dotCls     = DOT_MAP[variant] ?? DOT_MAP.default;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variantCls} ${sizeCls} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />}
      {children}
    </span>
  );
};

export default Badge;
