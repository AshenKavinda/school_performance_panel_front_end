import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getClustersByOperator, getSectionsByOperator, getClassesByOperator,
  getTeachersByOperator, getStudentsByOperator, getSubjectsByOperator, getModulesByOperator,
} from '../../services/managementService';
import { useOperator } from '../../context/OperatorContext';
import { PageHeader } from '../../components/common';

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent, loading }) => (
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
    </div>
  </div>
);

// ── Quick link card ───────────────────────────────────────────────────────────
const QuickLink = ({ to, label, desc, icon }) => (
  <Link
    to={to}
    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition group"
  >
    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0 group-hover:bg-teal-200 transition">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-800 group-hover:text-teal-700">{label}</p>
      {desc && <p className="text-xs text-gray-400 truncate">{desc}</p>}
    </div>
    <svg className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0 group-hover:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </Link>
);

// ── Icons ─────────────────────────────────────────────────────────────────────
const FolderIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.707 6.707A1 1 0 0011.414 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>;
const GridIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const AcademicIcon= () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 7v-7m0 0L3 9m9 5l9-5" /></svg>;
const BookIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const UsersIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const GroupIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const PuzzleIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>;
const ClipIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const AssignIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ClockIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CalendarIcon= () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const UserIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const OperatorOverview = () => {
  const [counts,  setCounts]  = useState({ clusters: 0, sections: 0, classes: 0, teachers: 0, students: 0, subjects: 0, modules: 0 });
  const [loading, setLoading] = useState(true);

  const { operatorId } = useOperator();

  const fetchAll = useCallback(async () => {
    if (!operatorId) { setLoading(false); return; }
    setLoading(true);
    const [clusRes, secRes, clsRes, tchRes, stuRes, subRes, modRes] = await Promise.allSettled([
      getClustersByOperator(operatorId),
      getSectionsByOperator(operatorId),
      getClassesByOperator(operatorId),
      getTeachersByOperator(operatorId),
      getStudentsByOperator(operatorId),
      getSubjectsByOperator(operatorId),
      getModulesByOperator(operatorId),
    ]);
    const safe = (res) => (res.status === 'fulfilled' && Array.isArray(res.value))
      ? res.value.filter(r => !r.isDeleted).length
      : 0;
    setCounts({
      clusters: safe(clusRes),
      sections: safe(secRes),
      classes:  safe(clsRes),
      teachers: safe(tchRes),
      students: safe(stuRes),
      subjects: safe(subRes),
      modules:  safe(modRes),
    });
    setLoading(false);
  }, [operatorId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-6">
      <PageHeader title="Operator Overview" subtitle="Manage your school's academic structure" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard loading={loading} label="Clusters"  value={counts.clusters}  accent="bg-teal-50   text-teal-700   border-teal-200"   icon={<FolderIcon />} />
        <StatCard loading={loading} label="Sections"  value={counts.sections}  accent="bg-emerald-50 text-emerald-700 border-emerald-200" icon={<GridIcon />} />
        <StatCard loading={loading} label="Classes"   value={counts.classes}   accent="bg-green-50  text-green-700  border-green-200"   icon={<AcademicIcon />} />
        <StatCard loading={loading} label="Subjects"  value={counts.subjects}  accent="bg-cyan-50   text-cyan-700   border-cyan-200"    icon={<BookIcon />} />
        <StatCard loading={loading} label="Modules"   value={counts.modules}   accent="bg-sky-50    text-sky-700    border-sky-200"     icon={<PuzzleIcon />} />
        <StatCard loading={loading} label="Teachers"  value={counts.teachers}  accent="bg-lime-50   text-lime-700   border-lime-200"    icon={<UsersIcon />} />
        <StatCard loading={loading} label="Students"  value={counts.students}  accent="bg-yellow-50 text-yellow-700 border-yellow-200"  icon={<GroupIcon />} />
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Access</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink to="../clusters"            label="Clusters"             desc="Manage school clusters"            icon={<FolderIcon />} />
          <QuickLink to="../sections"            label="Sections"             desc="Manage sections within clusters"   icon={<GridIcon />} />
          <QuickLink to="../classes"             label="Classes"              desc="Create and manage classes"         icon={<AcademicIcon />} />
          <QuickLink to="../subjects"            label="Subjects"             desc="Define subjects"                   icon={<BookIcon />} />
          <QuickLink to="../modules"             label="Modules"              desc="Configure module-based subjects"   icon={<PuzzleIcon />} />
          <QuickLink to="../teachers"            label="Teachers"             desc="Add and manage teachers"           icon={<UsersIcon />} />
          <QuickLink to="../students"            label="Students"             desc="Manage student records"            icon={<GroupIcon />} />
          <QuickLink to="../enrollments"         label="Enrollments"          desc="Enroll students in classes"        icon={<ClipIcon />} />
          <QuickLink to="../teacher-assignments" label="Teacher Assignments"  desc="Assign teachers to subjects"       icon={<AssignIcon />} />
          <QuickLink to="../timeslots"           label="Time Slots"           desc="Define school time slots"          icon={<ClockIcon />} />
          <QuickLink to="../timetable"           label="Timetable"            desc="Build and view weekly timetables"  icon={<CalendarIcon />} />
          <QuickLink to="../profile"             label="My Profile"           desc="View & update your profile"        icon={<UserIcon />} />
        </div>
      </div>
    </div>
  );
};

export default OperatorOverview;
