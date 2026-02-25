import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authService from '../../services/authService';
import { isValidEmail, isValidOtp, parseApiError } from '../../utils/validation';
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

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
    if (apiError) setApiError('');
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
    if (fieldErrors.otp) setFieldErrors((p) => ({ ...p, otp: '' }));
    if (apiError) setApiError('');
  };

  const handleBlur = (field, value) => {
    const validator = field === 'email' ? isValidEmail : isValidOtp;
    setFieldErrors((p) => ({ ...p, [field]: validator(value) }));
  };

  const validate = () => {
    const errs = { email: isValidEmail(email), otp: isValidOtp(otp) };
    setFieldErrors(errs);
    return !Object.values(errs).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await authService.verifyEmail({ email, otp });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const { apiError: msg, fieldErrors: fe } = parseApiError(err);
      setApiError(msg || 'Verification failed. Please check your OTP.');
      if (Object.keys(fe).length) setFieldErrors((p) => ({ ...p, ...fe }));
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Your Email</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Enter the OTP we sent to your email to activate your account.
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
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Email Verified!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your account is now active. Redirecting to sign in…</p>
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

              {/* Info banner */}
              <div className="mb-5 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                <p className="text-indigo-700 dark:text-indigo-400 text-sm">
                  Check your inbox for a verification email and enter the OTP below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={(e) => handleBlur('email', e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls(fieldErrors.email)}
                  />
                  <FieldError msg={fieldErrors.email} />
                </div>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    OTP Code
                  </label>
                  <input
                    id="otp"
                    value={otp}
                    onChange={handleOtpChange}
                    onBlur={(e) => handleBlur('otp', e.target.value)}
                    placeholder="Enter OTP"
                    maxLength={10}
                    className={`${inputCls(fieldErrors.otp)} tracking-widest text-center text-lg font-mono`}
                  />
                  <FieldError msg={fieldErrors.otp} />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Verifying…' : 'Verify Email'}
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

export default VerifyEmail;
