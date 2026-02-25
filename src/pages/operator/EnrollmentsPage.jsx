import { useCallback, useEffect, useState } from 'react';
import {
  getClassesByOperator, getStudentsByOperator, getSubjectsByOperator,
  getStudentsByClassAndSubject,
} from '../../services/managementService';
import { useOperator } from '../../context/OperatorContext';
import {
  getClassStudents, enrollStudentToClass, removeStudentFromClass,
  enrollClassCommonSubjects, removeClassCommonSubjects, enrollElectiveSubject,
  getStudentSubjects, removeStudentFromSubject, bulkEnrollClass,
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

  // Bulk class enrollment state
  const [bulkSearch,      setBulkSearch]      = useState('');
  const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set());
  const [bulkEnrolling,   setBulkEnrolling]   = useState(false);

  // Subject enrollment state
  const [subjClassId,             setSubjClassId]             = useState('');
  const [selectedSubjIds,         setSelectedSubjIds]         = useState([]);
  const [enrollingSubjects,       setEnrollingSubjects]       = useState(false);
  const [currentClassSubjects,    setCurrentClassSubjects]    = useState([]);   // currently enrolled subjects for selected class
  const [loadingClassSubjects,    setLoadingClassSubjects]    = useState(false);
  const [rmvCommonSubjIds,        setRmvCommonSubjIds]        = useState(new Set());  // selected for removal
  const [removingCommonSubjects,  setRemovingCommonSubjects]  = useState(false);

  // Elective enrollment state
  const [electSubjectId,  setElectSubjectId]  = useState('');
  const [electClassId,    setElectClassId]    = useState('');
  const [electSelectedStudentIds, setElectSelectedStudentIds] = useState(new Set()); // bulk selection
  const [enrollingElect,  setEnrollingElect]  = useState(false);
  const [electClassStudents,     setElectClassStudents]     = useState([]);   // students in selected elective class
  const [electStudentSubjects,   setElectStudentSubjects]   = useState({});   // { studentId: SubjectEnrollmentDto[] }
  const [loadingElectStudents,   setLoadingElectStudents]   = useState(false);
  const [loadingElectSubjects,   setLoadingElectSubjects]   = useState(false);
  const [electClassCommonSubjectIds, setElectClassCommonSubjectIds] = useState(new Set()); // common subject IDs for elective class

  // Remove subject from student state
  const [rmvClassId,   setRmvClassId]   = useState('');
  const [rmvSubjectId, setRmvSubjectId] = useState('');
  const [rmvStudents,  setRmvStudents]  = useState([]);
  const [rmvLoading,   setRmvLoading]   = useState(false);



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

  // Non-enrolled students (for add dropdown & bulk)
  const enrolledIds = new Set(enrolled.map(s => String(s.id ?? s.studentId)));
  const notEnrolled = students.filter(s => !enrolledIds.has(String(s.id)));

  // Filtered non-enrolled students based on search
  const bulkFiltered = notEnrolled.filter(s => {
    if (!bulkSearch.trim()) return true;
    const q = bulkSearch.toLowerCase();
    return (s.globalStudentCode ?? '').toLowerCase().includes(q)
      || (s.indexNumber ?? '').toLowerCase().includes(q)
      || (s.firstName ?? '').toLowerCase().includes(q)
      || (s.lastName ?? '').toLowerCase().includes(q)
      || (`${s.firstName ?? ''} ${s.lastName ?? ''}`).toLowerCase().includes(q);
  });

  // Bulk toggle helpers for class enrollment
  const toggleBulkStudent = (sid) => {
    setBulkSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  };

  const toggleAllBulkStudents = () => {
    const filteredIds = bulkFiltered.map(s => String(s.id));
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => bulkSelectedIds.has(id));
    if (allSelected) {
      setBulkSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setBulkSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  // Bulk enroll handler
  const handleBulkEnroll = async () => {
    if (!classId || bulkSelectedIds.size === 0) return;
    setBulkEnrolling(true);
    try {
      const res = await bulkEnrollClass({
        classId,
        studentIds: [...bulkSelectedIds],
      });
      const msg = res?.successCount != null
        ? `Enrolled ${res.successCount} student${res.successCount !== 1 ? 's' : ''} successfully${res.failureCount ? ` (${res.failureCount} failed)` : ''}`
        : 'Students enrolled successfully';
      success(msg);
      setBulkSelectedIds(new Set());
      setBulkSearch('');
      fetchEnrolled(classId);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setBulkEnrolling(false);
    }
  };

  // ── Enroll class to common subjects ──────────────────────────────────────
  const toggleSubj = (id) => {
    const sid = String(id);
    setSelectedSubjIds(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]);
  };

  // ── Fetch currently enrolled subjects when subject-enrollment class changes ─
  const fetchClassSubjects = useCallback(async (cId) => {
    if (!cId) { setCurrentClassSubjects([]); return; }
    setLoadingClassSubjects(true);
    try {
      // Get enrolled students for this class, then use first student's subjects
      const clsData = await getClassStudents(cId);
      const stuList = Array.isArray(clsData?.students) ? clsData.students : [];
      if (stuList.length > 0) {
        const firstStudentId = stuList[0].studentId ?? stuList[0].id;
        const subs = await getStudentSubjects(firstStudentId);
        setCurrentClassSubjects(Array.isArray(subs) ? subs : []);
      } else {
        setCurrentClassSubjects([]);
      }
    } catch {
      setCurrentClassSubjects([]);
    } finally {
      setLoadingClassSubjects(false);
    }
  }, []);

  useEffect(() => { fetchClassSubjects(subjClassId); }, [subjClassId, fetchClassSubjects]);

  // ── Fetch students & their subjects when elective class changes ────────────
  const fetchElectClassStudents = useCallback(async (cId) => {
    if (!cId) { setElectClassStudents([]); setElectStudentSubjects({}); setElectClassCommonSubjectIds(new Set()); return; }
    setLoadingElectStudents(true);
    try {
      const data = await getClassStudents(cId);
      const stuList = Array.isArray(data?.students) ? data.students : [];
      setElectClassStudents(stuList);

      // Determine common subjects from first student, then fetch all students' subjects
      if (stuList.length > 0) {
        setLoadingElectSubjects(true);

        // Get first student's subjects to identify common ones
        const firstSid = stuList[0].studentId ?? stuList[0].id;
        let commonIds = new Set();
        try {
          const firstSubs = await getStudentSubjects(firstSid);
          const firstSubArr = Array.isArray(firstSubs) ? firstSubs : [];
          commonIds = new Set(firstSubArr.map(s => s.subjectId));
        } catch { /* ignore */ }

        // Fetch remaining students' subjects in parallel
        const results = await Promise.allSettled(
          stuList.map(s => getStudentSubjects(s.studentId ?? s.id).then(subs => ({
            studentId: s.studentId ?? s.id,
            subjects: Array.isArray(subs) ? subs : [],
          }))),
        );
        const subMap = {};
        results.forEach(r => {
          if (r.status === 'fulfilled') {
            subMap[r.value.studentId] = r.value.subjects;
          }
        });

        // Common subjects = subjects present in ALL students. Refine from first student's set.
        if (stuList.length > 1) {
          for (const stu of stuList) {
            const sid = stu.studentId ?? stu.id;
            const stuSubIds = new Set((subMap[sid] ?? []).map(s => s.subjectId));
            for (const cid of commonIds) {
              if (!stuSubIds.has(cid)) commonIds.delete(cid);
            }
          }
        }
        setElectClassCommonSubjectIds(commonIds);
        setElectStudentSubjects(subMap);
        setLoadingElectSubjects(false);
      }
    } catch (e) {
      toastError(parseApiError(e));
      setElectClassStudents([]);
    } finally {
      setLoadingElectStudents(false);
    }
  }, [toastError]);

  useEffect(() => { fetchElectClassStudents(electClassId); }, [electClassId, fetchElectClassStudents]);

  const handleSyncCommonSubjects = async () => {
    if (!subjClassId || !selectedSubjIds.length) return;
    setEnrollingSubjects(true);
    try {
      await enrollClassCommonSubjects({ classId: subjClassId, subjectIds: selectedSubjIds });
      success('Common subjects synced successfully');
      setSelectedSubjIds([]);
      fetchClassSubjects(subjClassId);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setEnrollingSubjects(false);
    }
  };

  // ── Remove common subjects from class ────────────────────────────────────
  const toggleRmvCommonSubj = (id) => {
    const sid = String(id);
    setRmvCommonSubjIds(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  };

  const handleRemoveCommonSubjects = async () => {
    if (!subjClassId || rmvCommonSubjIds.size === 0) return;
    setRemovingCommonSubjects(true);
    try {
      const res = await removeClassCommonSubjects({ classId: subjClassId, subjectIds: [...rmvCommonSubjIds] });
      const msg = res?.successCount != null
        ? `Removed ${res.successCount} subject${res.successCount !== 1 ? 's' : ''} successfully${res.failureCount ? ` (${res.failureCount} failed)` : ''}`
        : 'Common subjects removed from class';
      success(msg);
      setRmvCommonSubjIds(new Set());
      fetchClassSubjects(subjClassId);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setRemovingCommonSubjects(false);
    }
  };

  // ── Enroll elective subject (bulk) ────────────────────────────────────────
  const handleEnrollElective = async () => {
    if (!electClassId || !electSubjectId || electSelectedStudentIds.size === 0) {
      toastError('Please select a class, subject, and at least one student');
      return;
    }
    setEnrollingElect(true);
    try {
      const res = await enrollElectiveSubject({
        classId: electClassId,
        subjectId: electSubjectId,
        studentIds: [...electSelectedStudentIds],
      });
      const msg = res?.successCount != null
        ? `Enrolled ${res.successCount} student${res.successCount !== 1 ? 's' : ''} successfully${res.failureCount ? ` (${res.failureCount} failed)` : ''}`
        : 'Students enrolled in elective subject';
      success(msg);
      setElectSelectedStudentIds(new Set());
      fetchElectClassStudents(electClassId); // refresh student-subject list
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setEnrollingElect(false);
    }
  };

  // ── Bulk toggle helpers ─────────────────────────────────────────────────
  const toggleElectStudent = (sid) => {
    setElectSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  };

  const toggleAllElectStudents = () => {
    if (!electSubjectId) return;
    // Only toggle students who are NOT already enrolled in this subject
    const eligible = electClassStudents.filter(stu => {
      const sid = stu.studentId ?? stu.id;
      const stuSubs = electStudentSubjects[sid] ?? [];
      return !stuSubs.some(s => s.subjectId === electSubjectId);
    }).map(stu => stu.studentId ?? stu.id);
    const allSelected = eligible.every(sid => electSelectedStudentIds.has(sid));
    if (allSelected) {
      setElectSelectedStudentIds(new Set());
    } else {
      setElectSelectedStudentIds(new Set(eligible));
    }
  };

  // ── Remove Subject: fetch students enrolled in class+subject ──────────────
  const fetchRmvStudents = useCallback(async (cId, sId) => {
    if (!cId || !sId) { setRmvStudents([]); return; }
    setRmvLoading(true);
    try {
      const data = await getStudentsByClassAndSubject(cId, sId);
      setRmvStudents(Array.isArray(data) ? data : []);
    } catch {
      setRmvStudents([]);
    } finally {
      setRmvLoading(false);
    }
  }, []);

  useEffect(() => { fetchRmvStudents(rmvClassId, rmvSubjectId); }, [rmvClassId, rmvSubjectId, fetchRmvStudents]);

  // ── Remove Subject: remove student from subject ───────────────────────────
  const handleRmvStudent = async (studentId) => {
    if (!rmvSubjectId || !rmvClassId) return;
    const cls = classes.find(c => c.id === rmvClassId);
    if (!cls?.sectionId) { toastError('Class has no associated section'); return; }
    try {
      await removeStudentFromSubject(rmvSubjectId, cls.sectionId, studentId);
      success('Subject removed from student');
      fetchRmvStudents(rmvClassId, rmvSubjectId);
    } catch (e) {
      toastError(parseApiError(e));
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
              {/* Add single student */}
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

              {/* Bulk enroll students */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Bulk Enroll Students</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Search and select multiple students to enroll at once.</p>
                </div>

                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={bulkSearch}
                    onChange={(e) => setBulkSearch(e.target.value)}
                    placeholder="Search by name, student code, or index number…"
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>

                {/* Selection info bar */}
                {bulkSelectedIds.size > 0 && (
                  <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-4 py-2">
                    <span className="text-sm text-teal-700 font-medium">
                      {bulkSelectedIds.size} student{bulkSelectedIds.size !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => setBulkSelectedIds(new Set())}
                      className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                    >
                      Clear selection
                    </button>
                  </div>
                )}

                {/* Student table */}
                {notEnrolled.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4">All students are already enrolled in this class.</p>
                ) : bulkFiltered.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4">No students match your search.</p>
                ) : (() => {
                  const filteredIds = bulkFiltered.map(s => String(s.id));
                  const allVisible = filteredIds.length > 0 && filteredIds.every(id => bulkSelectedIds.has(id));
                  return (
                    <div className="overflow-x-auto max-h-72 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-3 py-2 w-10">
                              <input
                                type="checkbox"
                                checked={allVisible}
                                onChange={toggleAllBulkStudents}
                                className="rounded text-teal-600 focus:ring-teal-400"
                                title="Select all visible students"
                              />
                            </th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-8">#</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Student Code</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Index No.</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkFiltered.map((stu, idx) => {
                            const sid = String(stu.id);
                            const checked = bulkSelectedIds.has(sid);
                            return (
                              <tr
                                key={sid}
                                onClick={() => toggleBulkStudent(sid)}
                                className={`border-b border-gray-100 cursor-pointer transition ${
                                  checked ? 'bg-teal-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleBulkStudent(sid)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="rounded text-teal-600 focus:ring-teal-400"
                                  />
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-400">{idx + 1}</td>
                                <td className="px-3 py-2 text-sm font-medium text-gray-800">{stu.globalStudentCode ?? '—'}</td>
                                <td className="px-3 py-2 text-xs text-gray-500">{stu.indexNumber ?? '—'}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">
                                  {[stu.firstName, stu.lastName].filter(Boolean).join(' ') || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                <button
                  onClick={handleBulkEnroll}
                  disabled={bulkSelectedIds.size === 0 || bulkEnrolling}
                  className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition"
                >
                  {bulkEnrolling ? 'Enrolling…' : `Enroll ${bulkSelectedIds.size || ''} Student${bulkSelectedIds.size !== 1 ? 's' : ''}`}
                </button>
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
              <h3 className="text-sm font-semibold text-gray-800">Sync Common Subjects</h3>
              <p className="text-xs text-gray-400 mt-0.5">Select all subjects that should be common for this class, then sync. Students will be added to new subjects and removed from deselected ones.</p>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <select value={subjClassId} onChange={(e) => { setSubjClassId(e.target.value); setSelectedSubjIds([]); setRmvCommonSubjIds(new Set()); }}
                className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
                <option value="">Select a class…</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.academicYear ? ` (${c.academicYear})` : ''}</option>)}
              </select>
            </div>

            {/* Currently enrolled subjects for chosen class */}
            {subjClassId && (
              <>
                <div className="bg-gray-50 rounded-lg border border-gray-100 p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Currently Enrolled Subjects</p>
                  {loadingClassSubjects ? (
                    <div className="flex items-center justify-center py-4"><LoadingSpinner /></div>
                  ) : currentClassSubjects.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No common subjects enrolled for this class yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentClassSubjects.map((sub) => (
                        <span
                          key={sub.subjectId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-teal-100 text-teal-800 border-teal-200"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          {sub.subjectName}
                          <span className="text-[10px] text-teal-500">{sub.creditValue}cr</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Select subjects to sync as common:</p>
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
                  onClick={handleSyncCommonSubjects}
                  disabled={!selectedSubjIds.length || enrollingSubjects}
                  className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition"
                >
                  {enrollingSubjects ? 'Syncing…' : `Sync ${selectedSubjIds.length} Subject${selectedSubjIds.length !== 1 ? 's' : ''}`}
                </button>
              </>
            )}
          </div>

          {/* Elective subject – bulk enroll */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Enroll Students to Elective Subject</h3>
              <p className="text-xs text-gray-400 mt-0.5">Select a class and subject, then pick students to bulk-enroll into the elective.</p>
            </div>

            {/* Class & Subject selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                <select value={electClassId} onChange={(e) => { setElectClassId(e.target.value); setElectSubjectId(''); setElectSelectedStudentIds(new Set()); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
                  <option value="">Select class…</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.academicYear ? ` (${c.academicYear})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Elective Subject</label>
                <select value={electSubjectId} onChange={(e) => { setElectSubjectId(e.target.value); setElectSelectedStudentIds(new Set()); }}
                  disabled={!electClassId}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50">
                  <option value="">Select subject…</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Student selection table with checkboxes */}
            {electClassId && electSubjectId && (
              <div className="bg-gray-50 rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Select Students to Enroll
                  </p>
                  {electSelectedStudentIds.size > 0 && (
                    <span className="text-xs text-teal-600 font-medium">{electSelectedStudentIds.size} selected</span>
                  )}
                </div>
                {loadingElectStudents || loadingElectSubjects ? (
                  <div className="flex items-center justify-center py-6"><LoadingSpinner /></div>
                ) : electClassStudents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4">No students enrolled in this class.</p>
                ) : (() => {
                  const eligibleIds = electClassStudents
                    .filter(stu => {
                      const sid = stu.studentId ?? stu.id;
                      const stuSubs = electStudentSubjects[sid] ?? [];
                      return !stuSubs.some(s => s.subjectId === electSubjectId);
                    })
                    .map(stu => stu.studentId ?? stu.id);
                  const allEligibleSelected = eligibleIds.length > 0 && eligibleIds.every(sid => electSelectedStudentIds.has(sid));
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 bg-white">
                            <th className="px-3 py-2 w-10">
                              <input
                                type="checkbox"
                                checked={allEligibleSelected}
                                onChange={toggleAllElectStudents}
                                disabled={eligibleIds.length === 0}
                                className="rounded text-teal-600 focus:ring-teal-400"
                                title="Select all eligible students"
                              />
                            </th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-8">#</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Student</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Index</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {electClassStudents.map((stu, idx) => {
                            const sid = stu.studentId ?? stu.id;
                            const stuSubs = electStudentSubjects[sid] ?? [];
                            const alreadyEnrolled = stuSubs.some(s => s.subjectId === electSubjectId);
                            return (
                              <tr key={sid} className={`border-b border-gray-100 transition ${alreadyEnrolled ? 'bg-teal-50/40' : 'hover:bg-white'}`}>
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={electSelectedStudentIds.has(sid) || alreadyEnrolled}
                                    onChange={() => !alreadyEnrolled && toggleElectStudent(sid)}
                                    disabled={alreadyEnrolled}
                                    className="rounded text-teal-600 focus:ring-teal-400 disabled:opacity-50"
                                  />
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-400">{idx + 1}</td>
                                <td className="px-3 py-2 text-sm font-medium text-gray-800">{stu.studentName ?? stu.globalStudentCode ?? sid}</td>
                                <td className="px-3 py-2 text-xs text-gray-500">{stu.indexNumber ?? '—'}</td>
                                <td className="px-3 py-2">
                                  {alreadyEnrolled ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[11px] font-medium border border-teal-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                      Enrolled
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">Not enrolled</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            <button
              onClick={handleEnrollElective}
              disabled={!electClassId || !electSubjectId || electSelectedStudentIds.size === 0 || enrollingElect}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition"
            >
              {enrollingElect ? 'Enrolling…' : `Enroll ${electSelectedStudentIds.size || ''} Student${electSelectedStudentIds.size !== 1 ? 's' : ''} in Elective`}
            </button>

            {/* Student & Elective Subjects Table (overview) */}
            {electClassId && (
              <div className="bg-gray-50 rounded-lg border border-gray-100 p-3 mt-2">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  Students & Their Subjects
                </p>
                {loadingElectStudents ? (
                  <div className="flex items-center justify-center py-6"><LoadingSpinner /></div>
                ) : electClassStudents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4">No students enrolled in this class.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-white">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-8">#</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Student</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Index</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Subjects</th>
                        </tr>
                      </thead>
                      <tbody>
                        {electClassStudents.map((stu, idx) => {
                          const sid = stu.studentId ?? stu.id;
                          const stuSubs = electStudentSubjects[sid] ?? [];
                          return (
                            <tr key={sid} className="border-b border-gray-100 hover:bg-white transition">
                              <td className="px-3 py-2 text-xs text-gray-400">{idx + 1}</td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-800">{stu.studentName ?? stu.globalStudentCode ?? sid}</td>
                              <td className="px-3 py-2 text-xs text-gray-500">{stu.indexNumber ?? '—'}</td>
                              <td className="px-3 py-2">
                                {loadingElectSubjects ? (
                                  <span className="text-xs text-gray-400">Loading…</span>
                                ) : stuSubs.length === 0 ? (
                                  <span className="text-xs text-gray-400 italic">No subjects enrolled</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {stuSubs.map((sub) => {
                                      const isCommon = electClassCommonSubjectIds.has(sub.subjectId);
                                      return (
                                        <span
                                          key={sub.subjectId}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                            isCommon
                                              ? 'bg-gray-100 text-gray-600 border-gray-200'
                                              : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                          }`}
                                        >
                                          {sub.subjectName}
                                          <span className={`text-[9px] ${isCommon ? 'text-gray-400' : 'text-indigo-400'}`}>{sub.creditValue}cr</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Remove Subject from Student ──────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Remove Subject from Student</h3>
              <p className="text-xs text-gray-400 mt-0.5">Select a class and subject to view enrolled students, then remove a subject assignment.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                <select
                  value={rmvClassId}
                  onChange={(e) => { setRmvClassId(e.target.value); setRmvSubjectId(''); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                >
                  <option value="">Select class…</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.academicYear ? ` (${c.academicYear})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <select
                  value={rmvSubjectId}
                  onChange={(e) => setRmvSubjectId(e.target.value)}
                  disabled={!rmvClassId}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">Select subject…</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {rmvClassId && rmvSubjectId && (
              <div className="bg-gray-50 rounded-lg border border-gray-100 p-3">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  Students Enrolled in This Subject
                  {!rmvLoading && <span className="ml-1 font-normal text-gray-400">({rmvStudents.length})</span>}
                </p>
                {rmvLoading ? (
                  <div className="flex items-center justify-center py-6"><LoadingSpinner /></div>
                ) : rmvStudents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4">No students enrolled in this subject for the selected class.</p>
                ) : (
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-white border-b border-gray-200">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-8">#</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Student</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Index No.</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rmvStudents.map((stu, idx) => {
                          const stuId = stu.studentId ?? stu.id;
                          const name = stu.studentName ?? stu.globalStudentCode
                            ?? [stu.firstName, stu.lastName].filter(Boolean).join(' ')
                            ?? stuId;
                          return (
                            <tr key={stuId} className="border-b border-gray-100 hover:bg-white transition">
                              <td className="px-3 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                              <td className="px-3 py-2.5 text-sm font-medium text-gray-800">{name}</td>
                              <td className="px-3 py-2.5 text-xs text-gray-500">{stu.indexNumber ?? '—'}</td>
                              <td className="px-3 py-2.5 text-right">
                                <button
                                  onClick={() => handleRmvStudent(stuId)}
                                  className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsPage;
