import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useManager } from '../../context/ManagerContext';
import { getManagerSchoolOverview } from '../../services/analyticsService';
import { PageHeader, LoadingSpinner } from '../../components/common';

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent, loading }) => (
  <div className={`rounded-xl border p-5 flex items-start gap-4 ${accent}`}>
    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white/60 dark:bg-white/10">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium opacity-75 truncate">{label}</p>
      {loading ? (
        <div className="h-7 w-16 bg-white/50 dark:bg-white/10 rounded animate-pulse mt-1" />
      ) : (
        <p className="text-2xl font-bold mt-0.5">{value ?? '—'}</p>
      )}
    </div>
  </div>
);

// ── Quick link card ───────────────────────────────────────────────────────────
const QuickLink = ({ to, label, desc, icon }) => (
  <Link
    to={to}
    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/30 transition group"
  >
    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{label}</p>
      {desc && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{desc}</p>}
    </div>
    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto flex-shrink-0 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </Link>
);

// ── Icons ─────────────────────────────────────────────────────────────────────
const UsersIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const AcademicIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>;
const BookIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const GridIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const FolderIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
const BriefcaseIcon= () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ChartIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const UserIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TrendUpIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;

const ManagerOverview = () => {
  const { managerProfile, loading: ctxLoading } = useManager();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getManagerSchoolOverview();
      setOverview(data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Overview"
        subtitle={managerProfile?.username ? `Welcome, ${managerProfile.username}` : 'School operations at a glance'}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={overview?.totalStudents}
          loading={loading}
          accent="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50"
          icon={<UsersIcon />}
        />
        <StatCard
          label="Total Teachers"
          value={overview?.totalTeachers}
          loading={loading}
          accent="bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700/50"
          icon={<AcademicIcon />}
        />
        <StatCard
          label="Total Classes"
          value={overview?.totalClasses}
          loading={loading}
          accent="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50"
          icon={<GridIcon />}
        />
        <StatCard
          label="Overall Average"
          value={overview?.overallAverageMark != null ? `${overview.overallAverageMark.toFixed(1)}%` : '—'}
          loading={loading}
          accent="bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-700/50"
          icon={<TrendUpIcon />}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Clusters"
          value={overview?.totalClusters}
          loading={loading}
          accent="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50"
          icon={<FolderIcon />}
        />
        <StatCard
          label="Sections"
          value={overview?.totalSections}
          loading={loading}
          accent="bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/50"
          icon={<GridIcon />}
        />
        <StatCard
          label="Subjects"
          value={overview?.totalSubjects}
          loading={loading}
          accent="bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700/50"
          icon={<BookIcon />}
        />
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink to="/manager/operators"  label="View Operators"    desc="School data operators"         icon={<BriefcaseIcon />} />
          <QuickLink to="/manager/teachers"   label="View Teachers"     desc="All teachers & assignments"    icon={<AcademicIcon />} />
          <QuickLink to="/manager/students"   label="View Students"     desc="Student directory"             icon={<UsersIcon />} />
          <QuickLink to="/manager/classes"    label="Classes & Sections" desc="Academic structure"            icon={<GridIcon />} />
          <QuickLink to="/manager/analytics"  label="Analytics"         desc="Performance insights"          icon={<ChartIcon />} />
          <QuickLink to="/manager/profile"    label="My Profile"        desc="View your account details"     icon={<UserIcon />} />
        </div>
      </div>
    </div>
  );
};

export default ManagerOverview;
