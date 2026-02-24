import { useCallback, useEffect, useState } from 'react';
import { getTeacherAssignments, getSubjectStudents } from '../../services/enrollmentService';
import { getClassesBySection } from '../../services/managementService';
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
  const [subjectInfo, setSubjectInfo] = useState(null);

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

  // Fetch students when section and subject are selected
  const fetchStudents = useCallback(async (subjectId, sectionId) => {
    if (!subjectId || !sectionId) { setStudents([]); setSubjectInfo(null); return; }
    setLoadingStudents(true);
    try {
      const data = await getSubjectStudents(subjectId, sectionId);
      setStudents(Array.isArray(data?.students) ? data.students : []);
      setSubjectInfo({
        subjectName: data?.subjectName,
        sectionName: data?.sectionName,
        creditValue: data?.creditValue,
      });
    } catch (e) {
      if (e?.response?.status === 404) {
        setStudents([]);
        setSubjectInfo(null);
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
    setSubjectInfo(null);
  };

  const handleClassChange = (e) => {
    const val = e.target.value;
    setSelectedClass(val);
    setSelectedSubject('');
    setStudents([]);
    setSubjectInfo(null);
  };

  const handleSubjectChange = (e) => {
    const val = e.target.value;
    setSelectedSubject(val);
    if (val && selectedSection) {
      fetchStudents(val, selectedSection);
    } else {
      setStudents([]);
      setSubjectInfo(null);
    }
  };

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  // Classes belonging to the selected section
  const currentSectionClasses = selectedSection ? (sectionClasses[selectedSection] ?? []) : [];
  // Selected class info
  const selectedClassObj = currentSectionClasses.find(c => c.id === selectedClass) ?? null;

  const columns = [
    { key: 'idx', header: '#', render: (_, __, i) => <span className="text-xs text-gray-400">{i + 1}</span>, className: 'w-12' },
    { key: 'studentName', header: 'Student Name', render: (_, row) => <span className="font-medium text-gray-800">{row.studentName ?? '—'}</span> },
    { key: 'indexNumber', header: 'Index Number', render: (_, row) => <span className="text-gray-600">{row.indexNumber ?? '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Class Students" subtitle="View students enrolled in your classes" />

      {/* Selection panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        {/* Section selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Section</label>
          {loadingInit ? (
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
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
      {(selectedClassObj || subjectInfo) && (
        <div className="flex flex-wrap gap-2">
          {selectedClassObj && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {selectedClassObj.name} — {selectedClassObj.academicYear ?? ''}
            </span>
          )}
          {selectedClassObj && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              selectedClassObj.classType === 'SUBJECT_BASE'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {selectedClassObj.classType === 'SUBJECT_BASE' ? 'Subject Base' : 'Module Base'}
            </span>
          )}
          {subjectInfo?.subjectName && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
              {subjectInfo.subjectName}
            </span>
          )}
          {subjectInfo?.sectionName && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              {subjectInfo.sectionName}
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
          emptyMessage="No students enrolled for this subject in the selected section."
          rowKey={(row) => row.studentId}
        />
      )}
    </div>
  );
};

export default ClassStudents;
