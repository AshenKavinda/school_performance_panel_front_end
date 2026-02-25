import { useCallback, useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
  PieChart, Pie, Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  getManagerSchoolOverview,
  getManagerPerformanceByCluster,
  getManagerPerformanceBySection,
  getManagerPerformanceBySubject,
  getManagerClassRankings,
  getManagerTermTrend,
  getManagerGPADistribution,
  getManagerTopStudents,
  getManagerTeacherPerformance,
  getManagerAcademicYearComparison,
} from '../../services/analyticsService';
import { PageHeader, LoadingSpinner } from '../../components/common';

// ── Constants ─────────────────────────────────────────────────────────────────
const TERMS = [
  { value: 'FIRST_TERM',  label: 'Term 1' },
  { value: 'SECOND_TERM', label: 'Term 2' },
  { value: 'FINAL_TERM',  label: 'Final'  },
];

const PIE_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#34d399', '#6ee7b7', '#f97316', '#fb923c',
  '#f472b6', '#c084fc',
];

const BAR_PRIMARY   = '#6366f1';
const BAR_SECONDARY = '#8b5cf6';
const BAR_GREEN     = '#10b981';
const BAR_RED       = '#ef4444';
const LINE_PRIMARY  = '#6366f1';
const LINE_ACCENT   = '#a78bfa';

// ── Reusable tiny components ──────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>{children}</div>
);
const SectionTitle = ({ children }) => (
  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">{children}</h3>
);
const EmptyState = ({ text }) => (
  <p className="text-sm text-gray-400 py-8 text-center">{text}</p>
);
const StatCard = ({ label, value, accent }) => (
  <div className={`rounded-xl border p-4 ${accent}`}>
    <p className="text-xs font-medium opacity-75">{label}</p>
    <p className="text-2xl font-bold mt-1">{value ?? '—'}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const ManagerAnalytics = () => {
  const [term, setTerm]       = useState('FIRST_TERM');
  const [loading, setLoading] = useState(true);

  // non-term-dependent
  const [overview, setOverview]       = useState(null);
  const [termTrend, setTermTrend]     = useState([]);
  const [yearComp, setYearComp]       = useState([]);

  // term-dependent
  const [clusterPerf, setClusterPerf] = useState([]);
  const [sectionPerf, setSectionPerf] = useState([]);
  const [subjectPerf, setSubjectPerf] = useState([]);
  const [classRank, setClassRank]     = useState([]);
  const [gpaDistro, setGpaDistro]     = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [teacherPerf, setTeacherPerf] = useState([]);

  const [termLoading, setTermLoading] = useState(false);

  // ── Initial load (non-term data) ──
  const loadGlobal = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, tt, yc] = await Promise.all([
        getManagerSchoolOverview().catch(() => null),
        getManagerTermTrend().catch(() => []),
        getManagerAcademicYearComparison().catch(() => []),
      ]);
      setOverview(ov);
      setTermTrend(Array.isArray(tt) ? tt : []);
      setYearComp(Array.isArray(yc) ? yc : []);
    } catch { /* handled */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGlobal(); }, [loadGlobal]);

  // ── Term-dependent load ──
  useEffect(() => {
    let cancelled = false;
    setTermLoading(true);
    Promise.all([
      getManagerPerformanceByCluster(term).catch(() => []),
      getManagerPerformanceBySection(term).catch(() => []),
      getManagerPerformanceBySubject(term).catch(() => []),
      getManagerClassRankings(term).catch(() => []),
      getManagerGPADistribution(term).catch(() => []),
      getManagerTopStudents(term).catch(() => []),
      getManagerTeacherPerformance(term).catch(() => []),
    ]).then(([cl, se, su, cr, gd, ts, tp]) => {
      if (cancelled) return;
      setClusterPerf(Array.isArray(cl) ? cl : []);
      setSectionPerf(Array.isArray(se) ? se : []);
      setSubjectPerf(Array.isArray(su) ? su : []);
      setClassRank(Array.isArray(cr) ? cr : []);
      setGpaDistro(Array.isArray(gd) ? gd : []);
      setTopStudents(Array.isArray(ts) ? ts : []);
      setTeacherPerf(Array.isArray(tp) ? tp : []);
    }).finally(() => { if (!cancelled) setTermLoading(false); });
    return () => { cancelled = true; };
  }, [term]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;
  }

  const termLabel = TERMS.find(t => t.value === term)?.label ?? term;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="School-wide performance insights" />

      {/* ── SCHOOL OVERVIEW KPIs ── */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Students"  value={overview.totalStudents}  accent="bg-indigo-50 text-indigo-700 border-indigo-200" />
          <StatCard label="Teachers"  value={overview.totalTeachers}  accent="bg-violet-50 text-violet-700 border-violet-200" />
          <StatCard label="Classes"   value={overview.totalClasses}   accent="bg-purple-50 text-purple-700 border-purple-200" />
          <StatCard label="Overall Avg" value={overview.overallAverageMark != null ? `${overview.overallAverageMark.toFixed(1)}%` : '—'} accent="bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" />
        </div>
      )}

      {/* ── TERM SELECTOR ── */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Term:</span>
        {TERMS.map(t => (
          <button
            key={t.value}
            onClick={() => setTerm(t.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              term === t.value
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {termLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <>
          {/* ═══ PERFORMANCE BY CLUSTER ═══ */}
          <Card>
            <SectionTitle>Performance by Cluster — {termLabel}</SectionTitle>
            {clusterPerf.length === 0 ? (
              <EmptyState text="No cluster performance data for this term." />
            ) : (
              <>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clusterPerf} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="clusterName" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="averageMark" name="Avg Mark" fill={BAR_PRIMARY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                        <th className="py-2 pr-4 font-medium">Cluster</th>
                        <th className="py-2 pr-4 font-medium text-right">Average</th>
                        <th className="py-2 pr-4 font-medium text-right">Students</th>
                        <th className="py-2 pr-4 font-medium text-right">Marks Recorded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clusterPerf.map(c => (
                        <tr key={c.clusterId} className="border-b border-gray-100 hover:bg-indigo-50/40">
                          <td className="py-2 pr-4 font-medium text-gray-800 dark:text-gray-200">{c.clusterName ?? '—'}</td>
                          <td className="py-2 pr-4 text-right font-semibold text-indigo-600">{c.averageMark?.toFixed(1) ?? '—'}</td>
                          <td className="py-2 pr-4 text-right">{c.totalStudents ?? 0}</td>
                          <td className="py-2 pr-4 text-right">{c.totalMarksRecorded ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>

          {/* ═══ PERFORMANCE BY SECTION ═══ */}
          <Card>
            <SectionTitle>Performance by Section — {termLabel}</SectionTitle>
            {sectionPerf.length === 0 ? (
              <EmptyState text="No section performance data for this term." />
            ) : (
              <>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectionPerf} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="sectionName" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="averageMark" name="Avg Mark" fill={BAR_SECONDARY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                        <th className="py-2 pr-4 font-medium">Section</th>
                        <th className="py-2 pr-4 font-medium">Cluster</th>
                        <th className="py-2 pr-4 font-medium text-right">Average</th>
                        <th className="py-2 pr-4 font-medium text-right">Students</th>
                        <th className="py-2 pr-4 font-medium text-right">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionPerf.map(s => (
                        <tr key={s.sectionId} className="border-b border-gray-100 hover:bg-violet-50/40">
                          <td className="py-2 pr-4 font-medium text-gray-800 dark:text-gray-200">{s.sectionName ?? '—'}</td>
                          <td className="py-2 pr-4 text-gray-500">{s.clusterName ?? '—'}</td>
                          <td className="py-2 pr-4 text-right font-semibold text-violet-600">{s.averageMark?.toFixed(1) ?? '—'}</td>
                          <td className="py-2 pr-4 text-right">{s.totalStudents ?? 0}</td>
                          <td className="py-2 pr-4 text-right">{s.totalMarksRecorded ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>

          {/* ═══ PERFORMANCE BY SUBJECT ═══ */}
          <Card>
            <SectionTitle>Performance by Subject — {termLabel}</SectionTitle>
            {subjectPerf.length === 0 ? (
              <EmptyState text="No subject performance data for this term." />
            ) : (
              <>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerf} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="subjectName" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="averageMark" name="Avg"     fill={BAR_PRIMARY} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="highestMark" name="Highest" fill={BAR_GREEN}   radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lowestMark"  name="Lowest"  fill={BAR_RED}     radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                        <th className="py-2 pr-3 font-medium">Subject</th>
                        <th className="py-2 pr-3 font-medium text-right">Credit</th>
                        <th className="py-2 pr-3 font-medium text-right">Average</th>
                        <th className="py-2 pr-3 font-medium text-right">Highest</th>
                        <th className="py-2 pr-3 font-medium text-right">Lowest</th>
                        <th className="py-2 pr-3 font-medium text-right">Pass %</th>
                        <th className="py-2 pr-3 font-medium text-right">Records</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectPerf.map(s => (
                        <tr key={s.subjectId} className="border-b border-gray-100 hover:bg-indigo-50/40">
                          <td className="py-2 pr-3 font-medium text-gray-800 dark:text-gray-200">{s.subjectName ?? '—'}</td>
                          <td className="py-2 pr-3 text-right">{s.creditValue ?? '—'}</td>
                          <td className="py-2 pr-3 text-right font-semibold text-indigo-600">{s.averageMark?.toFixed(1) ?? '—'}</td>
                          <td className="py-2 pr-3 text-right text-green-600">{s.highestMark?.toFixed(1) ?? '—'}</td>
                          <td className="py-2 pr-3 text-right text-red-500">{s.lowestMark?.toFixed(1) ?? '—'}</td>
                          <td className="py-2 pr-3 text-right">{s.passRate != null ? `${s.passRate.toFixed(1)}%` : '—'}</td>
                          <td className="py-2 pr-3 text-right">{s.totalMarksRecorded ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>

          {/* ═══ CLASS RANKINGS ═══ */}
          <Card>
            <SectionTitle>Class Rankings — {termLabel}</SectionTitle>
            {classRank.length === 0 ? (
              <EmptyState text="No class ranking data for this term." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                      <th className="py-2 pr-3 font-medium">Rank</th>
                      <th className="py-2 pr-3 font-medium">Class</th>
                      <th className="py-2 pr-3 font-medium">Section</th>
                      <th className="py-2 pr-3 font-medium">Year</th>
                      <th className="py-2 pr-3 font-medium">Type</th>
                      <th className="py-2 pr-3 font-medium text-right">Avg Mark</th>
                      <th className="py-2 pr-3 font-medium text-right">Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classRank.map(c => (
                      <tr key={c.classId} className="border-b border-gray-100 hover:bg-indigo-50/40">
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            c.rank === 1 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : c.rank === 2 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            : c.rank === 3 ? 'bg-orange-100 text-orange-600'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}>{c.rank}</span>
                        </td>
                        <td className="py-2 pr-3 font-medium text-gray-800 dark:text-gray-200">{c.className ?? '—'}</td>
                        <td className="py-2 pr-3 text-gray-500">{c.sectionName ?? '—'}</td>
                        <td className="py-2 pr-3 text-gray-500">{c.academicYear ?? '—'}</td>
                        <td className="py-2 pr-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            c.classType === 'MODULE_BASE' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}>{c.classType === 'MODULE_BASE' ? 'Module' : 'Subject'}</span>
                        </td>
                        <td className="py-2 pr-3 text-right font-semibold text-indigo-600">{c.averageMark?.toFixed(1) ?? '—'}</td>
                        <td className="py-2 pr-3 text-right">{c.totalStudents ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ═══ GPA DISTRIBUTION (Pie) ═══ */}
          <Card>
            <SectionTitle>GPA Distribution — {termLabel}</SectionTitle>
            {gpaDistro.length === 0 ? (
              <EmptyState text="No GPA distribution data for this term." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gpaDistro}
                        dataKey="studentCount"
                        nameKey="grade"
                        cx="50%" cy="50%"
                        outerRadius={100}
                        label={({ grade, percentage }) => `${grade} (${percentage?.toFixed(1)}%)`}
                        labelLine
                      >
                        {gpaDistro.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, name) => [`${v} students`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {gpaDistro.map((g, i) => (
                    <div key={g.grade ?? i} className="flex items-center gap-2 text-sm py-1">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="font-medium text-gray-700 w-10">{g.grade ?? '—'}</span>
                      <span className="text-gray-400 text-xs w-12">GP {g.gradePoint ?? '—'}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 mx-2">
                        <div className="h-2 rounded-full" style={{ width: `${g.percentage ?? 0}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                      <span className="text-gray-500 text-xs w-20 text-right">{g.studentCount} ({g.percentage?.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* ═══ TOP STUDENTS ═══ */}
          <Card>
            <SectionTitle>Top Students — {termLabel}</SectionTitle>
            {topStudents.length === 0 ? (
              <EmptyState text="No top student data for this term." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                      <th className="py-2 pr-3 font-medium">Rank</th>
                      <th className="py-2 pr-3 font-medium">Student</th>
                      <th className="py-2 pr-3 font-medium">Index No.</th>
                      <th className="py-2 pr-3 font-medium">Class</th>
                      <th className="py-2 pr-3 font-medium">Section</th>
                      <th className="py-2 pr-3 font-medium text-right">Avg Mark</th>
                      <th className="py-2 pr-3 font-medium text-right">GPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStudents.map(s => (
                      <tr key={s.studentId} className="border-b border-gray-100 hover:bg-indigo-50/40">
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            s.rank === 1 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : s.rank === 2 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            : s.rank === 3 ? 'bg-orange-100 text-orange-600'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}>{s.rank}</span>
                        </td>
                        <td className="py-2 pr-3 font-medium text-gray-800 dark:text-gray-200">{s.studentName ?? '—'}</td>
                        <td className="py-2 pr-3 text-gray-500">{s.indexNumber ?? '—'}</td>
                        <td className="py-2 pr-3 text-gray-500">{s.className ?? '—'}</td>
                        <td className="py-2 pr-3 text-gray-500">{s.sectionName ?? '—'}</td>
                        <td className="py-2 pr-3 text-right font-semibold text-indigo-600">{s.averageMark?.toFixed(1) ?? '—'}</td>
                        <td className="py-2 pr-3 text-right font-semibold">{s.gpa?.toFixed(2) ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ═══ TEACHER PERFORMANCE ═══ */}
          <Card>
            <SectionTitle>Teacher Performance — {termLabel}</SectionTitle>
            {teacherPerf.length === 0 ? (
              <EmptyState text="No teacher performance data for this term." />
            ) : (
              <>
                <div className="w-full h-72 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teacherPerf} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="teacherName" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="averageClassMark" name="Avg Class Mark" fill={BAR_PRIMARY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                        <th className="py-2 pr-3 font-medium">#</th>
                        <th className="py-2 pr-3 font-medium">Teacher</th>
                        <th className="py-2 pr-3 font-medium text-right">Classes</th>
                        <th className="py-2 pr-3 font-medium text-right">Subjects</th>
                        <th className="py-2 pr-3 font-medium text-right">Avg Mark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherPerf.map((t, i) => (
                        <tr key={t.teacherId} className="border-b border-gray-100 hover:bg-indigo-50/40">
                          <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                          <td className="py-2 pr-3 font-medium text-gray-800 dark:text-gray-200">{t.teacherName ?? '—'}</td>
                          <td className="py-2 pr-3 text-right">{t.classesTaught ?? 0}</td>
                          <td className="py-2 pr-3 text-right">{t.subjectsTaught ?? 0}</td>
                          <td className="py-2 pr-3 text-right font-semibold text-indigo-600">{t.averageClassMark?.toFixed(1) ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {/* ═══ TERM TREND (non-term-dependent) ═══ */}
      <Card>
        <SectionTitle>Term Trend — All Terms</SectionTitle>
        {termTrend.length === 0 ? (
          <EmptyState text="No term trend data available." />
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={termTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="term" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="averageMark" name="Avg Mark" stroke={LINE_PRIMARY} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="totalMarksRecorded" name="Marks Recorded" stroke={LINE_ACCENT} strokeWidth={2} dot={{ r: 3 }} yAxisId={0} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ═══ ACADEMIC YEAR COMPARISON ═══ */}
      <Card>
        <SectionTitle>Academic Year Comparison</SectionTitle>
        {yearComp.length === 0 ? (
          <EmptyState text="No academic year comparison data available." />
        ) : (
          <>
            <div className="w-full h-72 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearComp} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="academicYear" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="averageMark" name="Avg Mark" fill={BAR_PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                    <th className="py-2 pr-4 font-medium">Year</th>
                    <th className="py-2 pr-4 font-medium text-right">Average</th>
                    <th className="py-2 pr-4 font-medium text-right">Students</th>
                    <th className="py-2 pr-4 font-medium text-right">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {yearComp.map(y => (
                    <tr key={y.academicYear} className="border-b border-gray-100 hover:bg-indigo-50/40">
                      <td className="py-2 pr-4 font-medium text-gray-800 dark:text-gray-200">{y.academicYear ?? '—'}</td>
                      <td className="py-2 pr-4 text-right font-semibold text-indigo-600">{y.averageMark?.toFixed(1) ?? '—'}</td>
                      <td className="py-2 pr-4 text-right">{y.totalStudents ?? 0}</td>
                      <td className="py-2 pr-4 text-right">{y.totalMarksRecorded ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ManagerAnalytics;
