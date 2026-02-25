import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authService from '../../services/authService';
import { isValidEmail, parseApiError } from '../../utils/validation';
import ThemeToggle from '../common/ThemeToggle';

const FieldError = ({ msg }) =>
  msg ? (
    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  ) : null;

const inputCls = (err) =>
  `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition dark:bg-gray-800 dark:text-gray-100 ${
    err ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
  }`;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (emailErr) setEmailErr('');
    if (apiError) setApiError('');
  };

  const handleBlur = () => setEmailErr(isValidEmail(email));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = isValidEmail(email);
    if (err) { setEmailErr(err); return; }
    setLoading(true);
    setApiError('');
    try {
      await authService.forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      const { apiError: msg } = parseApiError(err);
      setApiError(msg || 'Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-12">
      <div className="fixed top-4 right-4 z-50"><ThemeToggle className="text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 bg-white/80 dark:bg-gray-800/80 shadow-sm" /></div>
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password?</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Enter your email and we&apos;ll send you a reset OTP.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Check your email</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                We&apos;ve sent a password reset OTP to <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
              </p>
              <Link
                to={`/reset-password?email=${encodeURIComponent(email)}`}
                className="inline-block w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm text-center transition"
              >
                Enter OTP &amp; Reset Password
              </Link>
            </div>
          ) : (
            <>
              {apiError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">{apiError}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="you@example.com"
                    className={inputCls(emailErr)}
                  />
                  <FieldError msg={emailErr} />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Sending…' : 'Send Reset OTP'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
