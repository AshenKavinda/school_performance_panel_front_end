import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudentGlobalByCode, getStudentByGlobal } from '../../services/managementService';
import { getStudentEnrollment } from '../../services/enrollmentService';
import { getSubjectMarksByStudent, getModuleMarksByStudent } from '../../services/marksService';
import { getSubjectGradings, getGPAGradings } from '../../services/gradingService';

// ── Tiny UI primitives ────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>{children}</div>
);

const Field = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-semibold text-gray-800">{value ?? '—'}</span>
  </div>
);

const TERMS = ['FIRST_TERM', 'SECOND_TERM', 'FINAL_TERM'];
const termLabel = (t) => ({ FIRST_TERM: 'Term 1', SECOND_TERM: 'Term 2', FINAL_TERM: 'Final' }[t] ?? t);

// ── Helpers: resolve grade from mark ──────────────────────────────────────────
const resolveSubjectGrade = (mark, gradings) => {
  if (mark == null || !gradings?.length) return '—';
  const g = gradings.find(g => mark >= g.minMark && mark <= g.maxMark);
  return g?.grade ?? '—';
};

const resolveGPAGrade = (mark, gradings) => {
  if (mark == null || !gradings?.length) return { grade: '—', gradePoint: '—' };
  const g = gradings.find(g => mark >= g.minMark && mark <= g.maxMark);
  return g ? { grade: g.grade, gradePoint: g.gradePoint?.toFixed(2) } : { grade: '—', gradePoint: '—' };
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const StudentLookup = () => {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null); // full resolved data

  const handleSearch = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Resolve student global
      let studentGlobal;
      try {
        studentGlobal = await getStudentGlobalByCode(trimmed);
      } catch (e) {
        if (e?.response?.status === 404) {
          setError('Student not found. Please check the code and try again.');
          return;
        }
        throw e;
      }

      if (!studentGlobal?.id) {
        setError('Student not found. Please check the code and try again.');
        return;
      }

      // 2. Get school-scoped student record
      let student = null;
      try {
        student = await getStudentByGlobal(studentGlobal.id);
      } catch {
        // might not be enrolled in any school
      }

      // 3. If we have a student record, get enrollments + marks + grading configs
      let enrollment = null;
      let subjectMarks = [];
      let moduleMarks = [];
      let subjectGradings = [];
      let gpaGradings = [];

      if (student?.id) {
        const results = await Promise.all([
          getStudentEnrollment(student.id).catch(() => null),
          getSubjectMarksByStudent(student.id).catch(() => []),
          getModuleMarksByStudent(student.id).catch(() => []),
          getSubjectGradings().catch(() => []),
          getGPAGradings().catch(() => []),
        ]);
        enrollment     = results[0];
        subjectMarks   = Array.isArray(results[1]) ? results[1] : [];
        moduleMarks    = Array.isArray(results[2]) ? results[2] : [];
        subjectGradings = Array.isArray(results[3]) ? results[3] : [];
        gpaGradings    = Array.isArray(results[4]) ? results[4] : [];
      }

      setResult({
        studentGlobal,
        student,
        enrollment,
        subjectMarks,
        moduleMarks,
        subjectGradings,
        gpaGradings,
      });
    } catch (e) {
      console.error('[StudentLookup] search failed', e);
      setError('An error occurred while looking up the student. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [code]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
      {/* ── Navbar ── */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            <span className="hidden sm:inline">School Performance Panel</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition">Sign In</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm">Register</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* ── Search Section ── */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Student Academic Lookup</h1>
          <p className="text-gray-500 mb-6 max-w-lg mx-auto">
            Enter a Global Student Code to view academic records. No login required.
          </p>
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter Global Student Code…"
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !code.trim()}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition shadow-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Search
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <div className="space-y-6">
            {/* ── Student Info Card ── */}
            <Card>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {(result.studentGlobal.firstName?.[0] ?? 'S').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">
                    {[result.studentGlobal.firstName, result.studentGlobal.lastName].filter(Boolean).join(' ') || '—'}
                  </h2>
                  <p className="text-sm text-gray-400">Global Code: {result.studentGlobal.globalStudentCode ?? '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Email" value={result.studentGlobal.email} />
                <Field label="Phone" value={result.studentGlobal.phone} />
                <Field label="Date of Birth" value={result.studentGlobal.dateOfBirth ? new Date(result.studentGlobal.dateOfBirth).toLocaleDateString() : null} />
                <Field label="Index Number" value={result.student?.indexNumber} />
              </div>
            </Card>

            {/* ── Enrolled Classes & Subjects ── */}
            {result.enrollment?.enrolledClasses?.length > 0 ? (
              <Card>
                <h3 className="text-base font-semibold text-gray-800 mb-4">Enrolled Classes &amp; Subjects</h3>
                <div className="space-y-4">
                  {result.enrollment.enrolledClasses.map(cls => (
                    <div key={cls.classId} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold text-gray-800">{cls.className ?? '—'}</span>
                        <span className="text-gray-400 text-xs">|</span>
                        <span className="text-gray-500 text-sm">{cls.sectionName ?? '—'}</span>
                        <span className="text-gray-400 text-xs">|</span>
                        <span className="text-gray-500 text-sm">{cls.academicYear ?? '—'}</span>
                        <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
                          cls.classType === 'MODULE_BASE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {cls.classType === 'MODULE_BASE' ? 'Module Based' : 'Subject Based'}
                        </span>
                      </div>
                      {cls.enrolledSubjects?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {cls.enrolledSubjects.map(sub => (
                            <span key={sub.subjectId} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                              {sub.subjectName ?? '—'} {sub.creditValue != null ? `(${sub.creditValue})` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card>
                <p className="text-sm text-gray-400 text-center py-4">No class enrollments found for this student.</p>
              </Card>
            )}

            {/* ── Subject Base Marks ── */}
            <SubjectBaseMarks
              enrolledClasses={result.enrollment?.enrolledClasses ?? []}
              subjectMarks={result.subjectMarks}
              gradings={result.subjectGradings}
            />

            {/* ── Module Base Marks ── */}
            <ModuleBaseMarks
              enrolledClasses={result.enrollment?.enrolledClasses ?? []}
              moduleMarks={result.moduleMarks}
              gradings={result.gpaGradings}
            />
          </div>
        )}

        {/* ── Empty initial state ── */}
        {!result && !error && !loading && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Enter a Global Student Code above to view academic records.
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SUBJECT-BASE MARKS
// ═══════════════════════════════════════════════════════════════════════════════
const SubjectBaseMarks = ({ enrolledClasses, subjectMarks, gradings }) => {
  const subjectClasses = enrolledClasses.filter(c => c.classType === 'SUBJECT_BASE');
  if (subjectClasses.length === 0 && subjectMarks.length === 0) return null;

  // Group marks by classId → subjectId → term
  const markMap = {};
  subjectMarks.forEach(m => {
    const key = `${m.classId}|${m.subjectId}`;
    if (!markMap[key]) markMap[key] = { subjectName: m.subjectName, className: m.className, byTerm: {} };
    markMap[key].byTerm[m.termTest] = m.mark;
  });

  return (
    <Card>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Subject Exam Marks</h3>
      {subjectClasses.length === 0 && subjectMarks.length > 0 ? (
        <MarksTableGeneric markMap={markMap} gradings={gradings} type="subject" />
      ) : (
        subjectClasses.map(cls => {
          // Filter marks for this class
          const classMarks = {};
          Object.entries(markMap).forEach(([key, val]) => {
            if (key.startsWith(cls.classId)) classMarks[key] = val;
          });
          const hasMarks = Object.keys(classMarks).length > 0;
          return (
            <div key={cls.classId} className="mb-6 last:mb-0">
              <p className="text-sm font-medium text-gray-600 mb-2">
                {cls.className ?? '—'} <span className="text-gray-400">({cls.academicYear ?? '—'})</span>
              </p>
              {hasMarks ? (
                <MarksTableGeneric markMap={classMarks} gradings={gradings} type="subject" />
              ) : (
                <p className="text-xs text-gray-400 py-3 text-center">No marks recorded for this class yet.</p>
              )}
            </div>
          );
        })
      )}
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE-BASE MARKS
// ═══════════════════════════════════════════════════════════════════════════════
const ModuleBaseMarks = ({ enrolledClasses, moduleMarks, gradings }) => {
  const moduleClasses = enrolledClasses.filter(c => c.classType === 'MODULE_BASE');
  if (moduleClasses.length === 0 && moduleMarks.length === 0) return null;

  return (
    <Card>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Module Exam Marks</h3>
      {moduleMarks.length === 0 ? (
        <p className="text-xs text-gray-400 py-3 text-center">No module marks recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-3 font-medium">Module</th>
                <th className="py-2 pr-3 font-medium">Subject</th>
                <th className="py-2 pr-3 font-medium text-right">Mark</th>
                <th className="py-2 pr-3 font-medium text-center">Grade</th>
                <th className="py-2 pr-3 font-medium text-right">GP</th>
              </tr>
            </thead>
            <tbody>
              {moduleMarks.map((m, i) => {
                const { grade, gradePoint } = resolveGPAGrade(m.mark, gradings);
                return (
                  <tr key={`${m.moduleId}-${i}`} className="border-b border-gray-100 hover:bg-purple-50/40">
                    <td className="py-2 pr-3 font-medium text-gray-800">{m.moduleName ?? '—'}</td>
                    <td className="py-2 pr-3 text-gray-500">{m.subjectName ?? '—'}</td>
                    <td className="py-2 pr-3 text-right font-semibold">{m.mark ?? '—'}</td>
                    <td className="py-2 pr-3 text-center">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {grade}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right text-gray-600">{gradePoint}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  GENERIC MARKS TABLE (for subject-base marks grouped by subject × term)
// ═══════════════════════════════════════════════════════════════════════════════
const MarksTableGeneric = ({ markMap, gradings }) => {
  const entries = Object.values(markMap);
  if (entries.length === 0) {
    return <p className="text-xs text-gray-400 py-3 text-center">No marks recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-3 font-medium">Subject</th>
            {TERMS.map(t => (
              <th key={t} className="py-2 pr-3 font-medium text-center" colSpan={2}>
                {termLabel(t)}
              </th>
            ))}
          </tr>
          <tr className="border-b border-gray-100 text-gray-400 text-xs">
            <th />
            {TERMS.map(t => (
              <React.Fragment key={t}>
                <th className="py-1 pr-1 text-center font-normal">Mark</th>
                <th className="py-1 pr-3 text-center font-normal">Grade</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-indigo-50/40">
              <td className="py-2 pr-3 font-medium text-gray-800">{entry.subjectName ?? '—'}</td>
              {TERMS.map(t => {
                const mark = entry.byTerm[t];
                const grade = resolveSubjectGrade(mark, gradings);
                return (
                  <React.Fragment key={t}>
                    <td className="py-2 pr-1 text-center font-semibold">{mark ?? '—'}</td>
                    <td className="py-2 pr-3 text-center">
                      {mark != null ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{grade}</span>
                      ) : '—'}
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentLookup;
