import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { getClassesByOperator, getSubjectsByClass } from '../../services/managementService';
import { useOperator } from '../../context/OperatorContext';
import {
  getTimeSlots,
  getTimetablesByClass, createTimetable, updateTimetable, deleteTimetable,
  checkTimetableConflicts, getTeacherWeeklySchedule,
} from '../../services/timetableService';
import {
  getSectionSubjectTeachers,
} from '../../services/enrollmentService';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import { PageHeader, LoadingSpinner, ConfirmDialog, Modal } from '../../components/common';

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS = { MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday' };
const DAY_SHORT  = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri' };

const UNCHANGEABLE_SLOT_IDS = new Set([
  '2d09f0d6-814a-4b22-a2fd-f5f28c8c193b', // Morning Activities
  '4904d281-9f1f-4fff-add1-40aad022de5b', // Interval
  '09c65c8a-b918-40bf-8cee-cecf2af7e40f', // Break
]);

// Labels shown in the merged day cells for fixed break/activity slots
const BLOCK_SLOT_LABELS = {
  '2d09f0d6-814a-4b22-a2fd-f5f28c8c193b': 'Morning Activities',
  '4904d281-9f1f-4fff-add1-40aad022de5b': 'Interval',
  '09c65c8a-b918-40bf-8cee-cecf2af7e40f': 'Break',
};

const SUBJECT_COLORS = [
  { bg: 'bg-blue-100',    border: 'border-blue-300',    text: 'text-blue-800',    pill: 'bg-blue-500' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', pill: 'bg-emerald-500' },
  { bg: 'bg-purple-100',  border: 'border-purple-300',  text: 'text-purple-800',  pill: 'bg-purple-500' },
  { bg: 'bg-orange-100',  border: 'border-orange-300',  text: 'text-orange-800',  pill: 'bg-orange-500' },
  { bg: 'bg-pink-100',    border: 'border-pink-300',    text: 'text-pink-800',    pill: 'bg-pink-500' },
  { bg: 'bg-yellow-100',  border: 'border-yellow-300',  text: 'text-yellow-800',  pill: 'bg-yellow-500' },
  { bg: 'bg-indigo-100',  border: 'border-indigo-300',  text: 'text-indigo-800',  pill: 'bg-indigo-500' },
  { bg: 'bg-red-100',     border: 'border-red-300',     text: 'text-red-800',     pill: 'bg-red-500' },
  { bg: 'bg-cyan-100',    border: 'border-cyan-300',    text: 'text-cyan-800',    pill: 'bg-cyan-500' },
  { bg: 'bg-lime-100',    border: 'border-lime-300',    text: 'text-lime-800',    pill: 'bg-lime-500' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fromTimeSpan = (t) => {
  if (!t) return '';
  const parts = t.split(':');
  return parts.length >= 2 ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}` : t;
};

const isUnchangeable = (slotId) => UNCHANGEABLE_SLOT_IDS.has((slotId ?? '').toLowerCase());

const getSubjectColor = (subjectId, subjectIds) => {
  const idx = subjectIds.indexOf(subjectId);
  return SUBJECT_COLORS[idx >= 0 ? idx % SUBJECT_COLORS.length : 0];
};

// ── Draggable Subject Pill (MODULE-LEVEL) ─────────────────────────────────────
const SubjectPill = ({ subject, color, count }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      subjectId:   subject.subjectId ?? subject.id,
      subjectName: subject.subjectName ?? subject.name,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing
        ${color.bg} ${color.border} ${color.text} hover:shadow-md transition select-none`}
      title={`Drag to schedule "${subject.subjectName ?? subject.name}"`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${color.pill} flex-shrink-0`} />
      <span className="text-xs font-semibold truncate flex-1">{subject.subjectName ?? subject.name}</span>
      {count > 0 && (
        <span className="ml-auto text-[10px] font-bold opacity-60 flex-shrink-0">{count}×</span>
      )}
    </div>
  );
};

// ── Timetable Cell (MODULE-LEVEL) ─────────────────────────────────────────────
const TimetableCell = ({ entries = [], slot, day, isFixed, onDrop, onClick, subjectIds }) => {
  const [dragOver, setDragOver] = useState(false);
  const cellRef = useRef(null);
  const hasEntries = entries.length > 0;

  const handleDragOver = (e) => {
    if (isFixed) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (isFixed) return;
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop?.(data, slot, day);
    } catch { /* ignore bad data */ }
  };

  // Fixed / unchangeable slot
  if (isFixed) {
    return (
      <td className="px-1 py-1.5 border border-gray-200 bg-gray-100 text-center align-middle min-w-[130px]">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{slot.name}</span>
      </td>
    );
  }

  // Cell with entries (still droppable for additional optional subjects)
  if (hasEntries) {
    return (
      <td
        ref={cellRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`px-1 py-1 border border-gray-200 align-middle min-w-[130px] transition-colors
          ${dragOver ? 'ring-2 ring-inset ring-teal-400 bg-teal-50' : ''}`}
      >
        <div className="space-y-1">
          {entries.map((entry) => {
            const color = getSubjectColor(entry.subjectId, subjectIds);
            return (
              <div key={entry.id}
                onClick={() => onClick?.(entry)}
                className={`rounded-lg p-1.5 ${color.bg} ${color.border} border cursor-pointer group relative`}
              >
                <p className={`text-[11px] font-semibold leading-tight truncate ${color.text}`}>
                  {entry.subjectName ?? 'Subject'}
                  {entry.isOptional && <span className="ml-1 text-[9px] opacity-60">(Opt)</span>}
                </p>
                <p className={`text-[10px] mt-0.5 truncate ${color.text} opacity-70`}>
                  {entry.teacherName ?? entry.teacherUsername ?? '—'}
                </p>
              </div>
            );
          })}
        </div>
      </td>
    );
  }

  // Empty droppable cell
  return (
    <td
      ref={cellRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`px-1 py-1 border border-gray-200 align-middle min-w-[130px] transition-colors
        ${dragOver ? 'bg-teal-50 ring-2 ring-inset ring-teal-400' : 'bg-white hover:bg-gray-50'}`}
    >
      <div className="h-10" />
    </td>
  );
};

// ── Teacher Row in assignment modal (MODULE-LEVEL) ────────────────────────────
const TeacherRow = ({ teacher, conflict, onAssign, assigning, onViewSchedule }) => {
  const hasConflict = conflict?.hasConflict;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasConflict ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${hasConflict ? 'bg-red-500' : 'bg-green-500'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {teacher.teacherName ?? teacher.teacherUsername ?? 'Teacher'}
        </p>
        {teacher.teacherIdNumber && (
          <p className="text-xs text-gray-500">{teacher.teacherIdNumber}</p>
        )}
        {hasConflict && (
          <div className="mt-1.5 space-y-1">
            <p className="text-xs text-red-700 font-medium">
              {conflict.conflictType === 'TEACHER' ? 'Teacher busy' : conflict.conflictType ?? 'Conflict'}
            </p>
            <p className="text-xs text-red-600">{conflict.message}</p>
            {conflict.conflictingEntry && (
              <div className="mt-1 text-xs text-red-500 bg-red-100 rounded px-2 py-1">
                <span className="font-medium">{conflict.conflictingEntry.className}</span>
                {' — '}{conflict.conflictingEntry.subjectName}
                {' ('}{fromTimeSpan(conflict.conflictingEntry.startTime)}–{fromTimeSpan(conflict.conflictingEntry.endTime)}{')'}
              </div>
            )}
            <button
              onClick={() => onViewSchedule?.(teacher)}
              className="text-xs text-red-700 underline hover:text-red-900 mt-1"
            >
              View teacher's weekly schedule
            </button>
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        {hasConflict ? (
          <span className="inline-flex items-center text-xs font-medium text-red-600 px-2 py-1 rounded-full bg-red-100">
            Unavailable
          </span>
        ) : (
          <button
            onClick={() => onAssign?.(teacher)}
            disabled={assigning}
            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            {assigning ? 'Assigning…' : 'Assign'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Teacher weekly schedule view (MODULE-LEVEL) ───────────────────────────────
const TeacherScheduleView = ({ schedule, teacherName }) => {
  if (!schedule || schedule.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">No schedule data available.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Weekly schedule for <span className="font-bold">{teacherName}</span></p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-2 text-left font-semibold text-gray-500">Day</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-500">Time</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-500">Class</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-500">Subject</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((dayEntry) => (
              (dayEntry.classes ?? []).map((cls, i) => (
                <tr key={`${dayEntry.day}-${i}`} className="border-t border-gray-100">
                  {i === 0 && (
                    <td className="px-2 py-1.5 font-medium text-gray-700" rowSpan={dayEntry.classes.length}>
                      {DAY_SHORT[dayEntry.day] ?? dayEntry.dayDisplay ?? dayEntry.day}
                    </td>
                  )}
                  <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">
                    {fromTimeSpan(cls.startTime)} – {fromTimeSpan(cls.endTime)}
                  </td>
                  <td className="px-2 py-1.5 text-gray-900 font-medium">{cls.className}</td>
                  <td className="px-2 py-1.5 text-gray-600">{cls.subjectName}</td>
                </tr>
              ))
            ))}
            {schedule.every(d => !(d.classes?.length)) && (
              <tr><td colSpan={4} className="px-2 py-4 text-center text-gray-400 italic">No classes assigned</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const TimetablePage = () => {
  const { success, error: toastError } = useToast();
  const { operatorId } = useOperator();

  // ── Base data ─────────────────────────────────────────────────────────────
  const [classes,     setClasses]     = useState([]);

  const [timeSlots,   setTimeSlots]   = useState([]);
  const [baseLoading, setBaseLoading] = useState(true);

  // ── Selected class state ──────────────────────────────────────────────────
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classSubjects,   setClassSubjects]   = useState([]);
  const [entries,         setEntries]         = useState([]);       // TimetableDto[]
  const [schedLoading,    setSchedLoading]    = useState(false);

  // ── Teacher assignment modal ──────────────────────────────────────────────
  const [assignModal,          setAssignModal]          = useState(null); // { subjectId, subjectName, timeSlotId, dayOfWeek }
  const [eligibleTeachers,     setEligibleTeachers]     = useState([]);
  const [teacherConflicts,     setTeacherConflicts]     = useState({}); // { teacherId: ConflictCheckDto }
  const [loadingTeachers,      setLoadingTeachers]      = useState(false);
  const [assigningTeacherId,   setAssigningTeacherId]   = useState(null);

  // ── Teacher schedule modal ────────────────────────────────────────────────
  const [scheduleModal,  setScheduleModal]  = useState(null); // { teacherId, teacherName }
  const [teacherSched,   setTeacherSched]   = useState([]);
  const [loadingSched,   setLoadingSched]   = useState(false);

  // ── Entry detail / edit ───────────────────────────────────────────────────
  const [detailEntry,  setDetailEntry]  = useState(null);    // TimetableDto clicked
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Fetch base data ───────────────────────────────────────────────────────
  const fetchBase = useCallback(async () => {
    if (!operatorId) { setBaseLoading(false); return; }
    setBaseLoading(true);
    const [clsRes, tsRes] = await Promise.allSettled([
      getClassesByOperator(operatorId),
      getTimeSlots(),
    ]);
    if (clsRes.status === 'fulfilled') setClasses(Array.isArray(clsRes.value) ? clsRes.value.filter(r => !r.isDeleted) : []);
    if (tsRes.status  === 'fulfilled') setTimeSlots(Array.isArray(tsRes.value)  ? tsRes.value.filter(r => !r.isDeleted)  : []);
    setBaseLoading(false);
  }, [operatorId]);

  useEffect(() => { fetchBase(); }, [fetchBase]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);

  const sortedTimeSlots = useMemo(
    () => [...timeSlots].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')),
    [timeSlots],
  );

  // Stable ordered list of subject IDs for consistent color assignment
  const subjectIds = useMemo(() => {
    const fromEntries = entries.map(e => e.subjectId);
    const fromSubs    = classSubjects.map(s => s.subjectId ?? s.id);
    return [...new Set([...fromSubs, ...fromEntries])];
  }, [entries, classSubjects]);

  // Count how many times each subject appears in the timetable
  const subjectCountMap = useMemo(() => {
    const map = {};
    entries.forEach(e => { map[e.subjectId] = (map[e.subjectId] || 0) + 1; });
    return map;
  }, [entries]);

  // Build lookup: (timeSlotId, day) → TimetableDto[]
  const entryMap = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const key = `${e.timeSlotId}__${e.dayOfWeek}`;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [entries]);

  const getEntries = (timeSlotId, day) => entryMap[`${timeSlotId}__${day}`] ?? [];

  // ── Fetch class data when selection changes ───────────────────────────────
  const fetchClassData = useCallback(async (classId) => {
    if (!classId) { setEntries([]); setClassSubjects([]); return; }
    setSchedLoading(true);
    try {
      // Fetch timetable entries + enrolled subjects for the class in parallel
      const [ttRes, subRes] = await Promise.allSettled([
        getTimetablesByClass(classId),
        getSubjectsByClass(classId),
      ]);

      // Timetable entries
      const ttData = ttRes.status === 'fulfilled' ? ttRes.value : [];
      setEntries(Array.isArray(ttData) ? ttData.filter(r => !r.isDeleted) : []);

      // Subjects enrolled in this class
      const subData = subRes.status === 'fulfilled' ? subRes.value : [];
      console.log('getSubjectsByClass response:', subData);
      const subjects = (Array.isArray(subData) ? subData : []).map(s => ({
        subjectId:   s.id ?? s.subjectId,
        subjectName: s.name ?? s.subjectName,
        creditValue: s.creditValue,
      }));
      console.log('Mapped classSubjects:', subjects);
      setClassSubjects(subjects);
    } catch (e) {
      toastError(parseApiError(e));
      setEntries([]);
      setClassSubjects([]);
    } finally {
      setSchedLoading(false);
    }
  }, [toastError]);

  useEffect(() => { fetchClassData(selectedClassId); }, [selectedClassId, fetchClassData]);

  // ── Handle subject drop on cell ───────────────────────────────────────────
  const handleSubjectDrop = (subjectData, slot, day) => {
    if (!selectedClassId || !selectedClass) return;
    const existing = getEntries(slot.id, day);
    // Open teacher assignment modal — default to optional when slot already has entries
    setAssignModal({
      subjectId:   subjectData.subjectId,
      subjectName: subjectData.subjectName,
      timeSlotId:  slot.id,
      timeSlotName: slot.name,
      dayOfWeek:   day,
      startTime:   slot.startTime,
      endTime:     slot.endTime,
      isOptional:  existing.length > 0,
    });
  };

  // ── Fetch eligible teachers when assign modal opens ───────────────────────
  useEffect(() => {
    if (!assignModal || !selectedClass) return;

    const fetchTeachers = async () => {
      setLoadingTeachers(true);
      setEligibleTeachers([]);
      setTeacherConflicts({});

      try {
        const sectionId = selectedClass.sectionId;
        const res = await getSectionSubjectTeachers(sectionId, assignModal.subjectId);
        const teachers = res?.teachers ?? [];
        setEligibleTeachers(teachers);

        // Check conflicts for each teacher in parallel
        if (teachers.length > 0) {
          const conflictChecks = await Promise.allSettled(
            teachers.map(t =>
              checkTimetableConflicts({
                classId:    selectedClassId,
                subjectId:  assignModal.subjectId,
                teacherId:  t.teacherId,
                timeSlotId: assignModal.timeSlotId,
                dayOfWeek:  assignModal.dayOfWeek,
                isOptional: assignModal.isOptional ?? false,
              }).then(result => ({ teacherId: t.teacherId, result }))
            ),
          );

          const conflicts = {};
          conflictChecks.forEach(r => {
            if (r.status === 'fulfilled') {
              conflicts[r.value.teacherId] = r.value.result;
            }
          });
          setTeacherConflicts(conflicts);
        }
      } catch (e) {
        console.error('[fetchTeachers/conflictCheck] Error:', e?.response?.data ?? e);
        toastError(parseApiError(e));
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, [assignModal, selectedClass, selectedClassId, toastError]);

  // ── Assign teacher ────────────────────────────────────────────────────────
  const handleAssignTeacher = async (teacher) => {
    if (!assignModal || !selectedClassId) return;
    setAssigningTeacherId(teacher.teacherId);
    try {
      await createTimetable({
        classId:    selectedClassId,
        subjectId:  assignModal.subjectId,
        teacherId:  teacher.teacherId,
        timeSlotId: assignModal.timeSlotId,
        dayOfWeek:  assignModal.dayOfWeek,
        isOptional: assignModal.isOptional ?? false,
      });
      success('Timetable entry created');
      setAssignModal(null);
      fetchClassData(selectedClassId);
    } catch (e) {
      console.error('[handleAssignTeacher] Error creating timetable entry:', e?.response?.data ?? e);
      toastError(parseApiError(e));
    } finally {
      setAssigningTeacherId(null);
    }
  };

  // ── View teacher schedule ─────────────────────────────────────────────────
  const handleViewTeacherSchedule = async (teacher) => {
    setScheduleModal({
      teacherId:   teacher.teacherId,
      teacherName: teacher.teacherName ?? teacher.teacherUsername ?? 'Teacher',
    });
    setLoadingSched(true);
    try {
      const data = await getTeacherWeeklySchedule(teacher.teacherId);
      setTeacherSched(Array.isArray(data) ? data : []);
    } catch (e) {
      toastError(parseApiError(e));
      setTeacherSched([]);
    } finally {
      setLoadingSched(false);
    }
  };

  // ── Click existing entry → detail / edit panel ────────────────────────────
  const handleEntryClick = (entry) => {
    setDetailEntry(entry);
  };

  // ── Change teacher on existing entry ──────────────────────────────────────
  const handleChangeTeacher = () => {
    if (!detailEntry) return;
    // Close detail, open assignment modal for this entry's slot
    setAssignModal({
      subjectId:    detailEntry.subjectId,
      subjectName:  detailEntry.subjectName,
      timeSlotId:   detailEntry.timeSlotId,
      timeSlotName: detailEntry.timeSlotName,
      dayOfWeek:    detailEntry.dayOfWeek,
      startTime:    detailEntry.startTime,
      endTime:      detailEntry.endTime,
      isOptional:   detailEntry.isOptional ?? false,
      replacingEntryId: detailEntry.id, // flag: we're replacing, not creating new
    });
    setDetailEntry(null);
  };

  // ── Assign teacher (replacement mode) ─────────────────────────────────────
  const handleAssignTeacherForReplace = async (teacher) => {
    if (!assignModal?.replacingEntryId || !selectedClassId) {
      // Normal create mode
      return handleAssignTeacher(teacher);
    }
    setAssigningTeacherId(teacher.teacherId);
    try {
      await updateTimetable(assignModal.replacingEntryId, {
        teacherId: teacher.teacherId,
      });
      success('Teacher updated');
      setAssignModal(null);
      fetchClassData(selectedClassId);
    } catch (e) {
      console.error('[handleAssignTeacherForReplace] Error updating teacher:', e?.response?.data ?? e);
      toastError(parseApiError(e));
    } finally {
      setAssigningTeacherId(null);
    }
  };

  // ── Delete entry ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTimetable(deleteTarget.id);
      success('Timetable entry removed');
      setDeleteTarget(null);
      setDetailEntry(null);
      fetchClassData(selectedClassId);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (baseLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        subtitle="Build and view weekly class timetables with drag-and-drop"
      />

      {/* Class selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
        <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full sm:w-96 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
          <option value="">— Choose a class —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.sectionName ? ` · ${c.sectionName}` : ''}{c.academicYear ? ` (${c.academicYear})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* No class selected placeholder */}
      {!selectedClassId && (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
          Select a class above to view and build its timetable.
        </div>
      )}

      {/* Main content when class is selected */}
      {selectedClassId && (
        schedLoading ? (
          <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>
        ) : (
          <div className="flex gap-4 items-start">
            {/* ── Subject Panel (left sidebar) ────────────────────────────── */}
            <div className="w-56 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 sticky top-4">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">Subjects</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Drag onto the timetable</p>
                </div>
                <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto">
                  {classSubjects.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">
                      No subjects found. Enroll subjects first.
                    </p>
                  ) : (
                    classSubjects.map((s) => {
                      const sid = s.subjectId ?? s.id;
                      const color = getSubjectColor(sid, subjectIds);
                      return (
                        <SubjectPill
                          key={sid}
                          subject={s}
                          color={color}
                          count={subjectCountMap[sid] || 0}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ── Timetable Grid (main area) ──────────────────────────────── */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 border-r border-gray-200">
                          Time
                        </th>
                        {DAYS.map((d) => (
                          <th key={d} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200 last:border-r-0">
                            {DAY_SHORT[d]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTimeSlots.map((slot) => {
                        const fixed = isUnchangeable(slot.id);
                        const blockLabel = BLOCK_SLOT_LABELS[(slot.id ?? '').toLowerCase()];
                        return (
                          <tr key={slot.id} className={fixed ? 'bg-gray-50' : ''}>
                            {/* Time slot label */}
                            <td className={`px-3 py-2 text-xs border border-gray-200 whitespace-nowrap align-middle ${fixed ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-600 font-medium'}`}>
                              <div>{fromTimeSpan(slot.startTime)} – {fromTimeSpan(slot.endTime)}</div>
                            </td>
                            {/* Merged cell for fixed break/activity slots */}
                            {blockLabel ? (
                              <td
                                colSpan={DAYS.length}
                                className="border border-gray-200 bg-gray-100 px-4 py-2 text-center"
                              >
                                <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                  <span className="block w-8 h-px bg-gray-300" />
                                  {blockLabel}
                                  <span className="block w-8 h-px bg-gray-300" />
                                </span>
                              </td>
                            ) : (
                              /* Normal day cells */
                              DAYS.map((day) => (
                                <TimetableCell
                                  key={day}
                                  entries={getEntries(slot.id, day)}
                                  slot={slot}
                                  day={day}
                                  isFixed={fixed}
                                  onDrop={handleSubjectDrop}
                                  onClick={handleEntryClick}
                                  subjectIds={subjectIds}
                                />
                              ))
                            )}
                          </tr>
                        );
                      })}
                      {sortedTimeSlots.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-sm text-gray-400">
                            No time slots configured. Create time slots first.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {entries.length === 0 && sortedTimeSlots.length > 0 && (
                  <div className="text-center py-4 text-xs text-gray-400 border-t border-gray-100">
                    Drag subjects from the left panel into empty cells to build the timetable.
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* ── Teacher Assignment Modal ──────────────────────────────────────── */}
      <Modal
        open={!!assignModal}
        onClose={() => setAssignModal(null)}
        title={
          assignModal
            ? `Assign Teacher — ${assignModal.subjectName}`
            : 'Assign Teacher'
        }
        size="lg"
      >
        {assignModal && (
          <div className="space-y-4">
            {/* Context info */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <span><strong>Day:</strong> {DAY_LABELS[assignModal.dayOfWeek]}</span>
              <span><strong>Slot:</strong> {assignModal.timeSlotName} ({fromTimeSpan(assignModal.startTime)} – {fromTimeSpan(assignModal.endTime)})</span>
              <span><strong>Subject:</strong> {assignModal.subjectName}</span>
              {assignModal.replacingEntryId && (
                <span className="text-amber-600 font-medium">Changing teacher</span>
              )}
            </div>

            {/* Optional subject toggle */}
            {!assignModal.replacingEntryId && (
              <label className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={assignModal.isOptional ?? false}
                  onChange={() => setAssignModal(prev => prev ? { ...prev, isOptional: !prev.isOptional } : null)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <div>
                  <span className="text-sm font-medium text-amber-800">Optional subject</span>
                  <p className="text-xs text-amber-600">Optional subjects can share a time slot with other optional subjects</p>
                </div>
              </label>
            )}

            {/* Teachers list */}
            {loadingTeachers ? (
              <div className="flex items-center justify-center py-8"><LoadingSpinner /></div>
            ) : eligibleTeachers.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                <p>No eligible teachers found for this subject & section.</p>
                <p className="text-xs mt-1">Assign teachers to this subject in the Teacher Assignments page first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {eligibleTeachers.length} eligible teacher{eligibleTeachers.length !== 1 ? 's' : ''}
                </p>
                {/* Available teachers first, then unavailable */}
                {[...eligibleTeachers]
                  .sort((a, b) => {
                    const aConflict = teacherConflicts[a.teacherId]?.hasConflict ? 1 : 0;
                    const bConflict = teacherConflicts[b.teacherId]?.hasConflict ? 1 : 0;
                    return aConflict - bConflict;
                  })
                  .map((t) => (
                    <TeacherRow
                      key={t.teacherId}
                      teacher={t}
                      conflict={teacherConflicts[t.teacherId]}
                      onAssign={assignModal.replacingEntryId ? handleAssignTeacherForReplace : handleAssignTeacher}
                      assigning={assigningTeacherId === t.teacherId}
                      onViewSchedule={handleViewTeacherSchedule}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Teacher Weekly Schedule Modal ─────────────────────────────────── */}
      <Modal
        open={!!scheduleModal}
        onClose={() => setScheduleModal(null)}
        title={`Schedule — ${scheduleModal?.teacherName ?? 'Teacher'}`}
        size="xl"
      >
        {loadingSched ? (
          <div className="flex items-center justify-center py-8"><LoadingSpinner /></div>
        ) : (
          <TeacherScheduleView
            schedule={teacherSched}
            teacherName={scheduleModal?.teacherName ?? 'Teacher'}
          />
        )}
      </Modal>

      {/* ── Entry Detail Modal ───────────────────────────────────────────── */}
      <Modal
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        title="Timetable Entry"
        size="md"
        footer={
          <div className="flex justify-between w-full">
            <button
              onClick={() => { setDeleteTarget(detailEntry); setDetailEntry(null); }}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium transition"
            >
              Delete Entry
            </button>
            <div className="flex gap-3">
              <button onClick={() => setDetailEntry(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition">
                Close
              </button>
              <button
                onClick={handleChangeTeacher}
                className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition"
              >
                Change Teacher
              </button>
            </div>
          </div>
        }
      >
        {detailEntry && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Subject</p>
                <p className="text-gray-900 font-semibold">{detailEntry.subjectName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Teacher</p>
                <p className="text-gray-900 font-semibold">{detailEntry.teacherName ?? detailEntry.teacherUsername ?? '—'}</p>
                {detailEntry.teacherIdNumber && <p className="text-xs text-gray-500">{detailEntry.teacherIdNumber}</p>}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Day</p>
                <p className="text-gray-900">{DAY_LABELS[detailEntry.dayOfWeek] ?? detailEntry.dayOfWeek}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Time</p>
                <p className="text-gray-900">
                  {detailEntry.timeSlotName} ({fromTimeSpan(detailEntry.startTime)} – {fromTimeSpan(detailEntry.endTime)})
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Class</p>
                <p className="text-gray-900">{detailEntry.className}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Section</p>
                <p className="text-gray-900">{detailEntry.sectionName ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Type</p>
                <p className={`font-medium ${detailEntry.isOptional ? 'text-amber-600' : 'text-gray-900'}`}>
                  {detailEntry.isOptional ? 'Optional' : 'Mandatory'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Timetable Entry"
        message={`Remove "${deleteTarget?.subjectName ?? 'this entry'}" on ${DAY_LABELS[deleteTarget?.dayOfWeek] ?? deleteTarget?.dayOfWeek ?? ''} (${deleteTarget?.timeSlotName ?? ''}) from the timetable?`}
      />
    </div>
  );
};

export default TimetablePage;
