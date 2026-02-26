import { useCallback, useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  getStudentDashboard,
  getStudentTermTrend,
  getStudentGPAReport,
  getStudentModulePerformance,
  getStudentClassRanks,
  getStudentVsClassAverage,
} from '../../services/analyticsService';
import { useStudent } from '../../context/StudentContext';
import { PageHeader, LoadingSpinner } from '../../components/common';

// ── constants ─────────────────────────────────────────────────────────────────
const TERMS = [
  { value: 'FIRST_TERM',  label: 'Term 1' },
  { value: 'SECOND_TERM', label: 'Term 2' },
  { value: 'FINAL_TERM',  label: 'Final'  },
];

const COLORS = [
  '#10b981', '#059669', '#14b8a6', '#0d9488',
  '#06b6d4', '#0891b2', '#8b5cf6', '#7c3aed',
  '#f59e0b', '#ea580c',
];

const BAR_PRIMARY   = '#10b981';
const BAR_SECONDARY = '#06b6d4';
const LINE_PRIMARY  = '#10b981';
const LINE_SECONDARY = '#8b5cf6';

// ── reusable components ───────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>{children}</div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-base font-semibold text-gray-800 mb-4">{children}</h3>
);

const Select = ({ value, onChange, options, placeholder, className = '' }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={`rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
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
//  STUDENT ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════
const StudentAnalytics = () => {
  const { studentId, enrollment, loading: ctxLoading } = useStudent();

  // State
  const [dashboard, setDashboard]           = useState(null);
  const [termTrend, setTermTrend]           = useState([]);
  const [gpaReport, setGPAReport]           = useState(null);
  const [modulePerf, setModulePerf]         = useState([]);
  const [classRanks, setClassRanks]         = useState([]);
  const [vsClassAvg, setVsClassAvg]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedTerm, setSelectedTerm]     = useState('FIRST_TERM');
  const [selectedClassId, setSelectedClassId] = useState('');

  const enrolledClasses = enrollment?.enrolledClasses ?? [];

  // Derive selected class info
  const selectedClass = enrolledClasses.find(c => c.classId === selectedClassId) ?? null;
  const isModuleBased = selectedClass?.classType === 'MODULE_BASE';

  // Auto-select first class when enrollment loads
  useEffect(() => {
    if (!selectedClassId && enrolledClasses.length > 0) {
      setSelectedClassId(enrolledClasses[0].classId);
    }
  }, [enrolledClasses, selectedClassId]);

  // ── Fetch core data ─────────────────────────────────────────────────────────
  const fetchCoreData = useCallback(async () => {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    const classId = selectedClassId || undefined;
    try {
      // For module-based: skip term trend; for subject-based: skip module performance
      const promises = [
        getStudentDashboard(classId),
        isModuleBased ? Promise.resolve(null) : getStudentTermTrend(classId),
        getStudentGPAReport(classId),
        isModuleBased ? getStudentModulePerformance(classId) : Promise.resolve(null),
      ];
      const results = await Promise.allSettled(promises);
      setDashboard(results[0].status === 'fulfilled' ? results[0].value : null);
      setTermTrend(results[1].status === 'fulfilled' ? (results[1].value || []) : []);
      setGPAReport(results[2].status === 'fulfilled' ? results[2].value : null);
      setModulePerf(results[3].status === 'fulfilled' ? (results[3].value || []) : []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedClassId, isModuleBased]);

  useEffect(() => { fetchCoreData(); }, [fetchCoreData]);

  // ── Fetch term-dependent data (subject-based only) ──────────────────────────
  const fetchTermData = useCallback(async () => {
    if (!studentId || isModuleBased) {
      setClassRanks([]);
      setVsClassAvg([]);
      return;
    }
    const classId = selectedClassId || undefined;
    try {
      const results = await Promise.allSettled([
        getStudentClassRanks(selectedTerm, classId),
        getStudentVsClassAverage(selectedTerm, classId),
      ]);
      setClassRanks(results[0].status === 'fulfilled' ? (results[0].value || []) : []);
      setVsClassAvg(results[1].status === 'fulfilled' ? (results[1].value || []) : []);
    } catch {
      // silently handle
    }
  }, [studentId, selectedTerm, selectedClassId, isModuleBased]);

  useEffect(() => { fetchTermData(); }, [fetchTermData]);

  if (ctxLoading || loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="My Analytics" subtitle="Performance insights and academic trends" />

      {/* Class Selector */}
      {enrolledClasses.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 font-medium mr-1">Class:</span>
          {enrolledClasses.map(cls => (
            <button
              key={cls.classId}
              onClick={() => setSelectedClassId(cls.classId)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedClassId === cls.classId
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              {cls.className}
            </button>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Overall Average"
          value={dashboard?.overallAverage != null ? `${dashboard.overallAverage.toFixed(1)}%` : '—'}
          accent="bg-emerald-50 text-emerald-700 border-emerald-200"
        />
        <StatCard
          label="GPA"
          value={gpaReport?.overallGPA != null ? gpaReport.overallGPA.toFixed(2) : (dashboard?.gpa != null ? dashboard.gpa.toFixed(2) : '—')}
          accent="bg-teal-50 text-teal-700 border-teal-200"
        />
        <StatCard
          label="Total Subjects"
          value={dashboard?.totalSubjects ?? '—'}
          accent="bg-cyan-50 text-cyan-700 border-cyan-200"
        />
        <StatCard
          label="Class"
          value={dashboard?.className ?? '—'}
          accent="bg-green-50 text-green-700 border-green-200"
        />
      </div>

      {/* Term selector for rank/comparison views (subject-based only) */}
      {!isModuleBased && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">Term:</span>
          <Select
            value={selectedTerm}
            onChange={setSelectedTerm}
            options={TERMS}
          />
        </div>
      )}

      {/* Row 1: Term Trend (subject-based) + GPA by Subject */}
      <div className={`grid grid-cols-1 ${!isModuleBased ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Term Trend Line Chart - subject-based only */}
        {!isModuleBased && (
          <Card>
            <SectionTitle>Term Trend</SectionTitle>
            {termTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={termTrend.map(t => ({
                  ...t,
                  label: TERMS.find(tt => tt.value === t.term)?.label ?? t.term,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="averageMark" name="Average %" stroke={LINE_PRIMARY} strokeWidth={2} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="gpa" name="GPA" stroke={LINE_SECONDARY} strokeWidth={2} dot={{ r: 5 }} yAxisId="right" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 4.5]} tick={{ fontSize: 12 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="No term trend data available" />
            )}
          </Card>
        )}

        {/* GPA Report - Subject breakdown */}
        <Card>
          <SectionTitle>Subject GPA Breakdown</SectionTitle>
          {gpaReport?.subjectGPAs?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gpaReport.subjectGPAs.map(s => ({
                name: s.subjectName?.length > 12 ? s.subjectName.substring(0, 12) + '…' : s.subjectName,
                fullName: s.subjectName,
                gradePoint: s.gradePoint,
                average: s.averageMark,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis domain={[0, 4.5]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(val, name) => [typeof val === 'number' ? val.toFixed(2) : val, name]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                />
                <Bar dataKey="gradePoint" name="Grade Point" fill={BAR_PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No GPA data available" />
          )}
        </Card>
      </div>

      {/* Row 2: Vs Class Average + Class Ranks (subject-based only) */}
      {!isModuleBased && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student vs Class Average */}
          <Card>
            <SectionTitle>Your Marks vs Class Average ({TERMS.find(t => t.value === selectedTerm)?.label})</SectionTitle>
            {vsClassAvg.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vsClassAvg.map(v => ({
                  name: v.subjectName?.length > 10 ? v.subjectName.substring(0, 10) + '…' : v.subjectName,
                  fullName: v.subjectName,
                  'Your Mark': v.studentMark,
                  'Class Avg': Math.round(v.classAverage * 10) / 10,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Your Mark" fill={BAR_PRIMARY} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Class Avg" fill={BAR_SECONDARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="No comparison data for this term" />
            )}
          </Card>

          {/* Class Ranks Table */}
          <Card>
            <SectionTitle>Class Rankings ({TERMS.find(t => t.value === selectedTerm)?.label})</SectionTitle>
            {classRanks.length > 0 ? (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Mark</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Class Avg</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classRanks.map(r => (
                      <tr key={`${r.subjectId}-${r.term}`} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium text-gray-800">{r.subjectName}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`font-medium ${r.mark >= 50 ? 'text-gray-800' : 'text-red-600'}`}>{r.mark}</span>
                        </td>
                        <td className="py-2 px-3 text-center text-gray-500">
                          {r.classAverage != null ? r.classAverage.toFixed(1) : '—'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            r.rankInClass === 1
                              ? 'bg-yellow-100 text-yellow-700'
                              : r.rankInClass <= 3
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {r.rankInClass}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-1">/{r.totalInClass}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No ranking data for this term" />
            )}
          </Card>
        </div>
      )}

      {/* Row 3: Module Performance (module-based only) + Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Performance - module-based only */}
        {isModuleBased && modulePerf.length > 0 && (
          <Card>
            <SectionTitle>Module Performance</SectionTitle>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modulePerf.map(m => ({
                name: m.moduleName?.length > 12 ? m.moduleName.substring(0, 12) + '…' : m.moduleName,
                fullName: `${m.moduleName} (${m.subjectName})`,
                mark: m.mark,
                weight: m.moduleWeight,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                />
                <Bar dataKey="mark" name="Mark" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {modulePerf.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Subject Performance Radar */}
        {dashboard?.subjectMarks?.length > 0 && (
          <Card>
            <SectionTitle>Subject Performance Radar</SectionTitle>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={dashboard.subjectMarks.map(s => {
                const latestTerm = s.termMarks?.reduce((latest, t) => {
                  if (!latest || t.mark > latest.mark) return t;
                  return latest;
                }, null);
                return {
                  subject: s.subjectName?.length > 10 ? s.subjectName.substring(0, 10) + '…' : s.subjectName,
                  mark: latestTerm?.mark ?? 0,
                };
              })}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Mark" dataKey="mark" stroke={BAR_PRIMARY} fill={BAR_PRIMARY} fillOpacity={0.3} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Subject Performance Detail Table - subject-based only */}
      {!isModuleBased && dashboard?.subjectMarks?.length > 0 && (
        <Card>
          <SectionTitle>Detailed Subject Performance</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Credits</th>
                  {TERMS.map(t => (
                    <th key={t.value} className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">{t.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.subjectMarks.map(sub => (
                  <tr key={sub.subjectId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-800">{sub.subjectName}</td>
                    <td className="py-2 px-3 text-center text-gray-500">{sub.creditValue}</td>
                    {TERMS.map(t => {
                      const tm = sub.termMarks?.find(m => m.term === t.value);
                      return (
                        <td key={t.value} className="py-2 px-3 text-center">
                          {tm ? (
                            <span className="inline-flex items-center gap-1">
                              <span className={`font-medium ${tm.mark >= 50 ? 'text-gray-800' : 'text-red-600'}`}>{tm.mark}</span>
                              {tm.grade && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                                  {tm.grade}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* GPA Report Table */}
      {gpaReport?.subjectGPAs?.length > 0 && (
        <Card>
          <SectionTitle>GPA Report</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Credits</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Avg Mark</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Grade Point</th>
                </tr>
              </thead>
              <tbody>
                {gpaReport.subjectGPAs.map(s => (
                  <tr key={s.subjectId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-800">{s.subjectName}</td>
                    <td className="py-2 px-3 text-center text-gray-500">{s.creditValue}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-medium ${s.averageMark >= 50 ? 'text-gray-800' : 'text-red-600'}`}>
                        {s.averageMark?.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">
                        {s.grade}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-medium text-gray-800">
                      {s.gradePoint?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={4} className="py-2 px-3 text-right font-semibold text-gray-700">Overall GPA</td>
                  <td className="py-2 px-3 text-center">
                    <span className="text-lg font-bold text-emerald-700">{gpaReport.overallGPA?.toFixed(2)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentAnalytics;
