import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudent } from '../../context/StudentContext';
import { getStudentDashboard } from '../../services/analyticsService';
import { getStudentWeeklySchedule } from '../../services/timetableService';
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
    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/30 transition group"
  >
    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{label}</p>
      {desc && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{desc}</p>}
    </div>
    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto flex-shrink-0 group-hover:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </Link>
);

// ── Icons ─────────────────────────────────────────────────────────────────────
const BookIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const ClipboardIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const CalendarIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ChartIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const UserIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const AcademicIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>;
const TrendUpIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

const StudentOverview = () => {
  const { studentId, studentGlobal, studentProfile, enrollment, loading: ctxLoading } = useStudent();
  const [dashboard, setDashboard]     = useState(null);
  const [todayEntries, setTodayEntries] = useState([]);
  const [loading, setLoading]         = useState(true);

  const fetchData = useCallback(async () => {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getStudentDashboard(),
        // Get timetable for first enrolled class
        enrollment?.enrolledClasses?.[0]?.classId
          ? getStudentWeeklySchedule(studentId, enrollment.enrolledClasses[0].classId)
          : Promise.resolve(null),
      ]);

      const dashData = results[0].status === 'fulfilled' ? results[0].value : null;
      setDashboard(dashData);

      // Today's schedule
      const jsDay = new Date().getDay();
      const todayEnum = jsDay >= 1 && jsDay <= 5 ? DAYS[jsDay - 1] : null;
      const weekData = results[1].status === 'fulfilled' ? results[1].value : null;
      const todaySchedule = todayEnum && weekData?.weekSchedule ? weekData.weekSchedule[todayEnum] : [];
      setTodayEntries(Array.isArray(todaySchedule) ? todaySchedule : []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [studentId, enrollment]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  const enrolledClassCount = enrollment?.enrolledClasses?.length ?? 0;
  const totalSubjects = dashboard?.totalSubjects ?? enrollment?.enrolledClasses?.reduce((sum, c) => sum + (c.enrolledSubjects?.length ?? 0), 0) ?? 0;
  const displayName = studentGlobal ? `${studentGlobal.firstName || ''} ${studentGlobal.lastName || ''}`.trim() : 'Student';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${displayName}`}
        subtitle={studentProfile?.indexNumber ? `Index No: ${studentProfile.indexNumber}` : 'Your student dashboard'}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Enrolled Classes"
          value={enrolledClassCount}
          loading={loading}
          accent="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50"
          icon={<AcademicIcon />}
        />
        <StatCard
          label="Total Subjects"
          value={totalSubjects}
          loading={loading}
          accent="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50"
          icon={<BookIcon />}
        />
        <StatCard
          label="Overall Average"
          value={dashboard?.overallAverage != null ? `${dashboard.overallAverage.toFixed(1)}%` : '—'}
          loading={loading}
          accent="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700/50"
          icon={<TrendUpIcon />}
        />
        <StatCard
          label="GPA"
          value={dashboard?.gpa != null ? dashboard.gpa.toFixed(2) : '—'}
          loading={loading}
          accent="bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700/50"
          icon={<ChartIcon />}
        />
      </div>

      {/* Subject Performance Summary */}
      {dashboard?.subjectMarks?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Subject Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Subject</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Credits</th>
                  {['Term 1', 'Term 2', 'Final'].map(t => (
                    <th key={t} className="text-center py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.subjectMarks.map(sub => (
                  <tr key={sub.subjectId} className="border-b border-gray-50 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-2 px-3 font-medium text-gray-800 dark:text-gray-200">{sub.subjectName}</td>
                    <td className="py-2 px-3 text-center text-gray-500 dark:text-gray-400">{sub.creditValue}</td>
                    {['FIRST_TERM', 'SECOND_TERM', 'FINAL_TERM'].map(term => {
                      const tm = sub.termMarks?.find(t => t.term === term);
                      return (
                        <td key={term} className="py-2 px-3 text-center">
                          {tm ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-medium text-gray-800 dark:text-gray-200">{tm.mark}</span>
                              {tm.grade && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium">
                                  {tm.grade}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                <div className="w-8 h-8 rounded-lg bg-emerald-200 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 flex-shrink-0 text-xs font-bold">
                  {entry.timeSlotName ?? (i + 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{entry.subjectName ?? '—'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{entry.teacherName ?? '—'}</p>
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
          <QuickLink to="/student/profile"      label="My Profile"      desc="View your personal details"   icon={<UserIcon />} />
          <QuickLink to="/student/enrollments"  label="My Enrollments"  desc="Classes & subjects"           icon={<ClipboardIcon />} />
          <QuickLink to="/student/marks"        label="My Marks"        desc="View exam results"            icon={<ChartIcon />} />
          <QuickLink to="/student/timetable"    label="My Timetable"    desc="Weekly class schedule"        icon={<CalendarIcon />} />
          <QuickLink to="/student/analytics"    label="Analytics"       desc="Performance insights & trends" icon={<TrendUpIcon />} />
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
