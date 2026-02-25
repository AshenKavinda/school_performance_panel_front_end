import { useCallback, useEffect, useState } from 'react';
import { useStudent } from '../../context/StudentContext';
import { getStudentWeeklySchedule } from '../../services/timetableService';
import { PageHeader, LoadingSpinner } from '../../components/common';

const DAYS = [
  { key: 'MONDAY',    label: 'Monday' },
  { key: 'TUESDAY',   label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY',  label: 'Thursday' },
  { key: 'FRIDAY',    label: 'Friday' },
];

const DAY_COLORS = {
  MONDAY:    'bg-emerald-50 border-emerald-100',
  TUESDAY:   'bg-teal-50 border-teal-100',
  WEDNESDAY: 'bg-cyan-50 border-cyan-100',
  THURSDAY:  'bg-sky-50 border-sky-100',
  FRIDAY:    'bg-green-50 border-green-100',
};

const SLOT_COLORS = {
  MONDAY:    'bg-emerald-200 text-emerald-700',
  TUESDAY:   'bg-teal-200 text-teal-700',
  WEDNESDAY: 'bg-cyan-200 text-cyan-700',
  THURSDAY:  'bg-sky-200 text-sky-700',
  FRIDAY:    'bg-green-200 text-green-700',
};

const StudentTimetable = () => {
  const { studentId, enrollment, loading: ctxLoading } = useStudent();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [schedule, setSchedule]               = useState(null);
  const [loading, setLoading]                 = useState(false);

  const classes = enrollment?.enrolledClasses ?? [];

  // Auto-select first class
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].classId);
    }
  }, [classes, selectedClassId]);

  const fetchSchedule = useCallback(async () => {
    if (!studentId || !selectedClassId) { setSchedule(null); return; }
    setLoading(true);
    try {
      const data = await getStudentWeeklySchedule(studentId, selectedClassId);
      setSchedule(data);
    } catch {
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedClassId]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  const selectedClass = classes.find(c => c.classId === selectedClassId);

  // Highlight today
  const jsDay = new Date().getDay();
  const todayKey = jsDay >= 1 && jsDay <= 5 ? DAYS[jsDay - 1].key : null;

  return (
    <div className="space-y-6">
      <PageHeader title="My Timetable" subtitle="Your weekly class schedule" />

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
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              {cls.className}
            </button>
          ))}
        </div>
      )}

      {/* Schedule Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
      ) : schedule?.weekSchedule ? (
        <div className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const entries = schedule.weekSchedule[key] ?? [];
            const isToday = key === todayKey;

            return (
              <div key={key}
                className={`rounded-xl border p-4 ${DAY_COLORS[key]} ${isToday ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">{label}</h4>
                  {isToday && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-medium">Today</span>
                  )}
                  <span className="ml-auto text-xs text-gray-400">
                    {entries.length} class{entries.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                {entries.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-1">No classes</p>
                ) : (
                  <div className="space-y-1.5">
                    {entries.map((entry, i) => (
                      <div key={entry.timetableId ?? i}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-white/80 border border-white">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${SLOT_COLORS[key]}`}>
                          {entry.timeSlotName ?? (i + 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800">{entry.subjectName ?? '—'}</p>
                          <p className="text-xs text-gray-500">{entry.teacherName ?? '—'}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 font-mono">
                          {entry.startTime ?? ''} – {entry.endTime ?? ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : selectedClassId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No timetable available for this class.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500">Select a class to view its timetable.</p>
        </div>
      )}

      {/* Class info footer */}
      {selectedClass && (
        <div className="bg-gray-50 rounded-lg border border-gray-100 p-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span><strong>Section:</strong> {selectedClass.sectionName ?? '—'}</span>
          <span><strong>Year:</strong> {selectedClass.academicYear ?? '—'}</span>
          <span><strong>Type:</strong> {selectedClass.classType === 'MODULE_BASE' ? 'Module Based' : 'Subject Based'}</span>
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;
