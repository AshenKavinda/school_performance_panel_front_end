import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal — accessible dialog overlay.
 *
 * Props:
 *   open      — boolean: controls visibility
 *   onClose   — called when backdrop or × is clicked
 *   title     — header title string
 *   size      — 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
 *   footer    — React node for the footer area
 *   hideClose — hides the × button
 *   children  — modal body
 */

const SIZE_MAP = {
  sm:         'max-w-sm',
  md:         'max-w-lg',
  lg:         'max-w-2xl',
  xl:         'max-w-4xl',
  fullscreen: 'max-w-none w-full h-full rounded-none',
};

const Modal = ({ open, onClose, title, size = 'md', footer, hideClose = false, children }) => {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizeCls = SIZE_MAP[size] ?? SIZE_MAP.md;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col w-full ${sizeCls} max-h-[90vh] overflow-hidden`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            {title && (
              <h2 id="modal-title" className="text-base font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                aria-label="Close modal"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
