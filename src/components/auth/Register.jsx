import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidPhone,
  isValidDOB,
  parseApiError,
} from '../../utils/validation';

const TABS = [
  { key: 'student', label: 'Student' },
  { key: 'school', label: 'School Admin' },
];

// â”€â”€ Shared helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
    err ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-300 focus:ring-indigo-500'
  }`;

const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

// â”€â”€ Validators per form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const validateStudentForm = (f) => ({
  firstName: !f.firstName?.trim() ? 'First name is required.' : '',
  lastName: !f.lastName?.trim() ? 'Last name is required.' : '',
  username: isValidUsername(f.username),
  email: isValidEmail(f.email),
  password: isValidPassword(f.password),
  dateOfBirth: isValidDOB(f.dateOfBirth),
  phone: isValidPhone(f.phone),
});

const validateAdminForm = (f) => ({
  username: isValidUsername(f.username),
  email: isValidEmail(f.email),
  password: isValidPassword(f.password),
});

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerStudent, registerApplicationAdmin } = useAuth();

  const initialTab = searchParams.get('tab') === 'school' ? 'school' : 'student';
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // â”€â”€ Student form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [sf, setSf] = useState({
    username: '', email: '', password: '',
    firstName: '', lastName: '', phone: '', dateOfBirth: '',
  });
  const [sfErr, setSfErr] = useState({});

  // â”€â”€ Admin form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [af, setAf] = useState({ username: '', email: '', password: '', schoolName: '' });
  const [afErr, setAfErr] = useState({});

  const handleSfChange = (e) => {
    const { name, value } = e.target;
    setSf((p) => ({ ...p, [name]: value }));
    if (sfErr[name]) setSfErr((p) => ({ ...p, [name]: '' }));
    setApiError('');
  };

  const handleSfBlur = (e) => {
    const { name, value } = e.target;
    const validators = {
      firstName: () => !value?.trim() ? 'First name is required.' : '',
      lastName: () => !value?.trim() ? 'Last name is required.' : '',
      username: () => isValidUsername(value),
      email: () => isValidEmail(value),
      password: () => isValidPassword(value),
      dateOfBirth: () => isValidDOB(value),
      phone: () => isValidPhone(value),
    };
    if (validators[name]) setSfErr((p) => ({ ...p, [name]: validators[name]() }));
  };

  const handleAfChange = (e) => {
    const { name, value } = e.target;
    setAf((p) => ({ ...p, [name]: value }));
    if (afErr[name]) setAfErr((p) => ({ ...p, [name]: '' }));
    setApiError('');
  };

  const handleAfBlur = (e) => {
    const { name, value } = e.target;
    const validators = {
      username: () => isValidUsername(value),
      email: () => isValidEmail(value),
      password: () => isValidPassword(value),
    };
    if (validators[name]) setAfErr((p) => ({ ...p, [name]: validators[name]() }));
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStudentForm(sf);
    setSfErr(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    setApiError('');
    try {
      await registerStudent({ ...sf, dateOfBirth: new Date(sf.dateOfBirth).toISOString() });
      setSuccess('Account created! Please verify your email.');
      setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(sf.email)}`), 1500);
    } catch (err) {
      const { apiError: msg, fieldErrors: fe } = parseApiError(err);
      setApiError(msg || 'Registration failed. Please try again.');
      if (Object.keys(fe).length) setSfErr((p) => ({ ...p, ...fe }));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    const errs = validateAdminForm(af);
    setAfErr(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    setApiError('');
    try {
      await registerApplicationAdmin(af);
      setSuccess('Account created! Please verify your email.');
      setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(af.email)}`), 1500);
    } catch (err) {
      const { apiError: msg, fieldErrors: fe } = parseApiError(err);
      setApiError(msg || 'Registration failed. Please try again.');
      if (Object.keys(fe).length) setAfErr((p) => ({ ...p, ...fe }));
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (key) => {
    setTab(key);
    setApiError('');
    setSuccess('');
    setSfErr({});
    setAfErr({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0121 21H3a12.083 12.083 0 012.84-10.422L12 14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create an Account</h1>
          <p className="text-gray-500 mt-1 text-sm">School Performance Panel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => switchTab(t.key)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                  tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* API error */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-sm font-medium">{apiError}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-600 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* â”€â”€ Student Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {tab === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                  <input name="firstName" value={sf.firstName} onChange={handleSfChange} onBlur={handleSfBlur}
                    placeholder="John" className={inputCls(sfErr.firstName)} />
                  <FieldError msg={sfErr.firstName} />
                </div>
                <div>
                  <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                  <input name="lastName" value={sf.lastName} onChange={handleSfChange} onBlur={handleSfBlur}
                    placeholder="Doe" className={inputCls(sfErr.lastName)} />
                  <FieldError msg={sfErr.lastName} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Username <span className="text-red-500">*</span></label>
                <input name="username" value={sf.username} onChange={handleSfChange} onBlur={handleSfBlur}
                  placeholder="johndoe" className={inputCls(sfErr.username)} />
                <FieldError msg={sfErr.username} />
              </div>

              <div>
                <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                <input name="email" type="email" value={sf.email} onChange={handleSfChange} onBlur={handleSfBlur}
                  placeholder="john@example.com" className={inputCls(sfErr.email)} />
                <FieldError msg={sfErr.email} />
              </div>

              <div>
                <label className={labelCls}>Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input name="password" type={showPassword ? 'text' : 'password'}
                    value={sf.password} onChange={handleSfChange} onBlur={handleSfBlur}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className={`${inputCls(sfErr.password)} pr-10`} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    <EyeIcon />
                  </button>
                </div>
                <FieldError msg={sfErr.password} />
              </div>

              <div>
                <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
                <input name="dateOfBirth" type="date" value={sf.dateOfBirth}
                  onChange={handleSfChange} onBlur={handleSfBlur}
                  className={inputCls(sfErr.dateOfBirth)} />
                <FieldError msg={sfErr.dateOfBirth} />
              </div>

              <div>
                <label className={labelCls}>Phone <span className="text-gray-400 text-xs">(optional)</span></label>
                <input name="phone" type="tel" value={sf.phone} onChange={handleSfChange} onBlur={handleSfBlur}
                  placeholder="+1 234 567 890" className={inputCls(sfErr.phone)} />
                <FieldError msg={sfErr.phone} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2">
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Creating accountâ€¦' : 'Create Student Account'}
              </button>
            </form>
          )}

          {/* â”€â”€ School Admin Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {tab === 'school' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4" noValidate>
              <div>
                <label className={labelCls}>Username <span className="text-red-500">*</span></label>
                <input name="username" value={af.username} onChange={handleAfChange} onBlur={handleAfBlur}
                  placeholder="schooladmin" className={inputCls(afErr.username)} />
                <FieldError msg={afErr.username} />
              </div>

              <div>
                <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                <input name="email" type="email" value={af.email} onChange={handleAfChange} onBlur={handleAfBlur}
                  placeholder="admin@school.edu" className={inputCls(afErr.email)} />
                <FieldError msg={afErr.email} />
              </div>

              <div>
                <label className={labelCls}>Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input name="password" type={showPassword ? 'text' : 'password'}
                    value={af.password} onChange={handleAfChange} onBlur={handleAfBlur}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className={`${inputCls(afErr.password)} pr-10`} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    <EyeIcon />
                  </button>
                </div>
                <FieldError msg={afErr.password} />
              </div>

              <div>
                <label className={labelCls}>School Name <span className="text-gray-400 text-xs">(optional)</span></label>
                <input name="schoolName" value={af.schoolName} onChange={handleAfChange}
                  placeholder="Springfield Academy"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2">
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Creating accountâ€¦' : 'Create School Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
