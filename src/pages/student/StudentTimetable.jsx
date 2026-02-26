import { useCallback, useEffect, useState } from 'react';
import { useStudent } from '../../context/StudentContext';
import { getStudentWeeklySchedule } from '../../services/timetableService';
import { PageHeader, LoadingSpinner } from '../../components/common';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_SHORT = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri' };

// ── Colour palette for subject entries ────────────────────────────────────────
const COLORS = [
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-teal-50 border-teal-200 text-teal-800',
  'bg-cyan-50 border-cyan-200 text-cyan-800',
  'bg-sky-50 border-sky-200 text-sky-800',
  'bg-green-50 border-green-200 text-green-800',
  'bg-lime-50 border-lime-200 text-lime-800',
  'bg-amber-50 border-amber-200 text-amber-800',
  'bg-violet-50 border-violet-200 text-violet-800',
];

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

  // Build day -> entries lookup
  const dayMap = {};
  DAYS.forEach(d => { dayMap[d] = []; });
  if (schedule?.weekSchedule) {
    DAYS.forEach(d => {
      const entries = schedule.weekSchedule[d] ?? [];
      dayMap[d] = [...entries].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });
  }

  // Collect unique subjects for color mapping
  const subjects = [...new Set(Object.values(dayMap).flat().map(e => e.subjectName).filter(Boolean))];
  const subjectColorMap = {};
  subjects.forEach((s, i) => { subjectColorMap[s] = COLORS[i % COLORS.length]; });

  const hasAnyEntries = Object.values(dayMap).some(e => e.length > 0);

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

      {loading ? (
        <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
      ) : !selectedClassId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-400">Select a class to view its timetable.</p>
        </div>
      ) : !hasAnyEntries ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-400">No timetable entries found for this class.</p>
        </div>
      ) : (
        <>
          {/* ── Desktop grid view ────────────────────────────────── */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-5 divide-x divide-gray-200">
              {DAYS.map(day => (
                <div key={day} className="min-w-0">
                  {/* Day header */}
                  <div className="bg-emerald-600 text-white text-center py-3 text-sm font-semibold tracking-wide">
                    {DAY_SHORT[day]}
                  </div>
                  {/* Entries */}
                  <div className="p-2 space-y-2 min-h-[200px]">
                    {dayMap[day].length === 0 ? (
                      <p className="text-xs text-gray-300 text-center mt-8">No classes</p>
                    ) : (
                      dayMap[day].map((entry, idx) => (
                        <div key={entry.timetableId ?? idx}
                          className={`rounded-lg border p-2.5 ${subjectColorMap[entry.subjectName] ?? COLORS[0]}`}>
                          <p className="text-xs font-semibold truncate">{entry.subjectName ?? '—'}</p>
                          <p className="text-[11px] opacity-70 truncate">{entry.teacherName ?? '—'}</p>
                          <p className="text-[11px] opacity-60 mt-1">
                            {entry.startTime ?? ''} – {entry.endTime ?? ''}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mobile stacked view ──────────────────────────────── */}
          <div className="lg:hidden space-y-4">
            {DAYS.map(day => (
              <div key={day} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold">
                  {DAY_SHORT[day]}
                </div>
                <div className="p-3 space-y-2">
                  {dayMap[day].length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-4">No classes</p>
                  ) : (
                    dayMap[day].map((entry, idx) => (
                      <div key={entry.timetableId ?? idx}
                        className={`rounded-lg border p-3 flex items-center gap-3 ${subjectColorMap[entry.subjectName] ?? COLORS[0]}`}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{entry.subjectName ?? '—'}</p>
                          <p className="text-xs opacity-70 truncate">{entry.teacherName ?? '—'}</p>
                        </div>
                        <span className="text-xs opacity-60 flex-shrink-0 whitespace-nowrap">
                          {entry.startTime ?? ''} – {entry.endTime ?? ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Legend */}
      {subjects.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Subjects Legend</h4>
          <div className="flex flex-wrap gap-2">
            {subjects.map(s => (
              <span key={s} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${subjectColorMap[s]}`}>
                {s}
              </span>
            ))}
          </div>
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
