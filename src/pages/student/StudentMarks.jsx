import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStudent } from '../../context/StudentContext';
import { getSubjectMarksByStudent, getModuleMarksByStudent } from '../../services/marksService';
import { getSubjectGradings, getGPAGradings, resolveGrade } from '../../services/gradingService';
import { PageHeader, LoadingSpinner } from '../../components/common';

const TERMS = [
  { value: 'FIRST_TERM',  label: 'Term 1' },
  { value: 'SECOND_TERM', label: 'Term 2' },
  { value: 'FINAL_TERM',  label: 'Final'  },
];

// ── Grade badge ───────────────────────────────────────────────────────────────
const GradeBadge = ({ grade, small = false }) => {
  if (!grade) return null;
  const colors = {
    'A+': 'bg-emerald-100 text-emerald-700', 'A': 'bg-emerald-100 text-emerald-700',
    'A-': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'B+': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400', 'B': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
    'B-': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
    'C+': 'bg-sky-100 text-sky-700', 'C': 'bg-sky-100 text-sky-700',
    'C-': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'D+': 'bg-amber-100 text-amber-700', 'D': 'bg-amber-100 text-amber-700',
    'F': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };
  const color = colors[grade] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center justify-center rounded font-semibold ${color} ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}>
      {grade}
    </span>
  );
};

// ── Mark Cell ─────────────────────────────────────────────────────────────────
const MarkCell = ({ mark, grade }) => (
  <td className="py-2.5 px-3 text-center">
    {mark != null ? (
      <span className="inline-flex items-center gap-1.5">
        <span className={`font-medium ${mark >= 50 ? 'text-gray-800 dark:text-gray-200' : 'text-red-600 dark:text-red-400'}`}>{mark}</span>
        <GradeBadge grade={grade} small />
      </span>
    ) : (
      <span className="text-gray-300 dark:text-gray-600">—</span>
    )}
  </td>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  SUBJECT-BASE MARKS VIEW
// ═══════════════════════════════════════════════════════════════════════════════
const SubjectBaseView = ({ marks, className, gradings }) => {
  // Group marks by subject
  const subjectMap = useMemo(() => {
    const map = new Map();
    (marks || []).forEach(m => {
      if (!map.has(m.subjectId)) {
        map.set(m.subjectId, { subjectName: m.subjectName, terms: {} });
      }
      map.get(m.subjectId).terms[m.termTest] = m.mark;
    });
    return map;
  }, [marks]);

  if (subjectMap.size === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center italic">No subject marks recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Subject</th>
            {TERMS.map(t => (
              <th key={t.value} className="text-center py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t.label}</th>
            ))}
            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Average</th>
          </tr>
        </thead>
        <tbody>
          {[...subjectMap.entries()].map(([subjectId, sub]) => {
            const termValues = TERMS.map(t => sub.terms[t.value]);
            const present = termValues.filter(v => v != null);
            const avg = present.length > 0 ? Math.round(present.reduce((s, v) => s + v, 0) / present.length) : null;
            const avgGrade = avg != null ? resolveGrade(avg, gradings) : null;

            return (
              <tr key={subjectId} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-2.5 px-3 font-medium text-gray-800 dark:text-gray-200">{sub.subjectName}</td>
                {TERMS.map(t => {
                  const mark = sub.terms[t.value];
                  const g = mark != null ? resolveGrade(mark, gradings) : null;
                  return <MarkCell key={t.value} mark={mark} grade={g?.grade} />;
                })}
                <MarkCell mark={avg} grade={avgGrade?.grade} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE-BASE MARKS VIEW
// ═══════════════════════════════════════════════════════════════════════════════
const ModuleBaseView = ({ marks, gradings }) => {
  // Group by subject name
  const subjectGroups = useMemo(() => {
    const map = new Map();
    (marks || []).forEach(m => {
      const key = m.subjectName || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    return map;
  }, [marks]);

  if (subjectGroups.size === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center italic">No module marks recorded yet.</p>;
  }

  return (
    <div className="space-y-4">
      {[...subjectGroups.entries()].map(([subjectName, modules]) => (
        <div key={subjectName}>
          <h5 className="text-sm font-semibold text-gray-700 mb-2">{subjectName}</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Module</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Mark</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Grade</th>
                </tr>
              </thead>
              <tbody>
                {modules.map(mod => {
                  const g = mod.mark != null ? resolveGrade(mod.mark, gradings) : null;
                  return (
                    <tr key={mod.moduleId} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-2.5 px-3 font-medium text-gray-800 dark:text-gray-200">{mod.moduleName}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-medium ${(mod.mark ?? 0) >= 50 ? 'text-gray-800 dark:text-gray-200' : 'text-red-600 dark:text-red-400'}`}>
                          {mod.mark ?? '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <GradeBadge grade={g?.grade} />
                        {g?.gradePoint != null && (
                          <span className="ml-1 text-[10px] text-gray-400">({g.gradePoint})</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const StudentMarks = () => {
  const { studentId, enrollment, loading: ctxLoading } = useStudent();

  const [subjectMarks, setSubjectMarks] = useState([]);
  const [moduleMarks, setModuleMarks]   = useState([]);
  const [subjectGradings, setSubjectGradings] = useState([]);
  const [gpaGradings, setGPAGradings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedClassId, setSelectedClassId] = useState('');

  const fetchData = useCallback(async () => {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getSubjectMarksByStudent(studentId),
        getModuleMarksByStudent(studentId),
        getSubjectGradings(),
        getGPAGradings(),
      ]);
      setSubjectMarks(results[0].status === 'fulfilled' ? results[0].value : []);
      setModuleMarks(results[1].status === 'fulfilled' ? results[1].value : []);
      setSubjectGradings(results[2].status === 'fulfilled' ? (Array.isArray(results[2].value) ? results[2].value : []) : []);
      setGPAGradings(results[3].status === 'fulfilled' ? (Array.isArray(results[3].value) ? results[3].value : []) : []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const classes = enrollment?.enrolledClasses ?? [];

  // Auto-select first class
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].classId);
    }
  }, [classes, selectedClassId]);

  const selectedClass = classes.find(c => c.classId === selectedClassId);

  // Filter marks for selected class
  const filteredSubjectMarks = useMemo(() =>
    subjectMarks.filter(m => m.classId === selectedClassId),
    [subjectMarks, selectedClassId]
  );

  if (ctxLoading || loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="My Marks" subtitle="View your exam marks and grades" />

      {/* Class Selector */}
      {classes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {classes.map(cls => (
            <button
              key={cls.classId}
              onClick={() => setSelectedClassId(cls.classId)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                selectedClassId === cls.classId
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
              }`}
            >
              {cls.className}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${
                selectedClassId === cls.classId ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {cls.classType === 'MODULE_BASE' ? 'Module' : 'Subject'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Marks Content */}
      {selectedClass ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">{selectedClass.className}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {selectedClass.sectionName} · {selectedClass.academicYear}
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              selectedClass.classType === 'MODULE_BASE'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {selectedClass.classType === 'MODULE_BASE' ? 'Module Based' : 'Subject Based'}
            </span>
          </div>

          {selectedClass.classType === 'MODULE_BASE' ? (
            <ModuleBaseView marks={moduleMarks} gradings={gpaGradings} />
          ) : (
            <SubjectBaseView marks={filteredSubjectMarks} className={selectedClass.className} gradings={subjectGradings} />
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">No classes found. Enroll in a class to view marks.</p>
        </div>
      )}
    </div>
  );
};

export default StudentMarks;
