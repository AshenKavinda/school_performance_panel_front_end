import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900/40 rounded-3xl mb-6 shadow-inner">
          <span className="text-4xl font-black text-indigo-400">404</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Page not found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Go Back
          </button>
          <Link
            to="/"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
