import { useCallback, useEffect, useState } from 'react';
import {
  getClassesByOperator, getStudentsByOperator, getSubjectsByOperator,
} from '../../services/managementService';
import { useOperator } from '../../context/OperatorContext';
import {
  getClassStudents, enrollStudentToClass, removeStudentFromClass,
  enrollClassCommonSubjects, enrollElectiveSubject, getStudentSubjects,
  removeStudentFromSubject,
} from '../../services/enrollmentService';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import { PageHeader, LoadingSpinner } from '../../components/common';

// ──────────────────────────────────────────────────────────────────────────────
// Tab component
const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
      active
        ? 'bg-teal-600 text-white shadow-sm'
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
);

// ── Class selector ────────────────────────────────────────────────────────────
const ClassSelector = ({ classes, selectedId, onChange, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
    <select
      value={selectedId}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50"
    >
      <option value="">— Choose a class —</option>
      {classes.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} {c.academicYear ? `(${c.academicYear})` : ''}
        </option>
      ))}
    </select>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const EnrollmentsPage = () => {
  const { success, error: toastError } = useToast();

  const [tab,      setTab]      = useState('class');   // 'class' | 'subject'
  const [classes,  setClasses]  = useState([]);
  const [students, setStudents] = useState([]);   // all school students
  const [subjects, setSubjects] = useState([]);
  const [baseLoading, setBaseLoading] = useState(true);

  // Class enrollment state
  const [classId,       setClassId]       = useState('');
  const [enrolled,      setEnrolled]      = useState([]);
  const [classLoading,  setClassLoading]  = useState(false);
  const [addStudentId,  setAddStudentId]  = useState('');
  const [enrolling,     setEnrolling]     = useState(false);

  // Subject enrollment state
  const [subjClassId,       setSubjClassId]       = useState('');
  const [selectedSubjIds,   setSelectedSubjIds]   = useState([]);
  const [enrollingSubjects, setEnrollingSubjects]  = useState(false);

  // Elective enrollment state
  const [electStudentId,  setElectStudentId]  = useState('');
  const [electSubjectId,  setElectSubjectId]  = useState('');
  const [electClassId,    setElectClassId]    = useState('');
  const [enrollingElect,  setEnrollingElect]  = useState(false);

  // ── Base data fetch ───────────────────────────────────────────────────────
  const { operatorId } = useOperator();

  const fetchBase = useCallback(async () => {
    if (!operatorId) { setBaseLoading(false); return; }
    setBaseLoading(true);
    const [clsRes, stuRes, subRes] = await Promise.allSettled([
      getClassesByOperator(operatorId),
      getStudentsByOperator(operatorId),
      getSubjectsByOperator(operatorId),
    ]);
    if (clsRes.status === 'fulfilled') setClasses(Array.isArray(clsRes.value) ? clsRes.value.filter(r => !r.isDeleted) : []);
    if (stuRes.status === 'fulfilled') setStudents(Array.isArray(stuRes.value) ? stuRes.value.filter(r => !r.isDeleted) : []);
    if (subRes.status === 'fulfilled') setSubjects(Array.isArray(subRes.value) ? subRes.value.filter(r => !r.isDeleted) : []);
    setBaseLoading(false);
  }, [operatorId]);

  useEffect(() => { fetchBase(); }, [fetchBase]);

  // ── Fetch enrolled students for selected class ────────────────────────────
  const fetchEnrolled = useCallback(async (cId) => {
    if (!cId) { setEnrolled([]); return; }
    setClassLoading(true);
    try {
      const data = await getClassStudents(cId);
      setEnrolled(Array.isArray(data?.students) ? data.students : []);
    } catch (e) {
      toastError(parseApiError(e));
      setEnrolled([]);
    } finally {
      setClassLoading(false);
    }
  }, [toastError]);

  useEffect(() => { fetchEnrolled(classId); }, [classId, fetchEnrolled]);

  // ── Enroll single student to class ───────────────────────────────────────
  const handleEnrollStudent = async () => {
    if (!classId || !addStudentId) return;
    setEnrolling(true);
    try {
      await enrollStudentToClass(classId, addStudentId);
      success('Student enrolled successfully');
      setAddStudentId('');
      fetchEnrolled(classId);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setEnrolling(false);
    }
  };

  // ── Remove student from class ─────────────────────────────────────────────
  const handleRemoveFromClass = async (studentId) => {
    if (!classId) return;
    try {
      await removeStudentFromClass(classId, studentId);
      success('Student removed from class');
      fetchEnrolled(classId);
    } catch (e) {
      toastError(parseApiError(e));
    }
  };

  // Non-enrolled students (for add dropdown)
  const enrolledIds = new Set(enrolled.map(s => String(s.id ?? s.studentId)));
  const notEnrolled = students.filter(s => !enrolledIds.has(String(s.id)));

  // ── Enroll class to common subjects ──────────────────────────────────────
  const toggleSubj = (id) => {
    const sid = String(id);
    setSelectedSubjIds(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]);
  };

  const handleEnrollCommonSubjects = async () => {
    if (!subjClassId || !selectedSubjIds.length) return;
    setEnrollingSubjects(true);
    try {
      await enrollClassCommonSubjects({ classId: subjClassId, subjectIds: selectedSubjIds });
      success('Class enrolled to common subjects');
      setSelectedSubjIds([]);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setEnrollingSubjects(false);
    }
  };

  // ── Enroll elective subject ───────────────────────────────────────────────
  const handleEnrollElective = async () => {
    if (!electStudentId || !electSubjectId || !electClassId) {
      toastError('Please fill in all elective enrollment fields');
      return;
    }
    setEnrollingElect(true);
    try {
      await enrollElectiveSubject({
        classId: electClassId,
        subjectId: electSubjectId,
        studentIds: [electStudentId],
      });
      success('Student enrolled in elective subject');
      setElectStudentId('');
      setElectSubjectId('');
      setElectClassId('');
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setEnrollingElect(false);
    }
  };

  if (baseLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        subtitle="Manage student and subject enrollments"
      />

      {/* Tab switcher */}
      <div className="flex gap-2 bg-white rounded-xl border border-gray-200 p-2 w-fit">
        <Tab label="Class Enrollments"   active={tab === 'class'}   onClick={() => setTab('class')} />
        <Tab label="Subject Enrollments" active={tab === 'subject'} onClick={() => setTab('subject')} />
      </div>

      {/* ── CLASS ENROLLMENTS ─────────────────────────────────────────────── */}
      {tab === 'class' && (
        <div className="space-y-4">
          <ClassSelector classes={classes} selectedId={classId} onChange={setClassId} loading={baseLoading} />

          {classId && (
            <>
              {/* Add student */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Enroll a Student</h3>
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[220px]">
                    <select
                      value={addStudentId}
                      onChange={(e) => setAddStudentId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="">Select student to enroll…</option>
                      {notEnrolled.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.globalStudentCode}{s.indexNumber ? ` — ${s.indexNumber}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleEnrollStudent}
                    disabled={!addStudentId || enrolling}
                    className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition"
                  >
                    {enrolling ? 'Enrolling…' : 'Enroll'}
                  </button>
                </div>
              </div>

              {/* Enrolled list */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Enrolled Students
                    {!classLoading && <span className="ml-2 text-xs text-gray-400 font-normal">({enrolled.length})</span>}
                  </h3>
                </div>
                {classLoading ? (
                  <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
                ) : enrolled.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-400">No students enrolled in this class yet.</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {enrolled.map((stu) => {
                      const stuId = stu.studentId ?? stu.id;
                      return (
                        <li key={stuId} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                          <div>
                            <span className="font-medium text-sm text-gray-800">{stu.studentName ?? stuId}</span>
                            {stu.indexNumber && <span className="ml-2 text-xs text-gray-400">({stu.indexNumber})</span>}
                          </div>
                          <button
                            onClick={() => handleRemoveFromClass(stuId)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                          >
                            Remove
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}

          {!classId && (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
              Select a class above to manage enrollments.
            </div>
          )}
        </div>
      )}

      {/* ── SUBJECT ENROLLMENTS ───────────────────────────────────────────── */}
      {tab === 'subject' && (
        <div className="space-y-6">
          {/* Common subjects */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Enroll Class to Common Subjects</h3>
              <p className="text-xs text-gray-400 mt-0.5">All enrolled students in the class will be added to the selected subjects.</p>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <select value={subjClassId} onChange={(e) => { setSubjClassId(e.target.value); setSelectedSubjIds([]); }}
                className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
                <option value="">Select a class…</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.academicYear ? ` (${c.academicYear})` : ''}</option>)}
              </select>
            </div>
            {subjClassId && (
              <>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Select subjects to enroll:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {subjects.map((sub) => (
                      <label key={sub.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:bg-teal-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={selectedSubjIds.includes(String(sub.id))}
                          onChange={() => toggleSubj(sub.id)}
                          className="rounded text-teal-600 focus:ring-teal-400"
                        />
                        <span className="text-sm text-gray-700">{sub.name}</span>
                        <span className="ml-auto text-xs text-gray-400">{sub.creditValue}cr</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleEnrollCommonSubjects}
                  disabled={!selectedSubjIds.length || enrollingSubjects}
                  className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition"
                >
                  {enrollingSubjects ? 'Enrolling…' : `Enroll to ${selectedSubjIds.length} Subject${selectedSubjIds.length !== 1 ? 's' : ''}`}
                </button>
              </>
            )}
          </div>

          {/* Elective subject */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Enroll Student to Elective Subject</h3>
              <p className="text-xs text-gray-400 mt-0.5">Enroll an individual student to a specific elective subject in a section.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Student</label>
                <select value={electStudentId} onChange={(e) => setElectStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
                  <option value="">Select student…</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.globalStudentCode}{s.indexNumber ? ` — ${s.indexNumber}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <select value={electSubjectId} onChange={(e) => setElectSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
                  <option value="">Select subject…</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                <select value={electClassId} onChange={(e) => setElectClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
                  <option value="">Select class…</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.academicYear ? ` (${c.academicYear})` : ''}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={handleEnrollElective}
              disabled={!electStudentId || !electSubjectId || !electClassId || enrollingElect}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition"
            >
              {enrollingElect ? 'Enrolling…' : 'Enroll in Elective'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsPage;
