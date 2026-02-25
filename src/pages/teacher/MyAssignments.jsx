import { useCallback, useEffect, useState } from 'react';
import { getTeacherAssignments } from '../../services/enrollmentService';
import { getClassesBySection } from '../../services/managementService';
import { useTeacher } from '../../context/TeacherContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import { PageHeader, LoadingSpinner } from '../../components/common';

const MyAssignments = () => {
  const { teacherId, loading: ctxLoading } = useTeacher();
  const { error: toastError } = useToast();

  const [assignments, setAssignments] = useState(null);
  const [sectionClasses, setSectionClasses] = useState({});   // { sectionId: ClassDto[] }
  const [loading, setLoading]         = useState(true);

  const fetchAssignments = useCallback(async () => {
    if (!teacherId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getTeacherAssignments(teacherId);
      setAssignments(data);

      // Fetch classes for each assigned section
      const sectionList = Array.isArray(data?.assignedSections) ? data.assignedSections : [];
      const classResults = await Promise.allSettled(
        sectionList.map(sec => getClassesBySection(sec.sectionId))
      );

      const classMap = {};
      sectionList.forEach((sec, idx) => {
        const res = classResults[idx];
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          classMap[sec.sectionId] = res.value.filter(c => !c.isDeleted);
        } else {
          classMap[sec.sectionId] = [];
        }
      });
      setSectionClasses(classMap);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setLoading(false);
    }
  }, [teacherId, toastError]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  if (ctxLoading || loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  const subjects = Array.isArray(assignments?.assignedSubjects) ? assignments.assignedSubjects : [];
  const sections = Array.isArray(assignments?.assignedSections) ? assignments.assignedSections : [];

  return (
    <div className="space-y-6">
      <PageHeader title="My Assignments" subtitle="Sections, classes, and subjects assigned to you" />

      {sections.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-400 text-center">No assignments found.</p>
        </div>
      ) : (
        sections.map(sec => {
          const classList = sectionClasses[sec.sectionId] ?? [];
          return (
            <div key={sec.sectionId} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* ── Section Header ────────────────────────────────────── */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-amber-50/60">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{sec.sectionName ?? '—'}</p>
                  {sec.assignedAt && (
                    <p className="text-xs text-gray-400">
                      Assigned {new Date(sec.assignedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  {classList.length} {classList.length === 1 ? 'class' : 'classes'}
                </span>
              </div>

              {/* ── Classes under this section ───────────────────────── */}
              {classList.length === 0 ? (
                <p className="text-sm text-gray-400 p-5 text-center">No classes in this section.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {classList.map(cls => (
                    <div key={cls.id} className="px-5 py-4">
                      {/* Class row */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{cls.name ?? '—'}</p>
                          <p className="text-xs text-gray-400">{cls.academicYear ?? ''}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          cls.classType === 'SUBJECT_BASE'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        }`}>
                          {cls.classType === 'SUBJECT_BASE' ? 'Subject Base' : cls.classType === 'MODULE_BASE' ? 'Module Base' : cls.classType ?? '—'}
                        </span>
                      </div>

                      {/* Subjects under this class */}
                      {subjects.length === 0 ? (
                        <p className="text-xs text-gray-400 ml-11">No subjects assigned.</p>
                      ) : (
                        <div className="ml-11 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {subjects.map(sub => (
                            <div
                              key={sub.subjectId}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50/70 border border-orange-100"
                            >
                              <div className="w-6 h-6 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {sub.creditValue ?? '—'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-700 truncate">{sub.subjectName ?? '—'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default MyAssignments;
