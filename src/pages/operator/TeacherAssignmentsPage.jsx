import { useCallback, useEffect, useState } from 'react';
import {
  getTeachersByOperator, getSubjectsByOperator, getSectionsByOperator,
} from '../../services/managementService';
import { useOperator } from '../../context/OperatorContext';
import {
  assignTeacherToSubject, removeTeacherFromSubject,
  getTeacherSubjects,
  assignTeacherToSection, removeTeacherFromSection,
  getTeacherSections,
} from '../../services/enrollmentService';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import { PageHeader, LoadingSpinner } from '../../components/common';

// ── Tab component ─────────────────────────────────────────────────────────────
const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
      active ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
);

// ── Main component ────────────────────────────────────────────────────────────
const TeacherAssignmentsPage = () => {
  const { success, error: toastError } = useToast();

  const [tab,      setTab]      = useState('subjects');  // 'subjects' | 'sections'
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [baseLoading, setBaseLoading] = useState(true);

  // Teacher-subject assignment
  const [tchSubjId,       setTchSubjId]       = useState('');
  const [tchSubjList,     setTchSubjList]      = useState([]);
  const [subjListLoading, setSubjListLoading]  = useState(false);
  const [addSubjectId,    setAddSubjectId]     = useState('');
  const [assigning,       setAssigning]        = useState(false);

  // Teacher-section assignment
  const [tchSectId,       setTchSectId]       = useState('');
  const [tchSectList,     setTchSectList]      = useState([]);
  const [sectListLoading, setSectListLoading]  = useState(false);
  const [addSectionId,    setAddSectionId]     = useState('');
  const [assigningSect,   setAssigningSect]    = useState(false);

  // ── Base data ─────────────────────────────────────────────────────────────
  const { operatorId } = useOperator();

  const fetchBase = useCallback(async () => {
    if (!operatorId) { setBaseLoading(false); return; }
    setBaseLoading(true);
    const [tchRes, subRes, secRes] = await Promise.allSettled([
      getTeachersByOperator(operatorId),
      getSubjectsByOperator(operatorId),
      getSectionsByOperator(operatorId),
    ]);
    if (tchRes.status === 'fulfilled') setTeachers(Array.isArray(tchRes.value) ? tchRes.value.filter(r => !r.isDeleted) : []);
    if (subRes.status === 'fulfilled') setSubjects(Array.isArray(subRes.value) ? subRes.value.filter(r => !r.isDeleted) : []);
    if (secRes.status === 'fulfilled') setSections(Array.isArray(secRes.value) ? secRes.value.filter(r => !r.isDeleted) : []);
    setBaseLoading(false);
  }, [operatorId]);

  useEffect(() => { fetchBase(); }, [fetchBase]);

  // ── Teacher subjects ──────────────────────────────────────────────────────
  const fetchTeacherSubjects = useCallback(async (tId) => {
    if (!tId) { setTchSubjList([]); return; }
    setSubjListLoading(true);
    try {
      const data = await getTeacherSubjects(tId);
      setTchSubjList(Array.isArray(data) ? data : []);
    } catch (e) {
      toastError(parseApiError(e));
      setTchSubjList([]);
    } finally {
      setSubjListLoading(false);
    }
  }, [toastError]);

  useEffect(() => { fetchTeacherSubjects(tchSubjId); }, [tchSubjId, fetchTeacherSubjects]);

  const handleAssignSubject = async () => {
    if (!tchSubjId || !addSubjectId) return;
    setAssigning(true);
    try {
      await assignTeacherToSubject({ teacherId: tchSubjId, subjectId: addSubjectId });
      success('Teacher assigned to subject');
      setAddSubjectId('');
      fetchTeacherSubjects(tchSubjId);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveSubject = async (subjectId) => {
    try {
      await removeTeacherFromSubject(tchSubjId, subjectId);
      success('Assignment removed');
      fetchTeacherSubjects(tchSubjId);
    } catch (e) {
      toastError(parseApiError(e));
    }
  };

  // Already-assigned subject IDs
  const assignedSubjIds = new Set(tchSubjList.map(s => String(s.id ?? s.subjectId)));
  const availableSubjects = subjects.filter(s => !assignedSubjIds.has(String(s.id)));

  // ── Teacher sections ──────────────────────────────────────────────────────
  const fetchTeacherSections = useCallback(async (tId) => {
    if (!tId) { setTchSectList([]); return; }
    setSectListLoading(true);
    try {
      const data = await getTeacherSections(tId);
      setTchSectList(Array.isArray(data) ? data : []);
    } catch (e) {
      toastError(parseApiError(e));
      setTchSectList([]);
    } finally {
      setSectListLoading(false);
    }
  }, [toastError]);

  useEffect(() => { fetchTeacherSections(tchSectId); }, [tchSectId, fetchTeacherSections]);

  const handleAssignSection = async () => {
    if (!tchSectId || !addSectionId) return;
    setAssigningSect(true);
    try {
      await assignTeacherToSection({ teacherId: tchSectId, sectionId: addSectionId });
      success('Teacher assigned to section');
      setAddSectionId('');
      fetchTeacherSections(tchSectId);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setAssigningSect(false);
    }
  };

  const handleRemoveSection = async (sectionId) => {
    try {
      await removeTeacherFromSection(tchSectId, sectionId);
      success('Assignment removed');
      fetchTeacherSections(tchSectId);
    } catch (e) {
      toastError(parseApiError(e));
    }
  };

  const assignedSectIds = new Set(tchSectList.map(s => String(s.id ?? s.sectionId)));
  const availableSections = sections.filter(s => !assignedSectIds.has(String(s.id)));

  if (baseLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Assignments"
        subtitle="Assign teachers to subjects and sections"
      />

      {/* Tab switcher */}
      <div className="flex gap-2 bg-white rounded-xl border border-gray-200 p-2 w-fit">
        <Tab label="Subject Assignments" active={tab === 'subjects'} onClick={() => setTab('subjects')} />
        <Tab label="Section Assignments" active={tab === 'sections'} onClick={() => setTab('sections')} />
      </div>

      {/* ── SUBJECT ASSIGNMENTS ───────────────────────────────────────────── */}
      {tab === 'subjects' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
            <select value={tchSubjId} onChange={(e) => { setTchSubjId(e.target.value); setAddSubjectId(''); }}
              className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
              <option value="">— Choose a teacher —</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.username} {t.teacherId ? `(${t.teacherId})` : ''}</option>)}
            </select>
          </div>

          {tchSubjId && (
            <>
              {/* Assign subject */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Assign to Subject</h3>
                <div className="flex flex-wrap gap-3 items-end">
                  <select value={addSubjectId} onChange={(e) => setAddSubjectId(e.target.value)}
                    className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
                    <option value="">Select subject…</option>
                    {availableSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button onClick={handleAssignSubject} disabled={!addSubjectId || assigning}
                    className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
                    {assigning ? 'Assigning…' : 'Assign'}
                  </button>
                </div>
              </div>

              {/* Assigned subjects list */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Assigned Subjects
                    {!subjListLoading && <span className="ml-2 text-xs text-gray-400 font-normal">({tchSubjList.length})</span>}
                  </h3>
                </div>
                {subjListLoading ? (
                  <div className="flex items-center justify-center py-10"><LoadingSpinner /></div>
                ) : tchSubjList.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-400">No subjects assigned to this teacher yet.</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {tchSubjList.map((sub) => {
                      const subId = sub.id ?? sub.subjectId;
                      const subName = sub.name ?? subjects.find(s => String(s.id) === String(subId))?.name ?? subId;
                      return (
                        <li key={subId} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                          <span className="text-sm font-medium text-gray-800">{subName}</span>
                          <button onClick={() => handleRemoveSubject(subId)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition">
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

          {!tchSubjId && (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
              Select a teacher above to manage subject assignments.
            </div>
          )}
        </div>
      )}

      {/* ── SECTION ASSIGNMENTS ───────────────────────────────────────────── */}
      {tab === 'sections' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
            <select value={tchSectId} onChange={(e) => { setTchSectId(e.target.value); setAddSectionId(''); }}
              className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
              <option value="">— Choose a teacher —</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.username} {t.teacherId ? `(${t.teacherId})` : ''}</option>)}
            </select>
          </div>

          {tchSectId && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Assign to Section</h3>
                <div className="flex flex-wrap gap-3 items-end">
                  <select value={addSectionId} onChange={(e) => setAddSectionId(e.target.value)}
                    className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
                    <option value="">Select section…</option>
                    {availableSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button onClick={handleAssignSection} disabled={!addSectionId || assigningSect}
                    className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
                    {assigningSect ? 'Assigning…' : 'Assign'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Assigned Sections
                    {!sectListLoading && <span className="ml-2 text-xs text-gray-400 font-normal">({tchSectList.length})</span>}
                  </h3>
                </div>
                {sectListLoading ? (
                  <div className="flex items-center justify-center py-10"><LoadingSpinner /></div>
                ) : tchSectList.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-400">No sections assigned to this teacher yet.</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {tchSectList.map((sec) => {
                      const secId = sec.id ?? sec.sectionId;
                      const secName = sec.name ?? sections.find(s => String(s.id) === String(secId))?.name ?? secId;
                      return (
                        <li key={secId} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                          <span className="text-sm font-medium text-gray-800">{secName}</span>
                          <button onClick={() => handleRemoveSection(secId)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition">
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

          {!tchSectId && (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
              Select a teacher above to manage section assignments.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentsPage;
