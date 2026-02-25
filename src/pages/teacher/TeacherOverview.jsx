import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTeacherAssignments } from '../../services/enrollmentService';
import { getTeacherWeeklySchedule } from '../../services/timetableService';
import { useTeacher } from '../../context/TeacherContext';
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
    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50 dark:hover:border-orange-600 dark:hover:bg-orange-900/30 transition group"
  >
    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-orange-700 dark:group-hover:text-orange-400">{label}</p>
      {desc && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{desc}</p>}
    </div>
    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto flex-shrink-0 group-hover:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </Link>
);

// ── Icons ─────────────────────────────────────────────────────────────────────
const BookIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const GridIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const CalendarIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const UsersIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const EditIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const ChartIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const UserIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

const TeacherOverview = () => {
  const { teacherId, loading: ctxLoading } = useTeacher();
  const [stats, setStats] = useState({ subjects: 0, sections: 0, todayClasses: 0 });
  const [todayEntries, setTodayEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!teacherId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [assignments, weeklySchedule] = await Promise.allSettled([
        getTeacherAssignments(teacherId),
        getTeacherWeeklySchedule(teacherId),
      ]);

      // Count assigned subjects and sections
      const aData = assignments.status === 'fulfilled' ? assignments.value : {};
      const subjectCount = Array.isArray(aData?.assignedSubjects) ? aData.assignedSubjects.length : 0;
      const sectionCount = Array.isArray(aData?.assignedSections) ? aData.assignedSections.length : 0;

      // Find today's classes
      const jsDay = new Date().getDay(); // 0=Sun, 1=Mon, ...
      const todayEnum = jsDay >= 1 && jsDay <= 5 ? DAYS[jsDay - 1] : null;
      const wData = weeklySchedule.status === 'fulfilled' && Array.isArray(weeklySchedule.value) ? weeklySchedule.value : [];
      const todaySchedule = todayEnum ? wData.find(d => d.day === todayEnum) : null;
      const todayClsList = Array.isArray(todaySchedule?.classes) ? todaySchedule.classes : [];

      setStats({ subjects: subjectCount, sections: sectionCount, todayClasses: todayClsList.length });
      setTodayEntries(todayClsList);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Teacher Overview" subtitle="Your teaching dashboard at a glance" />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Assigned Subjects"
          value={stats.subjects}
          loading={loading}
          accent="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700/50"
          icon={<BookIcon />}
        />
        <StatCard
          label="Assigned Sections"
          value={stats.sections}
          loading={loading}
          accent="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50"
          icon={<GridIcon />}
        />
        <StatCard
          label="Today's Classes"
          value={stats.todayClasses}
          loading={loading}
          accent="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50"
          icon={<CalendarIcon />}
        />
      </div>

      {/* Today's Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Today&apos;s Schedule</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />)}
          </div>
        ) : todayEntries.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No classes scheduled for today.</p>
        ) : (
          <div className="space-y-2">
            {todayEntries.map((entry, i) => (
              <div key={entry.timetableId ?? i}
                className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50">
                <div className="w-8 h-8 rounded-lg bg-orange-200 dark:bg-orange-800/50 flex items-center justify-center text-orange-700 dark:text-orange-300 flex-shrink-0 text-xs font-bold">
                  {entry.timeSlotName ?? (i + 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{entry.subjectName ?? '—'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{entry.className ?? '—'}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {entry.startTime ?? ''} – {entry.endTime ?? ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink to="/teacher/timetable"   label="My Timetable"    desc="View weekly schedule"         icon={<CalendarIcon />} />
          <QuickLink to="/teacher/assignments"  label="My Assignments"  desc="Subjects & sections"          icon={<BookIcon />} />
          <QuickLink to="/teacher/students"     label="Class Students"  desc="View enrolled students"       icon={<UsersIcon />} />
          <QuickLink to="/teacher/mark-entry"   label="Mark Entry"      desc="Enter or update exam marks"   icon={<EditIcon />} />          <QuickLink to="/teacher/analytics"    label="Analytics"       desc="Performance insights"       icon={<ChartIcon />} />          <QuickLink to="/teacher/profile"      label="My Profile"      desc="View your account details"    icon={<UserIcon />} />
        </div>
      </div>
    </div>
  );
};

export default TeacherOverview;
