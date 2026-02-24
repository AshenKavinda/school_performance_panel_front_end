import { useCallback, useEffect, useState, useMemo } from 'react';
import { getTeacherAssignments, getSubjectStudents } from '../../services/enrollmentService';
import { getClassesBySection, getModulesBySectionSubject } from '../../services/managementService';
import {
  bulkCreateSubjectMarks, getSubjectMarksByClassSubjectTerm,
  updateSubjectMark, deleteSubjectMark,
} from '../../services/marksService';
import {
  bulkCreateModuleMarks, getModuleMarksByModule,
  updateModuleMark, deleteModuleMark,
} from '../../services/marksService';
import { useTeacher } from '../../context/TeacherContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import { PageHeader, LoadingSpinner, Modal, ConfirmDialog } from '../../components/common';

const TERMS = [
  { value: 'FIRST_TERM', label: 'First Term' },
  { value: 'SECOND_TERM', label: 'Second Term' },
  { value: 'FINAL_TERM', label: 'Final Term' },
];

const MarkEntry = () => {
  const { teacherId, loading: ctxLoading } = useTeacher();
  const { success: toastSuccess, error: toastError } = useToast();

  // ── Selection state ─────────────────────────────────────────────────────────
  const [classes, setClasses]         = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classType, setClassType]     = useState(null);         // 'SUBJECT_BASE' | 'MODULE_BASE'
  const [sectionId, setSectionId]     = useState(null);

  // Teacher's assigned subjects for the dropdown
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject]     = useState('');

  // SUBJECT_BASE: term
  const [selectedTerm, setSelectedTerm] = useState('');

  // MODULE_BASE: modules for selected subject + section
  const [modules, setModules]           = useState([]);
  const [selectedModule, setSelectedModule] = useState('');

  // Students & marks
  const [students, setStudents]       = useState([]);
  const [marks, setMarks]             = useState({});           // { studentId: mark (string) }
  const [existingMarks, setExistingMarks] = useState([]);       // fetched existing marks

  // Loading flags
  const [loadingClasses, setLoadingClasses]   = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingModules, setLoadingModules]   = useState(false);
  const [loadingMarks, setLoadingMarks]       = useState(false);
  const [submitting, setSubmitting]           = useState(false);

  // Edit/delete individual mark
  const [editModal, setEditModal]       = useState({ open: false, student: null, mark: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, student: null });
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch classes from teacher's sections ────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    if (!teacherId) { setLoadingClasses(false); return; }
    setLoadingClasses(true);
    try {
      const assignments = await getTeacherAssignments(teacherId);
      setAssignedSubjects(Array.isArray(assignments?.assignedSubjects) ? assignments.assignedSubjects : []);
      const sectionList = Array.isArray(assignments?.assignedSections) ? assignments.assignedSections : [];

      const classResults = await Promise.allSettled(
        sectionList.map(sec => getClassesBySection(sec.sectionId))
      );
      const allClasses = [];
      const seen = new Set();
      classResults.forEach(res => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          res.value.filter(c => !c.isDeleted).forEach(c => {
            if (!seen.has(c.id)) { seen.add(c.id); allClasses.push(c); }
          });
        }
      });
      allClasses.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
      setClasses(allClasses);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setLoadingClasses(false);
    }
  }, [teacherId, toastError]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  // ── Class change handler ────────────────────────────────────────────────────
  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    const cls = classes.find(c => c.id === classId);
    setClassType(cls?.classType ?? null);
    setSectionId(cls?.sectionId ?? null);
    // Reset downstream selections
    setSelectedSubject('');
    setSelectedTerm('');
    setSelectedModule('');
    setModules([]);
    setStudents([]);
    setMarks({});
    setExistingMarks([]);
  };

  // ── Subject change handler ──────────────────────────────────────────────────
  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    setSelectedTerm('');
    setSelectedModule('');
    setModules([]);
    setStudents([]);
    setMarks({});
    setExistingMarks([]);

    // If MODULE_BASE, fetch modules for this subject + section
    if (classType === 'MODULE_BASE' && subjectId && sectionId) {
      fetchModules(sectionId, subjectId);
    }
  };

  // ── Fetch modules for MODULE_BASE ───────────────────────────────────────────
  const fetchModules = async (secId, subId) => {
    setLoadingModules(true);
    try {
      const data = await getModulesBySectionSubject(secId, subId);
      setModules(Array.isArray(data) ? data.filter(m => !m.isDeleted) : []);
    } catch (e) {
      if (e?.response?.status !== 404) toastError(parseApiError(e));
      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  // ── Ready to load students + existing marks? ────────────────────────────────
  const canLoadMarks = useMemo(() => {
    if (!selectedClass || !selectedSubject) return false;
    if (classType === 'SUBJECT_BASE' && !selectedTerm) return false;
    if (classType === 'MODULE_BASE' && !selectedModule) return false;
    return true;
  }, [selectedClass, selectedSubject, selectedTerm, selectedModule, classType]);

  // ── Load students and existing marks ────────────────────────────────────────
  const loadStudentsAndMarks = useCallback(async () => {
    if (!canLoadMarks) return;
    setLoadingStudents(true);
    setLoadingMarks(true);
    try {
      // Fetch enrolled students via subject+section (teachers lack class-student access)
      const studentData = await getSubjectStudents(selectedSubject, sectionId);
      const stuList = Array.isArray(studentData?.students) ? studentData.students : [];
      setStudents(stuList);

      // Fetch existing marks
      let existingData = [];
      if (classType === 'SUBJECT_BASE') {
        try {
          existingData = await getSubjectMarksByClassSubjectTerm(selectedClass, selectedSubject, selectedTerm);
          if (!Array.isArray(existingData)) existingData = [];
        } catch { existingData = []; }
      } else {
        try {
          existingData = await getModuleMarksByModule(selectedModule);
          if (!Array.isArray(existingData)) existingData = [];
        } catch { existingData = []; }
      }
      setExistingMarks(existingData);

      // Pre-fill marks from existing data
      const prefilled = {};
      stuList.forEach(stu => {
        const existing = existingData.find(m => m.studentId === stu.studentId);
        prefilled[stu.studentId] = existing ? String(existing.mark) : '';
      });
      setMarks(prefilled);
    } catch (e) {
      if (e?.response?.status !== 404) toastError(parseApiError(e));
      setStudents([]);
    } finally {
      setLoadingStudents(false);
      setLoadingMarks(false);
    }
  }, [canLoadMarks, selectedClass, selectedSubject, selectedTerm, selectedModule, classType, sectionId, toastError]);

  useEffect(() => { if (canLoadMarks) loadStudentsAndMarks(); }, [canLoadMarks, loadStudentsAndMarks]);

  // ── Mark input change ───────────────────────────────────────────────────────
  const handleMarkChange = (studentId, value) => {
    // Allow empty, or 0-100
    if (value === '' || (/^\d{0,3}$/.test(value) && parseInt(value, 10) <= 100)) {
      setMarks(prev => ({ ...prev, [studentId]: value }));
    }
  };

  // ── Bulk submit marks ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Collect valid marks
    const markEntries = students
      .filter(stu => marks[stu.studentId] !== '' && marks[stu.studentId] != null)
      .map(stu => ({ studentId: stu.studentId, mark: parseInt(marks[stu.studentId], 10) }));

    if (markEntries.length === 0) {
      toastError('Please enter at least one mark.');
      return;
    }

    setSubmitting(true);
    try {
      let result;
      if (classType === 'SUBJECT_BASE') {
        result = await bulkCreateSubjectMarks({
          subjectId: selectedSubject,
          classId: selectedClass,
          termTest: selectedTerm,
          marks: markEntries,
        });
      } else {
        result = await bulkCreateModuleMarks({
          subjectId: selectedSubject,
          classId: selectedClass,
          moduleId: selectedModule,
          marks: markEntries,
        });
      }

      if (result?.success) {
        toastSuccess(`Marks saved — ${result.created ?? 0} created, ${result.updated ?? 0} updated.`);
        loadStudentsAndMarks(); // refresh
      } else {
        toastError(result?.message ?? 'Marks submission failed.');
        if (result?.errors?.length) {
          result.errors.forEach(err => toastError(err));
        }
      }
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit individual mark ────────────────────────────────────────────────────
  const openEdit = (student) => {
    const existing = existingMarks.find(m => m.studentId === student.studentId);
    setEditModal({
      open: true,
      student,
      mark: existing ? String(existing.mark) : marks[student.studentId] ?? '',
    });
  };

  const handleEditSave = async () => {
    const { student, mark } = editModal;
    if (mark === '' || isNaN(mark) || parseInt(mark) < 0 || parseInt(mark) > 100) {
      toastError('Mark must be between 0 and 100.');
      return;
    }
    setActionLoading(true);
    try {
      if (classType === 'SUBJECT_BASE') {
        await updateSubjectMark(student.studentId, selectedClass, selectedSubject, selectedTerm, { mark: parseInt(mark) });
      } else {
        await updateModuleMark(student.studentId, selectedModule, { mark: parseInt(mark) });
      }
      toastSuccess('Mark updated successfully.');
      setEditModal({ open: false, student: null, mark: '' });
      loadStudentsAndMarks();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Delete individual mark ──────────────────────────────────────────────────
  const openDelete = (student) => {
    setDeleteConfirm({ open: true, student });
  };

  const handleDelete = async () => {
    const { student } = deleteConfirm;
    setActionLoading(true);
    try {
      if (classType === 'SUBJECT_BASE') {
        await deleteSubjectMark(student.studentId, selectedClass, selectedSubject, selectedTerm);
      } else {
        await deleteModuleMark(student.studentId, selectedModule);
      }
      toastSuccess('Mark deleted successfully.');
      setDeleteConfirm({ open: false, student: null });
      loadStudentsAndMarks();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const hasExistingMark = (studentId) => existingMarks.some(m => m.studentId === studentId);
  const filledMarkCount = students.filter(s => marks[s.studentId] !== '' && marks[s.studentId] != null).length;

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Mark Entry" subtitle="Enter or update exam marks for your classes" />

      {/* ── Selection Panel ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        {/* Row 1: Class */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
          {loadingClasses ? (
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <select
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">— Choose a class —</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.sectionName ? `(${c.sectionName})` : ''} — {c.academicYear ?? ''} [{c.classType ?? ''}]
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Class type badge */}
        {classType && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              classType === 'SUBJECT_BASE'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {classType === 'SUBJECT_BASE' ? 'Subject-Based Marks' : 'Module-Based Marks'}
            </span>
          </div>
        )}

        {/* Row 2: Subject */}
        {selectedClass && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">— Choose a subject —</option>
              {assignedSubjects.map(s => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.subjectName ?? '—'} (Credit: {s.creditValue ?? '—'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Row 3: Term (SUBJECT_BASE) or Module (MODULE_BASE) */}
        {selectedSubject && classType === 'SUBJECT_BASE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => { setSelectedTerm(e.target.value); setStudents([]); setMarks({}); setExistingMarks([]); }}
              className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">— Choose a term —</option>
              {TERMS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        )}

        {selectedSubject && classType === 'MODULE_BASE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Module</label>
            {loadingModules ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <select
                value={selectedModule}
                onChange={(e) => { setSelectedModule(e.target.value); setStudents([]); setMarks({}); setExistingMarks([]); }}
                className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">— Choose a module —</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? '—'} (Weight: {m.moduleWeight ?? '—'}%)
                  </option>
                ))}
              </select>
            )}
            {modules.length === 0 && !loadingModules && selectedSubject && (
              <p className="text-xs text-gray-400 mt-1">No modules found for this subject in the class&apos;s section.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Mark Entry Table ─────────────────────────────────────────────── */}
      {canLoadMarks && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Student Marks
              <span className="text-gray-400 font-normal ml-2">
                ({filledMarkCount}/{students.length} entered)
              </span>
            </h3>
            <button
              onClick={handleSubmit}
              disabled={submitting || filledMarkCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting && <LoadingSpinner size="sm" color="border-white" inline />}
              {submitting ? 'Submitting…' : 'Submit Marks'}
            </button>
          </div>

          {loadingStudents || loadingMarks ? (
            <div className="p-6">
              <LoadingSpinner label="Loading students and marks…" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-gray-400 p-6 text-center">No students enrolled in this class.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-12">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Index</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-32">Mark (0-100)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((stu, i) => {
                    const hasExisting = hasExistingMark(stu.studentId);
                    return (
                      <tr key={stu.studentId} className="hover:bg-orange-50/30 transition">
                        <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{stu.studentName ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{stu.indexNumber ?? '—'}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={marks[stu.studentId] ?? ''}
                            onChange={(e) => handleMarkChange(stu.studentId, e.target.value)}
                            className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="—"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {hasExisting ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Saved
                            </span>
                          ) : marks[stu.studentId] ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              New
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              Empty
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {hasExisting && (
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => openEdit(stu)}
                                className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-lg transition"
                                title="Edit mark"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => openDelete(stu)}
                                className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition"
                                title="Delete mark"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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

      {/* ── Edit Mark Modal ──────────────────────────────────────────────── */}
      <Modal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, student: null, mark: '' })}
        title={`Edit Mark — ${editModal.student?.studentName ?? ''}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
            <button
              onClick={() => setEditModal({ open: false, student: null, mark: '' })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSave}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 transition"
            >
              {actionLoading && <LoadingSpinner size="sm" color="border-white" inline />}
              Save
            </button>
          </div>
        }
      >
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Mark (0 – 100)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={editModal.mark}
            onChange={(e) => setEditModal(prev => ({ ...prev, mark: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </Modal>

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, student: null })}
        onConfirm={handleDelete}
        title="Delete Mark"
        message={`Are you sure you want to delete the mark for ${deleteConfirm.student?.studentName ?? 'this student'}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default MarkEntry;
