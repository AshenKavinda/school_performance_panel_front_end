/**
 * LoadingSpinner — reusable spinner with optional overlay and label.
 *
 * Props:
 *   size    — 'sm' | 'md' | 'lg'  (default: 'md')
 *   color   — Tailwind color class for border (default: 'border-indigo-500')
 *   label   — Optional text under spinner
 *   overlay — If true, renders as full-screen overlay
 *   inline  — If true, renders as inline-flex (no min-height)
 */

const SIZE_MAP = {
  sm:  'w-5  h-5  border-2',
  md:  'w-8  h-8  border-3',
  lg:  'w-12 h-12 border-4',
};

const LoadingSpinner = ({
  size = 'md',
  color = 'border-indigo-500',
  label,
  overlay = false,
  inline = false,
}) => {
  const spinner = (
    <div className={`rounded-full animate-spin border-t-transparent ${SIZE_MAP[size] ?? SIZE_MAP.md} ${color}`} />
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white/70 z-50 flex items-center justify-center flex-col gap-3">
        {spinner}
        {label && <p className="text-sm text-gray-500">{label}</p>}
      </div>
    );
  }

  if (inline) {
    return (
      <span className="inline-flex items-center gap-2">
        {spinner}
        {label && <span className="text-sm text-gray-500">{label}</span>}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      {spinner}
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
};

export default LoadingSpinner;
