import { Link } from 'react-router-dom';

/**
 * 401 Unauthorized — shown when a user tries to access a route
 * that their role doesn't permit.
 */
const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-2">401</h1>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
