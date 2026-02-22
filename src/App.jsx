import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';

// Auth pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import VerifyEmail from './components/auth/VerifyEmail';

// Dashboards
import AdminDashboard from './components/dashboards/AdminDashboard';
import AppAdminDashboard from './components/dashboards/AppAdminDashboard';
import ManagerDashboard from './components/dashboards/ManagerDashboard';
import OperatorDashboard from './components/dashboards/OperatorDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import StudentDashboard from './components/dashboards/StudentDashboard';
import Unauthorized from './components/Unauthorized';

// ── Root redirect: send authenticated users to their dashboard ───────────────
const RootRedirect = () => {
  const { isAuthenticated, getDashboardRoute } = useAuth();
  return <Navigate to={isAuthenticated ? getDashboardRoute() : '/login'} replace />;
};

// ── Loading spinner shown during initial auth rehydration ────────────────────
const AuthGate = ({ children }) => {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }
  return children;
};

// ── Public-only route: redirect to dashboard if already logged in ─────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, getDashboardRoute } = useAuth();
  return isAuthenticated ? <Navigate to={getDashboardRoute()} replace /> : children;
};

const AppRoutes = () => (
  <AuthGate>
    <Routes>
      {/* ── Root ─────────────────────────────────────────── */}
      <Route path="/" element={<RootRedirect />} />

      {/* ── Auth (public only) ───────────────────────────── */}
      <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"       element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password"  element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/verify-email"    element={<VerifyEmail />} />

      {/* ── ADMIN routes ─────────────────────────────────── */}
      <Route path="/admin/*" element={
        <ProtectedRoute roles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* ── APPLICATION_ADMIN routes ─────────────────────── */}
      <Route path="/app-admin/*" element={
        <ProtectedRoute roles={['APPLICATION_ADMIN']}>
          <AppAdminDashboard />
        </ProtectedRoute>
      } />

      {/* ── MANAGER routes ───────────────────────────────── */}
      <Route path="/manager/*" element={
        <ProtectedRoute roles={['MANAGER']}>
          <ManagerDashboard />
        </ProtectedRoute>
      } />

      {/* ── OPERATOR routes ──────────────────────────────── */}
      <Route path="/operator/*" element={
        <ProtectedRoute roles={['OPERATOR']}>
          <OperatorDashboard />
        </ProtectedRoute>
      } />

      {/* ── TEACHER routes ───────────────────────────────── */}
      <Route path="/teacher/*" element={
        <ProtectedRoute roles={['TEACHER']}>
          <TeacherDashboard />
        </ProtectedRoute>
      } />

      {/* ── STUDENT routes ───────────────────────────────── */}
      <Route path="/student/*" element={
        <ProtectedRoute roles={['STUDENT']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />

      {/* ── Error pages ──────────────────────────────────── */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </AuthGate>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

