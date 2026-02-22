/**
 * Badge — compact color-coded label chip.
 *
 * Props:
 *   variant — 'default' | 'success' | 'error' | 'warning' | 'info' | 'purple' | 'teal'
 *   size    — 'sm' | 'md'
 *   dot     — boolean: show a leading dot indicator
 */

const VARIANT_MAP = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  error:   'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info:    'bg-blue-100 text-blue-700',
  purple:  'bg-purple-100 text-purple-700',
  teal:    'bg-teal-100 text-teal-700',
  orange:  'bg-orange-100 text-orange-700',
  emerald: 'bg-emerald-100 text-emerald-700',
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
