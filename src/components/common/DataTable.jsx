import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';

/**
 * DataTable — reusable table with loading skeleton, empty state, and pagination.
 *
 * Props:
 *   columns     — [{ key, header, render?, className?, sortable? }]
 *   data        — array of row objects
 *   loading     — boolean: show skeleton rows
 *   error       — error message string (shown in pink banner)
 *   emptyMessage — message when data is empty (default: 'No records found.')
 *   emptyIcon   — optional icon React node for empty state
 *   rowKey      — function(row) => unique key (default: row.id)
 *   onRowClick  — optional row click handler
 *   actions     — function(row) => React node, rendered in a trailing column
 *   actionHeader — header for actions column (default: 'Actions')
 *
 *   // Pagination
 *   page        — current page (pass to enable pagination)
 *   totalPages  — total pages
 *   onPageChange
 *   pageSize
 *   totalItems
 *
 *   // Sorting
 *   sortKey     — currently sorted column key
 *   sortDir     — 'asc' | 'desc'
 *   onSort      — (key) => void
 *
 *   className   — extra wrapper classes
 */

const SKELETON_ROWS = 5;

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  error,
  emptyMessage = 'No records found.',
  emptyIcon,
  rowKey = (row) => row.id,
  onRowClick,
  actions,
  actionHeader = 'Actions',
  page,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  sortKey,
  sortDir,
  onSort,
  className = '',
}) => {
  const showPagination = page != null && totalPages != null && onPageChange != null;

  // Sort icon
  const SortIcon = ({ colKey }) => {
    if (!onSort) return null;
    const isActive = colKey === sortKey;
    return (
      <span className="ml-1 inline-flex flex-col items-center">
        <svg className={`w-3 h-3 ${isActive && sortDir === 'asc' ? 'text-indigo-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3l5 6H5l5-6z" />
        </svg>
        <svg className={`w-3 h-3 -mt-1 ${isActive && sortDir === 'desc' ? 'text-indigo-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 17l-5-6h10l-5 6z" />
        </svg>
      </span>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden ${className}`}>
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Scrollable wrapper */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${col.sortable && onSort ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none' : ''} ${col.className ?? ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {actionHeader}
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              /* Skeleton rows */
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              /* Empty state */
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    {emptyIcon ?? (
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30'}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-300 ${col.className ?? ''}`}>
                      {col.render ? col.render(row, row[col.key]) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            pageSize={pageSize}
            totalItems={totalItems}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;
