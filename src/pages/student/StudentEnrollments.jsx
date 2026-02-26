import { useCallback, useEffect, useState } from 'react';
import { useStudent } from '../../context/StudentContext';
import { getStudentCurriculum } from '../../services/enrollmentService';
import {
  getStudentDashboard,
  getStudentModulePerformance,
  getStudentGPAReport,
} from '../../services/analyticsService';
import { PageHeader, LoadingSpinner } from '../../components/common';

const CLASS_TYPE_LABELS = {
  SUBJECT_BASE: 'Subject Based',
  MODULE_BASE:  'Module Based',
};

const TERMS = [
  { value: 'FIRST_TERM',  label: 'Term 1' },
  { value: 'SECOND_TERM', label: 'Term 2' },
  { value: 'FINAL_TERM',  label: 'Final'  },
];

// ── helper: colour for mark ───────────────────────────────────────────────────
const markColor = (mark) =>
  mark >= 75 ? 'text-emerald-600' : mark >= 50 ? 'text-gray-800' : 'text-red-600';

// ── Subject-Based expanded view ───────────────────────────────────────────────
const SubjectBaseView = ({ subjectMarks }) => {
  if (!subjectMarks || subjectMarks.length === 0)
    return <p className="text-xs text-gray-400 italic py-2">No marks recorded yet.</p>;

  return (
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
          {subjectMarks.map(sub => (
            <tr key={sub.subjectId} className="border-b border-gray-50 hover:bg-white/60">
              <td className="py-2 px-3 font-medium text-gray-800">{sub.subjectName}</td>
              <td className="py-2 px-3 text-center text-gray-500">{sub.creditValue}</td>
              {TERMS.map(t => {
                const tm = sub.termMarks?.find(m => m.term === t.value);
                return (
                  <td key={t.value} className="py-2 px-3 text-center">
                    {tm ? (
                      <span className="inline-flex items-center gap-1">
                        <span className={`font-semibold ${markColor(tm.mark)}`}>{tm.mark}</span>
                        {tm.grade && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
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
  );
};

// ── Module-Based expanded view ────────────────────────────────────────────────
const ModuleBaseView = ({ curriculum, modulePerf, gpaReport }) => {
  const subjects = curriculum?.subjectsWithModules ?? curriculum?.subjects ?? [];
  const subjectGPAs = gpaReport?.subjectGPAs ?? [];

  if (subjects.length === 0)
    return <p className="text-xs text-gray-400 italic py-2">No curriculum data available.</p>;

  return (
    <div className="space-y-4">
      {subjects.map(sub => {
        const modules = sub.modules ?? [];
        const gpa = subjectGPAs.find(g => g.subjectId === sub.subjectId);
        const modulesWithMarks = modules.map(mod => {
          const perfMatch = (modulePerf || []).find(p => p.moduleId === mod.moduleId);
          return { ...mod, mark: perfMatch?.mark ?? null };
        });

        // Calculate weighted subject score from module marks
        const modulesWithValidMarks = modulesWithMarks.filter(m => m.mark !== null);
        const weightedScore = modulesWithValidMarks.length > 0
          ? modulesWithValidMarks.reduce((sum, m) => sum + (m.mark * m.moduleWeight / 100), 0)
          : null;

        return (
          <div key={sub.subjectId} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            {/* Subject header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-800">{sub.subjectName}</span>
                <span className="text-xs text-gray-400">{sub.creditValue}cr</span>
              </div>
              <div className="flex items-center gap-3">
                {weightedScore !== null && (
                  <span className="text-xs text-gray-500">
                    Score: <span className={`font-bold ${markColor(weightedScore)}`}>{weightedScore.toFixed(1)}</span>
                  </span>
                )}
                {gpa && (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">{gpa.grade}</span>
                    <span className="text-gray-400">GP: <span className="font-semibold text-gray-700">{gpa.gradePoint?.toFixed(2)}</span></span>
                  </span>
                )}
              </div>
            </div>

            {/* Module rows */}
            {modules.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {modulesWithMarks.map(mod => (
                  <div key={mod.moduleId} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-300 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{mod.moduleName}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-[10px] text-purple-500 font-medium w-10 text-right">{mod.moduleWeight}%</span>
                      {mod.mark !== null ? (
                        <span className={`text-sm font-bold w-10 text-right ${markColor(mod.mark)}`}>{mod.mark}</span>
                      ) : (
                        <span className="text-sm text-gray-300 w-10 text-right">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic p-3">No modules defined</p>
            )}
          </div>
        );
      })}

      {/* Overall GPA Summary */}
      {gpaReport?.overallGPA != null && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
          <span className="text-sm font-semibold text-purple-800">Overall GPA</span>
          <span className="text-xl font-bold text-purple-700">{gpaReport.overallGPA.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};

// ── Class Card ────────────────────────────────────────────────────────────────
const ClassCard = ({ cls, studentId }) => {
  const [expanded, setExpanded]       = useState(false);
  const [curriculum, setCurriculum]   = useState(null);
  const [dashboard, setDashboard]     = useState(null);
  const [modulePerf, setModulePerf]   = useState(null);
  const [gpaReport, setGPAReport]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [fetched, setFetched]         = useState(false);

  const isModuleBased = cls.classType === 'MODULE_BASE';

  const fetchData = useCallback(async () => {
    if (fetched || !studentId) return;
    setLoading(true);
    try {
      if (isModuleBased) {
        // MODULE_BASE: curriculum structure + module marks + GPA
        const results = await Promise.allSettled([
          getStudentCurriculum(cls.classId, studentId),
          getStudentModulePerformance(cls.classId),
          getStudentGPAReport(cls.classId),
        ]);
        setCurriculum(results[0].status === 'fulfilled' ? results[0].value : null);
        setModulePerf(results[1].status === 'fulfilled' ? (results[1].value || []) : []);
        setGPAReport(results[2].status === 'fulfilled' ? results[2].value : null);
      } else {
        // SUBJECT_BASE: dashboard with subject term marks
        const results = await Promise.allSettled([
          getStudentDashboard(cls.classId),
        ]);
        setDashboard(results[0].status === 'fulfilled' ? results[0].value : null);
      }
      setFetched(true);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [cls.classId, studentId, isModuleBased, fetched]);

  const handleToggle = () => {
    if (!expanded) fetchData();
    setExpanded(e => !e);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition text-left"
      >
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-gray-800">{cls.className}</h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">{cls.sectionName}</span>
            {cls.academicYear && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">{cls.academicYear}</span>
              </>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              isModuleBased
                ? 'bg-purple-100 text-purple-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {CLASS_TYPE_LABELS[cls.classType] || cls.classType}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400">{cls.enrolledSubjects?.length ?? 0} subjects</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50/70">
          {loading ? (
            <div className="flex items-center justify-center py-6"><LoadingSpinner /></div>
          ) : (
            <>
              {/* Class info bar */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isModuleBased
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {CLASS_TYPE_LABELS[cls.classType] || cls.classType}
                </span>
                <span className="text-xs text-gray-500">{cls.sectionName}</span>
                {cls.academicYear && (
                  <span className="text-xs text-gray-500">{cls.academicYear}</span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {cls.enrolledSubjects?.length ?? 0} subject{(cls.enrolledSubjects?.length ?? 0) !== 1 ? 's' : ''} enrolled
                </span>
              </div>

              {isModuleBased ? (
                <ModuleBaseView
                  curriculum={curriculum}
                  modulePerf={modulePerf}
                  gpaReport={gpaReport}
                />
              ) : (
                <>
                  {/* Enrolled Subjects list */}
                  {cls.enrolledSubjects?.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Enrolled Subjects</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {cls.enrolledSubjects.map(sub => (
                          <div key={sub.subjectId}
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-gray-100">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                            <span className="text-sm text-gray-800 font-medium truncate">{sub.subjectName}</span>
                            <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{sub.creditValue}cr</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subject marks table */}
                  <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Subject Marks</h5>
                  <SubjectBaseView subjectMarks={dashboard?.subjectMarks} />
                </>
              )}
            </>
          )}

          <p className="text-[10px] text-gray-400 mt-3">
            Enrolled: {cls.enrolledSubjects?.[0]?.enrolledAt ? new Date(cls.enrolledSubjects[0].enrolledAt).toLocaleDateString() : '—'}
          </p>
        </div>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const StudentEnrollments = () => {
  const { studentId, enrollment, loading: ctxLoading } = useStudent();

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  const classes = enrollment?.enrolledClasses ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Enrollments"
        subtitle={`You are enrolled in ${classes.length} class${classes.length !== 1 ? 'es' : ''}`}
      />

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-gray-500">You are not enrolled in any classes yet.</p>
          <p className="text-xs text-gray-400 mt-1">Contact your school operator to get enrolled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map(cls => (
            <ClassCard key={cls.classId} cls={cls} studentId={studentId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentEnrollments;
