/**
 * Pagination — page navigation bar.
 *
 * Props:
 *   page        — current 1-based page number
 *   totalPages  — total number of pages
 *   onPageChange — (newPage: number) => void
 *   pageSize    — items per page (displayed as info text)
 *   totalItems  — total items (displayed as info text)
 *   className   — extra wrapper classes
 */

const Pagination = ({ page, totalPages, onPageChange, pageSize, totalItems, className = '' }) => {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalItems ?? page * pageSize);

  // Generate visible page numbers (max 5 shown)
  const pages = [];
  let start = Math.max(1, page - 2);
  let end   = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);

  for (let i = start; i <= end; i++) pages.push(i);

  const btnBase =
    'inline-flex items-center justify-center w-9 h-9 text-sm font-medium rounded-lg transition';
  const btnActive  = 'bg-indigo-600 text-white shadow-sm';
  const btnInactive = 'text-gray-600 hover:bg-gray-100';
  const btnDisabled = 'text-gray-300 cursor-not-allowed';

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Count info */}
      {totalItems != null && pageSize != null && (
        <p className="text-sm text-gray-500 order-2 sm:order-1">
          Showing <span className="font-medium text-gray-700">{from}–{to}</span> of{' '}
          <span className="font-medium text-gray-700">{totalItems}</span> results
        </p>
      )}

      {/* Page buttons */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${btnBase} ${page <= 1 ? btnDisabled : btnInactive}`}
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* First + ellipsis */}
        {start > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className={`${btnBase} ${btnInactive}`}>1</button>
            {start > 2 && <span className="text-gray-400 px-1">…</span>}
          </>
        )}

        {/* Page numbers */}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        {/* Ellipsis + last */}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="text-gray-400 px-1">…</span>}
            <button onClick={() => onPageChange(totalPages)} className={`${btnBase} ${btnInactive}`}>
              {totalPages}
            </button>
          </>
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`${btnBase} ${page >= totalPages ? btnDisabled : btnInactive}`}
          aria-label="Next page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
