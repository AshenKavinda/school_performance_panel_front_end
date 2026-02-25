import { useCallback, useEffect, useState } from 'react';
import { useStudent } from '../../context/StudentContext';
import { getStudentCurriculum } from '../../services/enrollmentService';
import { PageHeader, LoadingSpinner } from '../../components/common';

const CLASS_TYPE_LABELS = {
  SUBJECT_BASE: 'Subject Based',
  MODULE_BASE:  'Module Based',
};

const ClassCard = ({ cls, studentId }) => {
  const [expanded, setExpanded]     = useState(false);
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading]       = useState(false);

  const fetchCurriculum = useCallback(async () => {
    if (curriculum || !studentId) return;
    setLoading(true);
    try {
      const data = await getStudentCurriculum(cls.classId, studentId);
      setCurriculum(data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [cls.classId, studentId, curriculum]);

  const handleToggle = () => {
    if (!expanded) fetchCurriculum();
    setExpanded(e => !e);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition text-left"
      >
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-gray-800">{cls.className}</h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">{cls.sectionName}</span>
            {cls.academicYear && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">{cls.academicYear}</span>
              </>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              cls.classType === 'MODULE_BASE'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {CLASS_TYPE_LABELS[cls.classType] || cls.classType}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400">{cls.enrolledSubjects?.length ?? 0} subjects</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-4"><LoadingSpinner /></div>
          ) : (
            <>
              {/* Enrolled Subjects */}
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Enrolled Subjects</h5>
              {cls.enrolledSubjects?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {cls.enrolledSubjects.map(sub => (
                    <div key={sub.subjectId}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-gray-100">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800 font-medium">{sub.subjectName}</span>
                      <span className="ml-auto text-xs text-gray-400">{sub.creditValue}cr</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic mb-4">No subjects enrolled yet.</p>
              )}

              {/* Curriculum details if available */}
              {curriculum?.subjects && curriculum.subjects.length > 0 && cls.classType === 'MODULE_BASE' && (
                <>
                  <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Modules</h5>
                  {curriculum.subjects.map(sub => (
                    <div key={sub.subjectId} className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">{sub.subjectName}</p>
                      {sub.modules?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-3">
                          {sub.modules.map(mod => (
                            <div key={mod.moduleId}
                              className="flex items-center gap-2 p-2 rounded-lg bg-white border border-purple-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                              <span className="text-xs text-gray-700">{mod.moduleName}</span>
                              <span className="ml-auto text-[10px] text-purple-500">{mod.moduleWeight}%</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic ml-3">No modules</p>
                      )}
                    </div>
                  ))}
                </>
              )}

              <p className="text-[10px] text-gray-400 mt-2">
                Enrolled: {cls.enrolledSubjects?.[0]?.enrolledAt ? new Date(cls.enrolledSubjects[0].enrolledAt).toLocaleDateString() : '—'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const StudentEnrollments = () => {
  const { studentId, enrollment, loading: ctxLoading } = useStudent();

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  const classes = enrollment?.enrolledClasses ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Enrollments"
        subtitle={`You are enrolled in ${classes.length} class${classes.length !== 1 ? 'es' : ''}`}
      />

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-gray-500">You are not enrolled in any classes yet.</p>
          <p className="text-xs text-gray-400 mt-1">Contact your school operator to get enrolled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map(cls => (
            <ClassCard key={cls.classId} cls={cls} studentId={studentId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentEnrollments;
