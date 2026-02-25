import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

/**
 * ConfirmDialog — confirmation modal for destructive / important actions.
 *
 * Props:
 *   open       — boolean
 *   onClose    — cancel handler
 *   onConfirm  — async confirm handler (button shows spinner while pending)
 *   title      — dialog title
 *   message    — body message
 *   confirmLabel  — confirm button label (default: 'Confirm')
 *   cancelLabel   — cancel button label (default: 'Cancel')
 *   variant    — 'danger' | 'warning' | 'info' (default: 'danger')
 *   loading    — boolean: shows spinner on confirm button
 */

const VARIANT_MAP = {
  danger:  {
    icon: (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 flex-shrink-0">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
    ),
    btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 flex-shrink-0">
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
    ),
    btn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
  },
  info: {
    icon: (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 flex-shrink-0">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        </svg>
      </div>
    ),
    btn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
};

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const { icon, btn } = VARIANT_MAP[variant] ?? VARIANT_MAP.danger;

  return (
    <Modal open={open} onClose={onClose} size="sm" hideClose>
      <div className="flex gap-4 items-start">
        {icon}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${btn}`}
        >
          {loading && <LoadingSpinner size="sm" color="border-white" inline />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
