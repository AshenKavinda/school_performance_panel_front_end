import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import {
  getTeacherMyClasses,
  getTeacherSubjectAverages,
  getTeacherGradeDistribution,
  getTeacherStudentRankings,
  getTeacherAtRiskStudents,
  getTeacherClassComparison,
  getTeacherModulePerformance,
} from '../../services/analyticsService';
import { PageHeader, LoadingSpinner } from '../../components/common';

// ── constants ─────────────────────────────────────────────────────────────────
const TERMS = [
  { value: 'FIRST_TERM',  label: 'Term 1' },
  { value: 'SECOND_TERM', label: 'Term 2' },
  { value: 'FINAL_TERM',  label: 'Final'  },
];

const PIE_COLORS = [
  '#f97316', '#fb923c', '#fdba74', '#fde68a',
  '#34d399', '#6ee7b7', '#a78bfa', '#818cf8',
  '#f472b6', '#c084fc',
];

const BAR_ORANGE = '#f97316';
const BAR_GREEN  = '#10b981';
const BAR_RED    = '#ef4444';

// ── tiny reusable components ──────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-base font-semibold text-gray-800 mb-4">{children}</h3>
);

const Select = ({ value, onChange, options, placeholder, className = '' }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={`rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const EmptyState = ({ text }) => (
  <p className="text-sm text-gray-400 py-8 text-center">{text}</p>
);

const StatMini = ({ label, value, accent = 'text-gray-800' }) => (
  <div className="text-center">
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className={`text-lg font-bold ${accent}`}>{value ?? '—'}</p>
  </div>
);

const StatCard = ({ label, value, accent }) => (
  <div className={`rounded-xl border p-4 ${accent}`}>
    <p className="text-xs font-medium opacity-75">{label}</p>
    <p className="text-2xl font-bold mt-1">{value ?? '—'}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  SUBJECT-BASE ANALYTICS SUB-COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const SubjectBaseAnalytics = ({ selectedClass, myClasses }) => {
  const [term, setTerm]                       = useState('FIRST_TERM');
  const [loading, setLoading]                 = useState(true);
  const [subjectAverages, setSubjectAverages] = useState([]);
  const [atRiskStudents, setAtRiskStudents]   = useState([]);

  // drill-down: grade distribution + rankings
  const [selectedClassSubject, setSelectedClassSubject] = useState('');
  const [gradeDistribution, setGradeDistribution]      = useState([]);
  const [studentRankings, setStudentRankings]           = useState([]);
  const [drillLoading, setDrillLoading]                 = useState(false);

  // class comparison
  const [compSubjectId, setCompSubjectId]     = useState('');
  const [classComparison, setClassComparison] = useState([]);
  const [compLoading, setCompLoading]         = useState(false);

  // ── derived: subject-base classes only ──
  const subjectBaseClasses = useMemo(
    () => myClasses.filter(c => c.classType === 'SUBJECT_BASE'),
    [myClasses],
  );

  // class-subject combos for the selected class
  const classSubjectOptions = useMemo(
    () => subjectBaseClasses
      .filter(c => c.classId === selectedClass.classId)
      .map(c => ({
        value: `${c.classId}|${c.subjectId}`,
        label: `${c.className ?? '—'} — ${c.subjectName ?? '—'}`,
      })),
    [subjectBaseClasses, selectedClass.classId],
  );

  // unique subjects across all subject-base classes (for comparison)
  const uniqueSubjects = useMemo(() => {
    const map = new Map();
    subjectBaseClasses.forEach(c => {
      if (c.subjectId && !map.has(c.subjectId)) {
        map.set(c.subjectId, c.subjectName ?? c.subjectId);
      }
    });
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [subjectBaseClasses]);

  // ── load subject averages + at-risk when term changes ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getTeacherSubjectAverages(term),
      getTeacherAtRiskStudents(term),
    ])
      .then(([avgs, risk]) => {
        if (cancelled) return;
        setSubjectAverages(Array.isArray(avgs) ? avgs : []);
        setAtRiskStudents(Array.isArray(risk) ? risk : []);
      })
      .catch(e => console.error('[SubjectBaseAnalytics] load failed', e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [term]);

  // reset drill-down when term changes
  useEffect(() => {
    setSelectedClassSubject('');
    setGradeDistribution([]);
    setStudentRankings([]);
  }, [term]);

  // ── drill-down: grade distribution + rankings ──
  useEffect(() => {
    if (!selectedClassSubject) {
      setGradeDistribution([]);
      setStudentRankings([]);
      return;
    }
    const [classId, subjectId] = selectedClassSubject.split('|');
    let cancelled = false;
    setDrillLoading(true);
    Promise.all([
      getTeacherGradeDistribution(classId, subjectId, term),
      getTeacherStudentRankings(classId, subjectId, term),
    ])
      .then(([gd, sr]) => {
        if (cancelled) return;
        setGradeDistribution(Array.isArray(gd) ? gd : []);
        setStudentRankings(Array.isArray(sr) ? sr : []);
      })
      .catch(e => console.error('[SubjectBaseAnalytics] drill-down failed', e))
      .finally(() => { if (!cancelled) setDrillLoading(false); });
    return () => { cancelled = true; };
  }, [selectedClassSubject, term]);

  // ── class comparison ──
  useEffect(() => {
    if (!compSubjectId) { setClassComparison([]); return; }
    let cancelled = false;
    setCompLoading(true);
    getTeacherClassComparison(compSubjectId, term)
      .then(d => { if (!cancelled) setClassComparison(Array.isArray(d) ? d : []); })
      .catch(e => console.error('[SubjectBaseAnalytics] comparison failed', e))
      .finally(() => { if (!cancelled) setCompLoading(false); });
    return () => { cancelled = true; };
  }, [compSubjectId, term]);

  // ── filter averages & at-risk for selected class ──
  const filteredAverages = useMemo(
    () => subjectAverages.filter(s => s.classId === selectedClass.classId),
    [subjectAverages, selectedClass.classId],
  );

  const filteredAtRisk = useMemo(
    () => atRiskStudents.filter(s => s.className === selectedClass.className),
    [atRiskStudents, selectedClass.className],
  );

  const termLabel = TERMS.find(t => t.value === term)?.label ?? term;

  return (
    <div className="space-y-6">
      {/* ── Term selector ── */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600">Term:</span>
        {TERMS.map(t => (
          <button
            key={t.value}
            onClick={() => setTerm(t.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              term === t.value
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <>
          {/* ═══ SUBJECT AVERAGES ═══ */}
          <Card>
            <SectionTitle>Subject Averages — {termLabel}</SectionTitle>
            {filteredAverages.length === 0 ? (
              <EmptyState text="No subject average data available for this term and class." />
            ) : (
              <>
                <div className="w-full h-72 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredAverages} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="subjectName" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={v => [`${Number(v).toFixed(1)}`, '']} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="averageMark" name="Average" fill={BAR_ORANGE} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="highestMark" name="Highest" fill={BAR_GREEN}  radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lowestMark"  name="Lowest"  fill={BAR_RED}    radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-2 pr-4 font-medium">Subject</th>
                        <th className="py-2 pr-4 font-medium text-right">Average</th>
                        <th className="py-2 pr-4 font-medium text-right">Highest</th>
                        <th className="py-2 pr-4 font-medium text-right">Lowest</th>
                        <th className="py-2 pr-4 font-medium text-right">Recorded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAverages.map((s, i) => (
                        <tr key={`${s.classId}-${s.subjectId}-${i}`} className="border-b border-gray-100 hover:bg-orange-50/40">
                          <td className="py-2 pr-4 font-medium">{s.subjectName ?? '—'}</td>
                          <td className="py-2 pr-4 text-right font-semibold text-orange-600">{s.averageMark?.toFixed(1) ?? '—'}</td>
                          <td className="py-2 pr-4 text-right text-green-600">{s.highestMark?.toFixed(1) ?? '—'}</td>
                          <td className="py-2 pr-4 text-right text-red-500">{s.lowestMark?.toFixed(1) ?? '—'}</td>
                          <td className="py-2 pr-4 text-right">{s.totalMarksRecorded ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>

          {/* ═══ GRADE DISTRIBUTION & RANKINGS ═══ */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <SectionTitle>Grade Distribution &amp; Student Rankings</SectionTitle>
              <Select
                value={selectedClassSubject}
                onChange={setSelectedClassSubject}
                options={classSubjectOptions}
                placeholder="Select subject"
                className="sm:w-72"
              />
            </div>

            {!selectedClassSubject ? (
              <EmptyState text="Select a subject to view grade distribution and student rankings." />
            ) : drillLoading ? (
              <div className="flex justify-center py-10"><LoadingSpinner /></div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Grade Distribution</h4>
                  {gradeDistribution.length === 0 ? (
                    <EmptyState text="No grade data." />
                  ) : (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gradeDistribution}
                            dataKey="studentCount"
                            nameKey="grade"
                            cx="50%" cy="50%"
                            outerRadius={90}
                            label={({ grade, percentage }) => `${grade} (${percentage?.toFixed(1)}%)`}
                            labelLine
                          >
                            {gradeDistribution.map((_, idx) => (
                              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, name) => [`${v} students`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {gradeDistribution.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {gradeDistribution.map((g, i) => (
                        <div key={g.grade ?? i} className="flex items-center gap-2 text-sm">
                          <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="font-medium text-gray-700">{g.grade ?? '—'}</span>
                          <span className="text-gray-400 ml-auto">{g.studentCount} ({g.percentage?.toFixed(1)}%)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rankings table */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Student Rankings</h4>
                  {studentRankings.length === 0 ? (
                    <EmptyState text="No ranking data." />
                  ) : (
                    <div className="overflow-y-auto max-h-96">
                      <table className="min-w-full text-sm">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b border-gray-200 text-left text-gray-500">
                            <th className="py-2 pr-3 font-medium">Rank</th>
                            <th className="py-2 pr-3 font-medium">Student</th>
                            <th className="py-2 pr-3 font-medium">Index</th>
                            <th className="py-2 pr-3 font-medium text-right">Mark</th>
                            <th className="py-2 font-medium">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentRankings.map(s => (
                            <tr key={s.studentId} className="border-b border-gray-100 hover:bg-orange-50/40">
                              <td className="py-2 pr-3">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                  s.rank === 1 ? 'bg-yellow-100 text-yellow-700'
                                  : s.rank === 2 ? 'bg-gray-100 text-gray-600'
                                  : s.rank === 3 ? 'bg-orange-100 text-orange-600'
                                  : 'bg-gray-50 text-gray-500'
                                }`}>
                                  {s.rank}
                                </span>
                              </td>
                              <td className="py-2 pr-3 font-medium text-gray-800">{s.studentName ?? '—'}</td>
                              <td className="py-2 pr-3 text-gray-500">{s.indexNumber ?? '—'}</td>
                              <td className="py-2 pr-3 text-right font-semibold">{s.mark ?? '—'}</td>
                              <td className="py-2">
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">{s.grade ?? '—'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* ═══ AT-RISK STUDENTS ═══ */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>At-Risk Students (below threshold)</SectionTitle>
              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 font-medium">
                {filteredAtRisk.length} student{filteredAtRisk.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredAtRisk.length === 0 ? (
              <EmptyState text="No at-risk students for this class & term. Great job!" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">#</th>
                      <th className="py-2 pr-4 font-medium">Student</th>
                      <th className="py-2 pr-4 font-medium">Index</th>
                      <th className="py-2 pr-4 font-medium">Subject</th>
                      <th className="py-2 pr-4 font-medium text-right">Mark</th>
                      <th className="py-2 pr-4 font-medium text-right">Class Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAtRisk.map((s, i) => (
                      <tr key={`${s.studentId}-${s.subjectName}-${i}`} className="border-b border-gray-100 hover:bg-red-50/40">
                        <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                        <td className="py-2 pr-4 font-medium text-gray-800">{s.studentName ?? '—'}</td>
                        <td className="py-2 pr-4 text-gray-500">{s.indexNumber ?? '—'}</td>
                        <td className="py-2 pr-4">{s.subjectName ?? '—'}</td>
                        <td className="py-2 pr-4 text-right font-semibold text-red-600">{s.mark ?? '—'}</td>
                        <td className="py-2 pr-4 text-right text-gray-600">{s.classAverage?.toFixed(1) ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ═══ CLASS COMPARISON ═══ */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <SectionTitle>Class Comparison</SectionTitle>
              <Select
                value={compSubjectId}
                onChange={setCompSubjectId}
                options={uniqueSubjects}
                placeholder="Select subject"
                className="sm:w-64"
              />
            </div>

            {!compSubjectId ? (
              <EmptyState text="Select a subject to compare how different classes perform." />
            ) : compLoading ? (
              <div className="flex justify-center py-10"><LoadingSpinner /></div>
            ) : classComparison.length === 0 ? (
              <EmptyState text="No comparison data available." />
            ) : (
              <>
                <div className="w-full h-72 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classComparison} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="className" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={v => [`${Number(v).toFixed(1)}`, '']} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="averageMark" name="Avg Mark"   fill={BAR_ORANGE} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="passRate"    name="Pass Rate%" fill={BAR_GREEN}  radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {classComparison.map(c => (
                    <div key={c.classId} className="rounded-lg border border-gray-200 p-3 text-center">
                      <p className="text-xs font-semibold text-gray-500 mb-2 truncate">{c.className ?? '—'}</p>
                      <div className="flex justify-around">
                        <StatMini label="Avg"  value={c.averageMark?.toFixed(1)} accent="text-orange-600" />
                        <StatMini label="Pass" value={`${c.passRate?.toFixed(0)}%`} accent="text-green-600" />
                        <StatMini label="N"    value={c.totalStudents} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE-BASE ANALYTICS SUB-COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const ModuleBaseAnalytics = ({ selectedClass }) => {
  const [loading, setLoading]                     = useState(true);
  const [modulePerformance, setModulePerformance] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTeacherModulePerformance(selectedClass.classId)
      .then(d => { if (!cancelled) setModulePerformance(Array.isArray(d) ? d : []); })
      .catch(e => console.error('[ModuleBaseAnalytics] load failed', e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedClass.classId]);

  if (loading) {
    return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      {/* ── summary stats ── */}
      {modulePerformance.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Modules"
            value={modulePerformance.length}
            accent="bg-purple-50 text-purple-700 border-purple-200"
          />
          <StatCard
            label="Overall Average"
            value={
              (modulePerformance.reduce((sum, m) => sum + (m.averageMark ?? 0), 0) / modulePerformance.length).toFixed(1)
            }
            accent="bg-orange-50 text-orange-700 border-orange-200"
          />
          <StatCard
            label="Best Module Avg"
            value={Math.max(...modulePerformance.map(m => m.averageMark ?? 0)).toFixed(1)}
            accent="bg-green-50 text-green-700 border-green-200"
          />
          <StatCard
            label="Lowest Module Avg"
            value={Math.min(...modulePerformance.map(m => m.averageMark ?? 0)).toFixed(1)}
            accent="bg-red-50 text-red-700 border-red-200"
          />
        </div>
      )}

      {/* ── chart + table ── */}
      <Card>
        <SectionTitle>Module Performance</SectionTitle>

        {modulePerformance.length === 0 ? (
          <EmptyState text="No module performance data available for this class." />
        ) : (
          <>
            <div className="w-full h-72 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modulePerformance} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="moduleName" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={v => [`${Number(v).toFixed(1)}`, '']} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="averageMark" name="Average" fill={BAR_ORANGE} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="highestMark" name="Highest" fill={BAR_GREEN}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lowestMark"  name="Lowest"  fill={BAR_RED}    radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">#</th>
                    <th className="py-2 pr-4 font-medium">Module</th>
                    <th className="py-2 pr-4 font-medium">Subject</th>
                    <th className="py-2 pr-4 font-medium text-right">Weight</th>
                    <th className="py-2 pr-4 font-medium text-right">Average</th>
                    <th className="py-2 pr-4 font-medium text-right">Highest</th>
                    <th className="py-2 pr-4 font-medium text-right">Lowest</th>
                    <th className="py-2 pr-4 font-medium text-right">Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {modulePerformance.map((m, i) => (
                    <tr key={m.moduleId} className="border-b border-gray-100 hover:bg-purple-50/40">
                      <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                      <td className="py-2 pr-4 font-medium text-gray-800">{m.moduleName ?? '—'}</td>
                      <td className="py-2 pr-4">{m.subjectName ?? '—'}</td>
                      <td className="py-2 pr-4 text-right">{m.moduleWeight ?? '—'}%</td>
                      <td className="py-2 pr-4 text-right font-semibold text-orange-600">{m.averageMark?.toFixed(1) ?? '—'}</td>
                      <td className="py-2 pr-4 text-right text-green-600">{m.highestMark?.toFixed(1) ?? '—'}</td>
                      <td className="py-2 pr-4 text-right text-red-500">{m.lowestMark?.toFixed(1) ?? '—'}</td>
                      <td className="py-2 pr-4 text-right">{m.totalMarksRecorded ?? 0}</td>
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

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const TeacherAnalytics = () => {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [myClasses, setMyClasses]   = useState([]);
  const [selectedId, setSelectedId] = useState(''); // classId

  // ── load classes ──
  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeacherMyClasses();
      setMyClasses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[TeacherAnalytics] load classes failed', e);
      setError('Failed to load your class assignments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  // ── build unique class options ──
  const classOptions = useMemo(() => {
    const map = new Map();
    myClasses.forEach(c => {
      if (!map.has(c.classId)) {
        map.set(c.classId, {
          value: c.classId,
          label: `${c.className ?? '—'} (${c.classType === 'MODULE_BASE' ? 'Module Based' : 'Subject Based'})`,
          classType: c.classType,
        });
      }
    });
    return Array.from(map.values());
  }, [myClasses]);

  // ── selected class object ──
  const selectedClass = useMemo(
    () => myClasses.find(c => c.classId === selectedId) ?? null,
    [myClasses, selectedId],
  );

  const isSubjectBase = selectedClass?.classType === 'SUBJECT_BASE';
  const isModuleBase  = selectedClass?.classType === 'MODULE_BASE';

  // ── render ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Performance insights for your classes" />
        <Card>
          <p className="text-red-600 text-sm text-center py-8">{error}</p>
          <div className="flex justify-center">
            <button onClick={loadClasses} className="text-sm text-orange-600 hover:underline">Retry</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Performance insights for your classes" />

      {/* ── CLASS SELECTOR ── */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <Select
              value={selectedId}
              onChange={setSelectedId}
              options={classOptions}
              placeholder="— Choose a class —"
              className="w-full sm:w-80"
            />
          </div>

          {selectedClass && (
            <div className="flex items-center gap-4 mt-2 sm:mt-6">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                isModuleBase
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {isModuleBase ? 'Module Based' : 'Subject Based'}
              </span>
              <span className="text-sm text-gray-500">
                {selectedClass.sectionName ?? ''} &middot; {selectedClass.totalStudents ?? 0} students
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ── MY CLASSES TABLE (always visible) ── */}
      <Card>
        <SectionTitle>My Classes Overview</SectionTitle>
        {myClasses.length === 0 ? (
          <EmptyState text="No class assignments found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">#</th>
                  <th className="py-2 pr-4 font-medium">Class</th>
                  <th className="py-2 pr-4 font-medium">Section</th>
                  <th className="py-2 pr-4 font-medium">Subject</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium text-right">Students</th>
                </tr>
              </thead>
              <tbody>
                {myClasses.map((c, i) => {
                  const isActive = c.classId === selectedId;
                  return (
                    <tr
                      key={`${c.classId}-${c.subjectId}`}
                      onClick={() => setSelectedId(c.classId)}
                      className={`border-b border-gray-100 cursor-pointer transition ${
                        isActive ? 'bg-orange-50 border-orange-200' : 'hover:bg-orange-50/40'
                      }`}
                    >
                      <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                      <td className="py-2 pr-4 font-medium text-gray-800">{c.className ?? '—'}</td>
                      <td className="py-2 pr-4">{c.sectionName ?? '—'}</td>
                      <td className="py-2 pr-4">{c.subjectName ?? '—'}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          c.classType === 'MODULE_BASE'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {c.classType === 'MODULE_BASE' ? 'Module' : 'Subject'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right font-semibold">{c.totalStudents ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── conditional analytics ── */}
      {!selectedId && (
        <Card>
          <EmptyState text="Select a class above to view analytics." />
        </Card>
      )}

      {isSubjectBase && (
        <SubjectBaseAnalytics
          key={selectedId}
          selectedClass={selectedClass}
          myClasses={myClasses}
        />
      )}

      {isModuleBase && (
        <ModuleBaseAnalytics
          key={selectedId}
          selectedClass={selectedClass}
        />
      )}
    </div>
  );
};

export default TeacherAnalytics;
