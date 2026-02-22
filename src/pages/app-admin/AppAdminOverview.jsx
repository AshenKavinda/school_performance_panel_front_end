import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getManagers }       from '../../services/managementService';
import { getOperators }      from '../../services/managementService';
import { getMySubscription } from '../../services/paymentService';
import { PageHeader }        from '../../components/common';

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, accent, loading }) => (
  <div className={`rounded-xl border p-5 flex items-start gap-4 ${accent}`}>
    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white/60">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium opacity-75 truncate">{label}</p>
      {loading ? (
        <div className="h-7 w-16 bg-white/50 rounded animate-pulse mt-1" />
      ) : (
        <p className="text-2xl font-bold mt-0.5">{value ?? '—'}</p>
      )}
      {sub && !loading && <p className="text-xs mt-0.5 opacity-60">{sub}</p>}
    </div>
  </div>
);

// ── Quick link card ───────────────────────────────────────────────────────────
const QuickLink = ({ to, label, desc, icon }) => (
  <Link
    to={to}
    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition group"
  >
    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0 group-hover:bg-purple-200 transition">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-800 group-hover:text-purple-700">{label}</p>
      {desc && <p className="text-xs text-gray-400 truncate">{desc}</p>}
    </div>
    <svg className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </Link>
);

const AppAdminOverview = () => {
  const [managers,     setManagers]     = useState([]);
  const [operators,    setOperators]    = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading,      setLoading]      = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [mgrsRes, opsRes, subRes] = await Promise.allSettled([
      getManagers(),
      getOperators(),
      getMySubscription(),
    ]);
    if (mgrsRes.status === 'fulfilled') {
      setManagers(Array.isArray(mgrsRes.value) ? mgrsRes.value.filter(r => !r.isDeleted) : []);
    }
    if (opsRes.status === 'fulfilled') {
      setOperators(Array.isArray(opsRes.value) ? opsRes.value.filter(r => !r.isDeleted) : []);
    }
    if (subRes.status === 'fulfilled') {
      setSubscription(subRes.value);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Derive subscription display values
  const hasActive   = subscription?.hasActiveSubscription ?? false;
  const daysLeft    = subscription?.daysRemaining ?? null;
  const expiryDate  = subscription?.expiryDate
    ? new Date(subscription.expiryDate).toLocaleDateString()
    : null;
  const subStatus   = hasActive
    ? daysLeft != null ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'Active'
    : 'No active subscription';

  const subAccent = hasActive
    ? daysLeft != null && daysLeft <= 14
      ? 'bg-orange-50 text-orange-700 border-orange-200'
      : 'bg-green-50 text-green-700 border-green-200'
    : 'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Admin Overview"
        subtitle="Summary of your school's staff, subscription, and configuration."
      />

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Managers"
          value={managers.length}
          sub="Active managers"
          loading={loading}
          accent="bg-purple-50 text-purple-700 border border-purple-200"
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          label="Operators"
          value={operators.length}
          sub="Active operators"
          loading={loading}
          accent="bg-indigo-50 text-indigo-700 border border-indigo-200"
          icon={
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Subscription"
          value={hasActive ? 'Active' : 'Inactive'}
          sub={hasActive ? (expiryDate ? `Expires ${expiryDate}` : subStatus) : 'No active plan'}
          loading={loading}
          accent={`border ${subAccent}`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
      </div>

      {/* ── Subscription warning banner ────────────────────────────────────── */}
      {!loading && hasActive && daysLeft != null && daysLeft <= 14 && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Subscription expiring soon</p>
            <p className="mt-0.5 text-orange-600">
              Your subscription expires in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>
              {expiryDate ? ` on ${expiryDate}` : ''}.
              Contact your platform admin to renew.
            </p>
          </div>
        </div>
      )}
      {!loading && !hasActive && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">No active subscription</p>
            <p className="mt-0.5 text-red-600">Some features may be restricted until your school has an active plan.</p>
          </div>
        </div>
      )}

      {/* ── Quick links ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <QuickLink to="../subscription" label="Subscription" desc="View plan & expiry details"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          />
          <QuickLink to="../managers" label="Manage Managers" desc="Add or edit managers"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          />
          <QuickLink to="../operators" label="Manage Operators" desc="Add or edit operators"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          />
          <QuickLink to="../profile" label="My Profile" desc="View & update your profile"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        </div>
      </div>
    </div>
  );
};

export default AppAdminOverview;
