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
  getManagerModulePerformance,
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
const BAR_MODULE    = '#8b5cf6';
const LINE_PRIMARY  = '#6366f1';
const LINE_ACCENT   = '#a78bfa';

// ── View tabs ─────────────────────────────────────────────────────────────────
const VIEWS = [
  { key: 'subject', label: 'Subject-Based Classes', icon: '📚' },
  { key: 'module',  label: 'Module-Based Classes',  icon: '🧩' },
];

// ── Reusable tiny components ──────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>{children}</div>
);
const SectionTitle = ({ children }) => (
  <h3 className="text-base font-semibold text-gray-800 mb-4">{children}</h3>
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
  const [activeView, setActiveView] = useState('subject');
  const [term, setTerm]       = useState('FIRST_TERM');
  const [loading, setLoading] = useState(true);

  // non-term-dependent
  const [overview, setOverview]       = useState(null);
  const [termTrend, setTermTrend]     = useState([]);
  const [yearComp, setYearComp]       = useState([]);
  const [modulePerf, setModulePerf]   = useState([]);

  // term-dependent (subject-based)
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
      const [ov, tt, yc, mp] = await Promise.all([
        getManagerSchoolOverview().catch(e => { console.error('school-overview failed', e); return null; }),
        getManagerTermTrend().catch(e => { console.error('term-trend failed', e); return []; }),
        getManagerAcademicYearComparison().catch(e => { console.error('year-comparison failed', e); return []; }),
        getManagerModulePerformance().catch(e => { console.error('module-performance failed', e); return []; }),
      ]);
      setOverview(ov);
      setTermTrend(Array.isArray(tt) ? tt : []);
      setYearComp(Array.isArray(yc) ? yc : []);
      setModulePerf(Array.isArray(mp) ? mp : []);
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

  // ── Derived module data ──
  const modulesBySubject = modulePerf.reduce((acc, m) => {
    const key = m.subjectName ?? 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const moduleSubjectSummary = Object.entries(modulesBySubject).map(([name, modules]) => ({
    subjectName: name,
    moduleCount: modules.length,
    avgMark: modules.length ? +(modules.reduce((s, m) => s + (m.averageMark ?? 0), 0) / modules.length).toFixed(1) : 0,
    highest: Math.max(...modules.map(m => m.highestMark ?? 0)),
    lowest: Math.min(...modules.map(m => m.lowestMark ?? 100)),
    totalRecords: modules.reduce((s, m) => s + (m.totalMarksRecorded ?? 0), 0),
  }));

  const modulesBySection = modulePerf.reduce((acc, m) => {
    const key = m.sectionName ?? 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const moduleSectionSummary = Object.entries(modulesBySection).map(([name, modules]) => ({
    sectionName: name,
    moduleCount: modules.length,
    avgMark: modules.length ? +(modules.reduce((s, m) => s + (m.averageMark ?? 0), 0) / modules.length).toFixed(1) : 0,
    totalRecords: modules.reduce((s, m) => s + (m.totalMarksRecorded ?? 0), 0),
  }));

  // Filter class rankings by type
  const subjectClassRanks = classRank.filter(c => c.classType !== 'MODULE_BASE');
  const moduleClassRanks  = classRank.filter(c => c.classType === 'MODULE_BASE');

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

      {/* ── VIEW SWITCHER (Subject vs Module) ── */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1.5">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setActiveView(v.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeView === v.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700:text-gray-300'
            }`}
          >
            <span>{v.icon}</span>
            {v.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/*  SUBJECT-BASED ANALYTICS VIEW                                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeView === 'subject' && (
        <div className="space-y-6">
          {/* ── TERM SELECTOR ── */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Term:</span>
            {TERMS.map(t => (
              <button
                key={t.value}
                onClick={() => setTerm(t.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  term === t.value
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200:bg-gray-600'
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
                          <tr className="border-b border-gray-200 text-left text-gray-500">
                            <th className="py-2 pr-4 font-medium">Cluster</th>
                            <th className="py-2 pr-4 font-medium text-right">Average</th>
                            <th className="py-2 pr-4 font-medium text-right">Students</th>
                            <th className="py-2 pr-4 font-medium text-right">Marks Recorded</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clusterPerf.map(c => (
                            <tr key={c.clusterId} className="border-b border-gray-100 hover:bg-indigo-50/40:bg-indigo-900/20">
                              <td className="py-2 pr-4 font-medium text-gray-800">{c.clusterName ?? '—'}</td>
                              <td className="py-2 pr-4 text-right font-semibold text-indigo-600">{c.averageMark?.toFixed(1) ?? '—'}</td>
                              <td className="py-2 pr-4 text-right text-gray-700">{c.totalStudents ?? 0}</td>
                              <td className="py-2 pr-4 text-right text-gray-700">{c.totalMarksRecorded ?? 0}</td>
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
                          <tr className="border-b border-gray-200 text-left text-gray-500">
                            <th className="py-2 pr-4 font-medium">Section</th>
                            <th className="py-2 pr-4 font-medium">Cluster</th>
                            <th className="py-2 pr-4 font-medium text-right">Average</th>
                            <th className="py-2 pr-4 font-medium text-right">Students</th>
                            <th className="py-2 pr-4 font-medium text-right">Marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sectionPerf.map(s => (
                            <tr key={s.sectionId} className="border-b border-gray-100 hover:bg-violet-50/40:bg-violet-900/20">
                              <td className="py-2 pr-4 font-medium text-gray-800">{s.sectionName ?? '—'}</td>
                              <td className="py-2 pr-4 text-gray-500">{s.clusterName ?? '—'}</td>
                              <td className="py-2 pr-4 text-right font-semibold text-violet-600">{s.averageMark?.toFixed(1) ?? '—'}</td>
                              <td className="py-2 pr-4 text-right text-gray-700">{s.totalStudents ?? 0}</td>
                              <td className="py-2 pr-4 text-right text-gray-700">{s.totalMarksRecorded ?? 0}</td>
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
                          <tr className="border-b border-gray-200 text-left text-gray-500">
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
                            <tr key={s.subjectId} className="border-b border-gray-100 hover:bg-indigo-50/40:bg-indigo-900/20">
                              <td className="py-2 pr-3 font-medium text-gray-800">{s.subjectName ?? '—'}</td>
                              <td className="py-2 pr-3 text-right text-gray-700">{s.creditValue ?? '—'}</td>
                              <td className="py-2 pr-3 text-right font-semibold text-indigo-600">{s.averageMark?.toFixed(1) ?? '—'}</td>
                              <td className="py-2 pr-3 text-right text-green-600">{s.highestMark?.toFixed(1) ?? '—'}</td>
                              <td className="py-2 pr-3 text-right text-red-500">{s.lowestMark?.toFixed(1) ?? '—'}</td>
                              <td className="py-2 pr-3 text-right text-gray-700">{s.passRate != null ? `${s.passRate.toFixed(1)}%` : '—'}</td>
                              <td className="py-2 pr-3 text-right text-gray-700">{s.totalMarksRecorded ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Card>

              {/* ═══ SUBJECT-BASED CLASS RANKINGS ═══ */}
              <Card>
                <SectionTitle>Subject-Based Class Rankings — {termLabel}</SectionTitle>
                {subjectClassRanks.length === 0 ? (
                  <EmptyState text="No subject-based class ranking data for this term." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500">
                          <th className="py-2 pr-3 font-medium">Rank</th>
                          <th className="py-2 pr-3 font-medium">Class</th>
                          <th className="py-2 pr-3 font-medium">Section</th>
                          <th className="py-2 pr-3 font-medium">Year</th>
                          <th className="py-2 pr-3 font-medium text-right">Avg Mark</th>
                          <th className="py-2 pr-3 font-medium text-right">Students</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectClassRanks.map((c, i) => (
                          <tr key={c.classId} className="border-b border-gray-100 hover:bg-indigo-50/40:bg-indigo-900/20">
                            <td className="py-2 pr-3">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                i === 0 ? 'bg-yellow-100 text-yellow-700'
                                : i === 1 ? 'bg-gray-100 text-gray-600'
                                : i === 2 ? 'bg-orange-100 text-orange-600'
                                : 'bg-gray-50 text-gray-500'
                              }`}>{i + 1}</span>
                            </td>
                            <td className="py-2 pr-3 font-medium text-gray-800">{c.className ?? '—'}</td>
                            <td className="py-2 pr-3 text-gray-500">{c.sectionName ?? '—'}</td>
                            <td className="py-2 pr-3 text-gray-500">{c.academicYear ?? '—'}</td>
                            <td className="py-2 pr-3 text-right font-semibold text-indigo-600">{c.averageMark?.toFixed(1) ?? '—'}</td>
                            <td className="py-2 pr-3 text-right text-gray-700">{c.totalStudents ?? 0}</td>
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
                        <tr className="border-b border-gray-200 text-left text-gray-500">
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
                          <tr key={s.studentId} className="border-b border-gray-100 hover:bg-indigo-50/40:bg-indigo-900/20">
                            <td className="py-2 pr-3">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                s.rank === 1 ? 'bg-yellow-100 text-yellow-700'
                                : s.rank === 2 ? 'bg-gray-100 text-gray-600'
                                : s.rank === 3 ? 'bg-orange-100 text-orange-600'
                                : 'bg-gray-50 text-gray-500'
                              }`}>{s.rank}</span>
                            </td>
                            <td className="py-2 pr-3 font-medium text-gray-800">{s.studentName ?? '—'}</td>
                            <td className="py-2 pr-3 text-gray-500">{s.indexNumber ?? '—'}</td>
                            <td className="py-2 pr-3 text-gray-500">{s.className ?? '—'}</td>
                            <td className="py-2 pr-3 text-gray-500">{s.sectionName ?? '—'}</td>
                            <td className="py-2 pr-3 text-right font-semibold text-indigo-600">{s.averageMark?.toFixed(1) ?? '—'}</td>
                            <td className="py-2 pr-3 text-right font-semibold text-gray-700">{s.gpa?.toFixed(2) ?? '—'}</td>
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
                          <tr className="border-b border-gray-200 text-left text-gray-500">
                            <th className="py-2 pr-3 font-medium">#</th>
                            <th className="py-2 pr-3 font-medium">Teacher</th>
                            <th className="py-2 pr-3 font-medium text-right">Classes</th>
                            <th className="py-2 pr-3 font-medium text-right">Subjects</th>
                            <th className="py-2 pr-3 font-medium text-right">Avg Mark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacherPerf.map((t, i) => (
                            <tr key={t.teacherId} className="border-b border-gray-100 hover:bg-indigo-50/40:bg-indigo-900/20">
                              <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                              <td className="py-2 pr-3 font-medium text-gray-800">{t.teacherName ?? '—'}</td>
                              <td className="py-2 pr-3 text-right text-gray-700">{t.classesTaught ?? 0}</td>
                              <td className="py-2 pr-3 text-right text-gray-700">{t.subjectsTaught ?? 0}</td>
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
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-2 pr-4 font-medium">Year</th>
                        <th className="py-2 pr-4 font-medium text-right">Average</th>
                        <th className="py-2 pr-4 font-medium text-right">Students</th>
                        <th className="py-2 pr-4 font-medium text-right">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearComp.map(y => (
                        <tr key={y.academicYear} className="border-b border-gray-100 hover:bg-indigo-50/40:bg-indigo-900/20">
                          <td className="py-2 pr-4 font-medium text-gray-800">{y.academicYear ?? '—'}</td>
                          <td className="py-2 pr-4 text-right font-semibold text-indigo-600">{y.averageMark?.toFixed(1) ?? '—'}</td>
                          <td className="py-2 pr-4 text-right text-gray-700">{y.totalStudents ?? 0}</td>
                          <td className="py-2 pr-4 text-right text-gray-700">{y.totalMarksRecorded ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/*  MODULE-BASED ANALYTICS VIEW                                   */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeView === 'module' && (
        <div className="space-y-6">

          {/* ── Module KPI Summary ── */}
          {modulePerf.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Modules"
                value={modulePerf.length}
                accent="bg-purple-50 text-purple-700 border-purple-200"
              />
              <StatCard
                label="Avg Module Mark"
                value={modulePerf.length ? `${(modulePerf.reduce((s, m) => s + (m.averageMark ?? 0), 0) / modulePerf.length).toFixed(1)}%` : '—'}
                accent="bg-violet-50 text-violet-700 border-violet-200"
              />
              <StatCard
                label="Subjects"
                value={Object.keys(modulesBySubject).length}
                accent="bg-indigo-50 text-indigo-700 border-indigo-200"
              />
              <StatCard
                label="Total Records"
                value={modulePerf.reduce((s, m) => s + (m.totalMarksRecorded ?? 0), 0)}
                accent="bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
              />
            </div>
          )}

          {/* ═══ MODULE PERFORMANCE CHART ═══ */}
          <Card>
            <SectionTitle>Module Performance Overview</SectionTitle>
            {modulePerf.length === 0 ? (
              <EmptyState text="No module performance data available." />
            ) : (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modulePerf} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="moduleName"
                      tick={{ fontSize: 9 }}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      formatter={(v, name) => [`${Number(v).toFixed(1)}`, name]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${label} (${item.subjectName} — ${item.sectionName})` : label;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="averageMark" name="Avg"     fill={BAR_MODULE}  radius={[4, 4, 0, 0]} />
                    <Bar dataKey="highestMark" name="Highest" fill={BAR_GREEN}   radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lowestMark"  name="Lowest"  fill={BAR_RED}     radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* ═══ MODULE PERFORMANCE BY SUBJECT SUMMARY ═══ */}
          <Card>
            <SectionTitle>Module Summary by Subject</SectionTitle>
            {moduleSubjectSummary.length === 0 ? (
              <EmptyState text="No module data available." />
            ) : (
              <>
                <div className="w-full h-72 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moduleSubjectSummary} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="subjectName" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="avgMark"  name="Avg Mark" fill={BAR_MODULE} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="highest"  name="Highest" fill={BAR_GREEN}  radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lowest"   name="Lowest"  fill={BAR_RED}    radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-2 pr-3 font-medium">Subject</th>
                        <th className="py-2 pr-3 font-medium text-right">Modules</th>
                        <th className="py-2 pr-3 font-medium text-right">Avg Mark</th>
                        <th className="py-2 pr-3 font-medium text-right">Highest</th>
                        <th className="py-2 pr-3 font-medium text-right">Lowest</th>
                        <th className="py-2 pr-3 font-medium text-right">Records</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moduleSubjectSummary.map(s => (
                        <tr key={s.subjectName} className="border-b border-gray-100 hover:bg-purple-50/40:bg-purple-900/20">
                          <td className="py-2 pr-3 font-medium text-gray-800">{s.subjectName}</td>
                          <td className="py-2 pr-3 text-right text-gray-700">{s.moduleCount}</td>
                          <td className="py-2 pr-3 text-right font-semibold text-purple-600">{s.avgMark}</td>
                          <td className="py-2 pr-3 text-right text-green-600">{s.highest?.toFixed(1) ?? '—'}</td>
                          <td className="py-2 pr-3 text-right text-red-500">{s.lowest?.toFixed(1) ?? '—'}</td>
                          <td className="py-2 pr-3 text-right text-gray-700">{s.totalRecords}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>

          {/* ═══ MODULE PERFORMANCE BY SECTION ═══ */}
          <Card>
            <SectionTitle>Module Summary by Section</SectionTitle>
            {moduleSectionSummary.length === 0 ? (
              <EmptyState text="No section-level module data available." />
            ) : (
              <>
                <div className="w-full h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moduleSectionSummary} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="sectionName" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="avgMark" name="Avg Mark" fill={BAR_MODULE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-2 pr-4 font-medium">Section</th>
                        <th className="py-2 pr-4 font-medium text-right">Modules</th>
                        <th className="py-2 pr-4 font-medium text-right">Avg Mark</th>
                        <th className="py-2 pr-4 font-medium text-right">Records</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moduleSectionSummary.map(s => (
                        <tr key={s.sectionName} className="border-b border-gray-100 hover:bg-purple-50/40:bg-purple-900/20">
                          <td className="py-2 pr-4 font-medium text-gray-800">{s.sectionName}</td>
                          <td className="py-2 pr-4 text-right text-gray-700">{s.moduleCount}</td>
                          <td className="py-2 pr-4 text-right font-semibold text-purple-600">{s.avgMark}</td>
                          <td className="py-2 pr-4 text-right text-gray-700">{s.totalRecords}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>

          {/* ═══ MODULE-BASED CLASS RANKINGS ═══ */}
          <Card>
            <SectionTitle>Module-Based Class Rankings</SectionTitle>
            {moduleClassRanks.length === 0 ? (
              <EmptyState text="No module-based class ranking data available. Select a term from the Subject-Based view to load rankings." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 pr-3 font-medium">Rank</th>
                      <th className="py-2 pr-3 font-medium">Class</th>
                      <th className="py-2 pr-3 font-medium">Section</th>
                      <th className="py-2 pr-3 font-medium">Year</th>
                      <th className="py-2 pr-3 font-medium text-right">Avg Mark</th>
                      <th className="py-2 pr-3 font-medium text-right">Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleClassRanks.map((c, i) => (
                      <tr key={c.classId} className="border-b border-gray-100 hover:bg-purple-50/40:bg-purple-900/20">
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            i === 0 ? 'bg-yellow-100 text-yellow-700'
                            : i === 1 ? 'bg-gray-100 text-gray-600'
                            : i === 2 ? 'bg-orange-100 text-orange-600'
                            : 'bg-gray-50 text-gray-500'
                          }`}>{i + 1}</span>
                        </td>
                        <td className="py-2 pr-3 font-medium text-gray-800">{c.className ?? '—'}</td>
                        <td className="py-2 pr-3 text-gray-500">{c.sectionName ?? '—'}</td>
                        <td className="py-2 pr-3 text-gray-500">{c.academicYear ?? '—'}</td>
                        <td className="py-2 pr-3 text-right font-semibold text-purple-600">{c.averageMark?.toFixed(1) ?? '—'}</td>
                        <td className="py-2 pr-3 text-right text-gray-700">{c.totalStudents ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ═══ DETAILED MODULE TABLE ═══ */}
          <Card>
            <SectionTitle>All Modules — Detailed Performance</SectionTitle>
            {modulePerf.length === 0 ? (
              <EmptyState text="No module performance data available." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 pr-3 font-medium">Module</th>
                      <th className="py-2 pr-3 font-medium">Subject</th>
                      <th className="py-2 pr-3 font-medium">Section</th>
                      <th className="py-2 pr-3 font-medium text-right">Weight</th>
                      <th className="py-2 pr-3 font-medium text-right">Average</th>
                      <th className="py-2 pr-3 font-medium text-right">Highest</th>
                      <th className="py-2 pr-3 font-medium text-right">Lowest</th>
                      <th className="py-2 pr-3 font-medium text-right">Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modulePerf.map(m => (
                      <tr key={m.moduleId} className="border-b border-gray-100 hover:bg-purple-50/40:bg-purple-900/20">
                        <td className="py-2 pr-3 font-medium text-gray-800">{m.moduleName ?? '—'}</td>
                        <td className="py-2 pr-3 text-gray-500">{m.subjectName ?? '—'}</td>
                        <td className="py-2 pr-3 text-gray-500">{m.sectionName ?? '—'}</td>
                        <td className="py-2 pr-3 text-right text-gray-700">{m.moduleWeight ?? '—'}</td>
                        <td className="py-2 pr-3 text-right font-semibold text-purple-600">{m.averageMark?.toFixed(1) ?? '—'}</td>
                        <td className="py-2 pr-3 text-right text-green-600">{m.highestMark?.toFixed(1) ?? '—'}</td>
                        <td className="py-2 pr-3 text-right text-red-500">{m.lowestMark?.toFixed(1) ?? '—'}</td>
                        <td className="py-2 pr-3 text-right text-gray-700">{m.totalMarksRecorded ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default ManagerAnalytics;
