import { useCallback, useEffect, useState } from 'react';
import {
  getClassesByOperator, getSubjectsByOperator, getTeachersByOperator,
} from '../../services/managementService';
import { useOperator } from '../../context/OperatorContext';
import {
  getTimeSlots,
  getClassWeeklySchedule, createTimetable, deleteTimetable,
} from '../../services/timetableService';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import { PageHeader, LoadingSpinner, ConfirmDialog, Modal } from '../../components/common';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_SHORT = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri' };

// ── Helpers ───────────────────────────────────────────────────────────────────
const fromTimeSpan = (t) => {
  if (!t) return '';
  const parts = t.split(':');
  return parts.length >= 2 ? `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}` : t;
};

// ── Add entry form — MODULE LEVEL ─────────────────────────────────────────────
const AddEntryFormFields = ({ form, errors, onChange, subjects, teachers, timeSlots }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week <span className="text-red-500">*</span></label>
      <select name="dayOfWeek" value={form.dayOfWeek} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.dayOfWeek ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select day…</option>
        {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
      </select>
      {errors.dayOfWeek && <p className="mt-1 text-xs text-red-500">{errors.dayOfWeek}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot <span className="text-red-500">*</span></label>
      <select name="timeSlotId" value={form.timeSlotId} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.timeSlotId ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select time slot…</option>
        {timeSlots.map((ts) => (
          <option key={ts.id} value={ts.id}>
            {ts.name} ({fromTimeSpan(ts.startTime)} – {fromTimeSpan(ts.endTime)})
          </option>
        ))}
      </select>
      {errors.timeSlotId && <p className="mt-1 text-xs text-red-500">{errors.timeSlotId}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
      <select name="subjectId" value={form.subjectId} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.subjectId ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select subject…</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {errors.subjectId && <p className="mt-1 text-xs text-red-500">{errors.subjectId}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Teacher <span className="text-red-500">*</span></label>
      <select name="teacherId" value={form.teacherId} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.teacherId ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select teacher…</option>
        {teachers.map((t) => <option key={t.id} value={t.id}>{t.username}{t.teacherId ? ` (${t.teacherId})` : ''}</option>)}
      </select>
      {errors.teacherId && <p className="mt-1 text-xs text-red-500">{errors.teacherId}</p>}
    </div>
  </div>
);

const EMPTY_FORM = { dayOfWeek: '', timeSlotId: '', subjectId: '', teacherId: '' };

// ── Main component ────────────────────────────────────────────────────────────
const TimetablePage = () => {
  const { success, error: toastError } = useToast();

  const [classes,   setClasses]   = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [baseLoading, setBaseLoading] = useState(true);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [schedule,        setSchedule]        = useState([]);
  const [schedLoading,    setSchedLoading]     = useState(false);

  const [addOpen,   setAddOpen]   = useState(false);
  const [addForm,   setAddForm]   = useState(EMPTY_FORM);
  const [addErrors, setAddErrors] = useState({});
  const [adding,    setAdding]    = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Base data ─────────────────────────────────────────────────────────────
  const { operatorId } = useOperator();

  const fetchBase = useCallback(async () => {
    if (!operatorId) { setBaseLoading(false); return; }
    setBaseLoading(true);
    const [clsRes, subRes, tchRes, tsRes] = await Promise.allSettled([
      getClassesByOperator(operatorId), getSubjectsByOperator(operatorId), getTeachersByOperator(operatorId), getTimeSlots(),
    ]);
    if (clsRes.status === 'fulfilled') setClasses(Array.isArray(clsRes.value) ? clsRes.value.filter(r => !r.isDeleted) : []);
    if (subRes.status === 'fulfilled') setSubjects(Array.isArray(subRes.value) ? subRes.value.filter(r => !r.isDeleted) : []);
    if (tchRes.status === 'fulfilled') setTeachers(Array.isArray(tchRes.value) ? tchRes.value.filter(r => !r.isDeleted) : []);
    if (tsRes.status  === 'fulfilled') setTimeSlots(Array.isArray(tsRes.value)  ? tsRes.value.filter(r => !r.isDeleted)  : []);
    setBaseLoading(false);
  }, [operatorId]);

  useEffect(() => { fetchBase(); }, [fetchBase]);

  // ── Schedule fetch ────────────────────────────────────────────────────────
  const fetchSchedule = useCallback(async (cId) => {
    if (!cId) { setSchedule([]); return; }
    setSchedLoading(true);
    try {
      const data = await getClassWeeklySchedule(cId);
      setSchedule(Array.isArray(data) ? data : []);
    } catch (e) {
      toastError(parseApiError(e));
      setSchedule([]);
    } finally {
      setSchedLoading(false);
    }
  }, [toastError]);

  useEffect(() => { fetchSchedule(selectedClassId); }, [selectedClassId, fetchSchedule]);

  const setField = (setter) => (e) => {
    const { name, value } = e.target;
    setter((f) => ({ ...f, [name]: value }));
  };

  // ── Add entry ─────────────────────────────────────────────────────────────
  const openAdd  = () => { setAddForm(EMPTY_FORM); setAddErrors({}); setAddOpen(true); };
  const closeAdd = () => setAddOpen(false);

  const validateAdd = (f) => {
    const errs = {};
    if (!f.dayOfWeek)   errs.dayOfWeek  = 'Please select a day';
    if (!f.timeSlotId)  errs.timeSlotId = 'Please select a time slot';
    if (!f.subjectId)   errs.subjectId  = 'Please select a subject';
    if (!f.teacherId)   errs.teacherId  = 'Please select a teacher';
    return errs;
  };

  const handleAdd = async () => {
    const errs = validateAdd(addForm);
    if (Object.keys(errs).length) { setAddErrors(errs); return; }
    setAdding(true);
    try {
      await createTimetable({
        classId:    selectedClassId,
        subjectId:  addForm.subjectId,
        teacherId:  addForm.teacherId,
        timeSlotId: addForm.timeSlotId,
        dayOfWeek:  addForm.dayOfWeek,
      });
      success('Timetable entry added');
      closeAdd();
      fetchSchedule(selectedClassId);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setAdding(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTimetable(deleteTarget.id);
      success('Timetable entry removed');
      setDeleteTarget(null);
      fetchSchedule(selectedClassId);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  // ── Build weekly grid data ────────────────────────────────────────────────
  // Group schedule entries by day
  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = schedule.filter(e => e.dayOfWeek === d)
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
    return acc;
  }, {});

  if (baseLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        subtitle="Build and view weekly class timetables"
        action={
          selectedClassId ? (
            <button onClick={openAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Entry
            </button>
          ) : null
        }
      />

      {/* Class selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
        <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
          <option value="">— Choose a class —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.academicYear ? ` (${c.academicYear})` : ''}</option>
          ))}
        </select>
      </div>

      {/* Weekly grid */}
      {selectedClassId && (
        schedLoading ? (
          <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {DAYS.map((d) => (
                      <th key={d} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {DAY_SHORT[d]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="align-top">
                    {DAYS.map((d) => (
                      <td key={d} className="px-3 py-3 border-r border-gray-100 last:border-r-0 min-w-[160px]">
                        {byDay[d].length === 0 ? (
                          <p className="text-xs text-gray-300 italic text-center py-4">—</p>
                        ) : (
                          <div className="space-y-2">
                            {byDay[d].map((entry) => (
                              <div key={entry.id} className="bg-teal-50 border border-teal-200 rounded-lg p-2 group relative">
                                <p className="text-xs font-semibold text-teal-800 leading-tight truncate">{entry.subjectName ?? 'Subject'}</p>
                                <p className="text-xs text-teal-600 mt-0.5 truncate">{entry.teacherUsername ?? 'Teacher'}</p>
                                <p className="text-xs text-teal-500 mt-0.5">
                                  {fromTimeSpan(entry.startTime)} – {fromTimeSpan(entry.endTime)}
                                </p>
                                <button
                                  onClick={() => setDeleteTarget(entry)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition"
                                  title="Remove"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {schedule.length === 0 && (
              <div className="text-center py-10 text-sm text-gray-400 border-t border-gray-100">
                No timetable entries yet. Click "Add Entry" to get started.
              </div>
            )}
          </div>
        )
      )}

      {!selectedClassId && (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
          Select a class above to view and build its timetable.
        </div>
      )}

      {/* Add entry modal */}
      <Modal isOpen={addOpen} onClose={closeAdd} title="Add Timetable Entry"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeAdd} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition">Cancel</button>
            <button onClick={handleAdd} disabled={adding}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {adding ? 'Adding…' : 'Add Entry'}
            </button>
          </div>
        }
      >
        <AddEntryFormFields
          form={addForm} errors={addErrors} onChange={setField(setAddForm)}
          subjects={subjects} teachers={teachers} timeSlots={timeSlots}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Timetable Entry"
        message={`Remove ${deleteTarget?.subjectName ?? 'this entry'} on ${deleteTarget?.dayOfWeek ?? ''} from the timetable?`}
      />
    </div>
  );
};

export default TimetablePage;
