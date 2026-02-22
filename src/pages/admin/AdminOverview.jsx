import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { getApplicationAdmins } from '../../services/managementService';
import { getPackages }          from '../../services/managementService';
import { getPayments }          from '../../services/paymentService';
import { getUsers }             from '../../services/managementService';
import { LoadingSpinner }       from '../../components/common';

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, accent, loading }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl ${accent} flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      {loading
        ? <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mt-1" />
        : <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
      }
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Quick-link card ──────────────────────────────────────────────────────────
const QuickLink = ({ to, label, description, color }) => (
  <Link
    to={to}
    className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
  >
    <p className={`text-sm font-semibold ${color}`}>{label}</p>
    <p className="text-xs text-gray-400 mt-0.5">{description}</p>
  </Link>
);

// ── Main component ────────────────────────────────────────────────────────────
const AdminOverview = () => {
  const { error: toastError } = useToast();

  const [stats, setStats] = useState({
    schools: 0,
    packages: 0,
    payments: 0,
    revenue: 0,
    activeSubscriptions: 0,
    users: 0,
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [admins, pkgs, pmts, usrs] = await Promise.allSettled([
          getApplicationAdmins(),
          getPackages(),
          getPayments(),
          getUsers(),
        ]);

        const appAdmins  = admins.status  === 'fulfilled' ? (admins.value  ?? []) : [];
        const packages   = pkgs.status    === 'fulfilled' ? (pkgs.value    ?? []) : [];
        const payments   = pmts.status    === 'fulfilled' ? (pmts.value    ?? []) : [];
        const users      = usrs.status    === 'fulfilled' ? (usrs.value    ?? []) : [];

        const revenue    = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
        const activeSubs = payments.filter((p) => p.isActive).length;

        setStats({
          schools:             appAdmins.length,
          packages:            packages.length,
          payments:            payments.length,
          revenue,
          activeSubscriptions: activeSubs,
          users:               users.length,
        });

        // 5 most recent payments
        const sorted = [...payments].sort(
          (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
        );
        setRecentPayments(sorted.slice(0, 5));
      } catch {
        toastError('Failed to load overview data');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (n) =>
    loading ? '…' : n?.toLocaleString?.() ?? '0';
  const fmtCurrency = (n) =>
    loading ? '…' : `$${Number(n ?? 0).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* ── Greeting ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">Platform Overview</h2>
        <p className="text-sm text-gray-500 mt-0.5">Real-time summary of the school performance platform.</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Registered Schools"
          value={fmt(stats.schools)}
          sub="Application admin accounts"
          loading={loading}
          accent="bg-red-100"
          icon={<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0121 21H3a12.083 12.083 0 012.84-10.422L12 14z" /></svg>}
        />
        <StatCard
          label="Active Subscriptions"
          value={fmt(stats.activeSubscriptions)}
          sub={`of ${fmt(stats.payments)} total payments`}
          loading={loading}
          accent="bg-green-100"
          icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Total Revenue"
          value={fmtCurrency(stats.revenue)}
          sub="Across all payments"
          loading={loading}
          accent="bg-blue-100"
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Subscription Packages"
          value={fmt(stats.packages)}
          sub="Available plans"
          loading={loading}
          accent="bg-purple-100"
          icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <StatCard
          label="Total Payments"
          value={fmt(stats.payments)}
          sub="All-time transactions"
          loading={loading}
          accent="bg-orange-100"
          icon={<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
        />
        <StatCard
          label="Platform Users"
          value={fmt(stats.users)}
          sub="All roles"
          loading={loading}
          accent="bg-teal-100"
          icon={<svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
      </div>

      {/* ── Two-column lower section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent payments */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Payments</h3>
            <Link to="/admin/payments" className="text-xs text-red-600 hover:underline font-medium">View all</Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No payments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">School</th>
                    <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">Package</th>
                    <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">Amount</th>
                    <th className="text-left text-xs font-medium text-gray-400 pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="py-2.5 pr-4 font-medium text-gray-800 truncate max-w-[140px]">
                        {p.applicationAdminUsername ?? '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500 truncate max-w-[120px]">
                        {p.packageLabal ?? '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-700 font-medium">
                        ${Number(p.amount ?? 0).toFixed(2)}
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <QuickLink to="/admin/application-admins" label="School Accounts" description="Enable/disable school access" color="text-red-600" />
            <QuickLink to="/admin/admins"             label="Admin Accounts"  description="Manage platform admins"     color="text-red-600" />
            <QuickLink to="/admin/packages"           label="Packages"        description="Create & update plans"      color="text-red-600" />
            <QuickLink to="/admin/payments"           label="Payments"        description="View all transactions"      color="text-red-600" />
            <QuickLink to="/admin/users"              label="All Users"       description="Browse user accounts"       color="text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
