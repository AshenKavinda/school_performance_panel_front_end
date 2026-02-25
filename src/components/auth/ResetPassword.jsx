import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authService from '../../services/authService';
import { isValidEmail, isValidPassword, isValidOtp, passwordsMatch, parseApiError } from '../../utils/validation';
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

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [form, setForm] = useState({
    email: initialEmail,
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: '' }));
    // Re-validate confirmPassword when newPassword changes
    if (name === 'newPassword' && fieldErrors.confirmPassword) {
      setFieldErrors((p) => ({ ...p, confirmPassword: passwordsMatch(value, form.confirmPassword) }));
    }
    if (apiError) setApiError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const validators = {
      email: () => isValidEmail(value),
      otp: () => isValidOtp(value),
      newPassword: () => isValidPassword(value),
      confirmPassword: () => passwordsMatch(form.newPassword, value),
    };
    if (validators[name]) setFieldErrors((p) => ({ ...p, [name]: validators[name]() }));
  };

  const validate = () => {
    const errs = {
      email: isValidEmail(form.email),
      otp: isValidOtp(form.otp),
      newPassword: isValidPassword(form.newPassword),
      confirmPassword: passwordsMatch(form.newPassword, form.confirmPassword),
    };
    setFieldErrors(errs);
    return !Object.values(errs).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await authService.resetPassword({ email: form.email, otp: form.otp, newPassword: form.newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const { apiError: msg, fieldErrors: fe } = parseApiError(err);
      setApiError(msg || 'Could not reset password. Check your OTP and try again.');
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Enter the OTP sent to your email</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Password Reset!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Redirecting you to sign in…</p>
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
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur}
                    placeholder="you@example.com" className={inputCls(fieldErrors.email)} />
                  <FieldError msg={fieldErrors.email} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">OTP Code</label>
                  <input name="otp" value={form.otp} onChange={handleChange} onBlur={handleBlur}
                    placeholder="Enter OTP" maxLength={10}
                    className={`${inputCls(fieldErrors.otp)} tracking-widest text-center text-lg font-mono`} />
                  <FieldError msg={fieldErrors.otp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <input name="newPassword" type={showPassword ? 'text' : 'password'}
                      value={form.newPassword} onChange={handleChange} onBlur={handleBlur}
                      placeholder="••••••••" className={`${inputCls(fieldErrors.newPassword)} pr-10`} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                  <FieldError msg={fieldErrors.newPassword} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
                  <input name="confirmPassword" type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                    placeholder="••••••••" className={inputCls(fieldErrors.confirmPassword)} />
                  <FieldError msg={fieldErrors.confirmPassword} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2">
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Resetting…' : 'Reset Password'}
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

export default ResetPassword;
