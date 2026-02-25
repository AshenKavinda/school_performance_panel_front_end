import { useCallback, useEffect, useState } from 'react';
import { getTeacherAssignments } from '../../services/enrollmentService';
import { getClassesBySection, getStudentsByClassAndSubject } from '../../services/managementService';
import { useTeacher } from '../../context/TeacherContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import { PageHeader, LoadingSpinner, DataTable } from '../../components/common';

const ClassStudents = () => {
  const { teacherId, loading: ctxLoading } = useTeacher();
  const { error: toastError } = useToast();

  const [sections, setSections]       = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [sectionClasses, setSectionClasses] = useState({});  // { sectionId: ClassDto[] }

  const [selectedSection, setSelectedSection] = useState('');
  const [selectedClass, setSelectedClass]     = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [students, setStudents]       = useState([]);
  const [subjectName, setSubjectName] = useState('');

  const [loadingInit, setLoadingInit]       = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Fetch teacher's assigned sections & subjects + classes per section
  const fetchAssignments = useCallback(async () => {
    if (!teacherId) { setLoadingInit(false); return; }
    setLoadingInit(true);
    try {
      const data = await getTeacherAssignments(teacherId);
      const sectionList = Array.isArray(data?.assignedSections) ? data.assignedSections : [];
      const subjectList = Array.isArray(data?.assignedSubjects) ? data.assignedSubjects : [];
      setSections(sectionList);
      setSubjects(subjectList);

      // Fetch classes for each section
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
      setLoadingInit(false);
    }
  }, [teacherId, toastError]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  // Fetch students by classId + subjectId
  const fetchStudents = useCallback(async (classId, subjectId, subName) => {
    if (!classId || !subjectId) { setStudents([]); setSubjectName(''); return; }
    setLoadingStudents(true);
    try {
      const data = await getStudentsByClassAndSubject(classId, subjectId);
      setStudents(Array.isArray(data) ? data : []);
      setSubjectName(subName ?? '');
    } catch (e) {
      if (e?.response?.status === 404) {
        setStudents([]);
      } else {
        toastError(parseApiError(e));
      }
    } finally {
      setLoadingStudents(false);
    }
  }, [toastError]);

  const handleSectionChange = (e) => {
    const val = e.target.value;
    setSelectedSection(val);
    setSelectedClass('');
    setSelectedSubject('');
    setStudents([]);
    setSubjectName('');
  };

  const handleClassChange = (e) => {
    const val = e.target.value;
    setSelectedClass(val);
    setSelectedSubject('');
    setStudents([]);
    setSubjectName('');
  };

  const handleSubjectChange = (e) => {
    const val = e.target.value;
    setSelectedSubject(val);
    if (val && selectedClass) {
      const subObj = subjects.find(s => s.subjectId === val);
      fetchStudents(selectedClass, val, subObj?.subjectName ?? '');
    } else {
      setStudents([]);
      setSubjectName('');
    }
  };

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  // Classes belonging to the selected section
  const currentSectionClasses = selectedSection ? (sectionClasses[selectedSection] ?? []) : [];
  // Selected class info
  const selectedClassObj = currentSectionClasses.find(c => c.id === selectedClass) ?? null;

  const columns = [
    { key: 'id',          header: '#',             render: (row) => <span className="text-xs text-gray-400">{students.indexOf(row) + 1}</span>, className: 'w-12' },
    { key: 'firstName',   header: 'Student Name',  render: (row) => <span className="font-medium text-gray-800 dark:text-gray-200">{[row.firstName, row.lastName].filter(Boolean).join(' ') || row.studentName || '—'}</span> },
    { key: 'globalStudentCode', header: 'Student Code', render: (row) => <span className="text-gray-600 dark:text-gray-400">{row.globalStudentCode ?? '—'}</span> },
    { key: 'indexNumber', header: 'Index Number',  render: (row) => <span className="text-gray-600 dark:text-gray-400">{row.indexNumber ?? '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Class Students" subtitle="View students enrolled in your classes" />

      {/* Selection panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        {/* Section selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Section</label>
          {loadingInit ? (
            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ) : (
            <select
              value={selectedSection}
              onChange={handleSectionChange}
              className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">— Choose a section —</option>
              {sections.map(sec => (
                <option key={sec.sectionId} value={sec.sectionId}>
                  {sec.sectionName ?? '—'}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Class selector */}
        {selectedSection && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Class</label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">— Choose a class —</option>
              {currentSectionClasses.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name ?? '—'} — {cls.academicYear ?? ''} [{cls.classType === 'SUBJECT_BASE' ? 'Subject Base' : cls.classType === 'MODULE_BASE' ? 'Module Base' : cls.classType ?? ''}]
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Subject selector */}
        {selectedClass && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Subject</label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">— Choose a subject —</option>
              {subjects.map(sub => (
                <option key={sub.subjectId} value={sub.subjectId}>
                  {sub.subjectName ?? '—'} (Credit: {sub.creditValue ?? '—'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Info badges */}
      {(selectedClassObj || subjectName) && (
        <div className="flex flex-wrap gap-2">
          {selectedClassObj && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              {selectedClassObj.name} — {selectedClassObj.academicYear ?? ''}
            </span>
          )}
          {selectedClassObj && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              selectedClassObj.classType === 'SUBJECT_BASE'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
            }`}>
              {selectedClassObj.classType === 'SUBJECT_BASE' ? 'Subject Base' : 'Module Base'}
            </span>
          )}
          {subjectName && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
              {subjectName}
            </span>
          )}
        </div>
      )}

      {/* Student list */}
      {selectedSection && selectedClass && selectedSubject && (
        <DataTable
          columns={columns}
          data={students}
          loading={loadingStudents}
          emptyMessage="No students enrolled for this subject in the selected class."
          rowKey={(row) => row.id ?? row.studentId}
        />
      )}
    </div>
  );
};

export default ClassStudents;
