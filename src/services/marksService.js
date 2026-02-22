/**
 * marksService.js
 * Covers: Subject Exam Marks (/api/subject-exam-marks) and
 *         Module Exam Marks  (/api/module-exam-marks).
 */
import api from './api';

// ── Subject Exam Marks (SUBJECT_BASE classes) ─────────────────────────────────
export const getSubjectMarks          = ()                                                => api.get('/api/subject-exam-marks').then(r => r.data);
export const getSubjectMarksByStudent = (studentId)                                       => api.get(`/api/subject-exam-marks/by-student/${studentId}`).then(r => r.data);
export const getSubjectMarksByClass   = (classId)                                         => api.get(`/api/subject-exam-marks/by-class/${classId}`).then(r => r.data);
export const getSubjectMarksBySubject = (subjectId)                                       => api.get(`/api/subject-exam-marks/by-subject/${subjectId}`).then(r => r.data);
export const getSubjectMarksByClassSubjectTerm = (classId, subjectId, termTest)           => api.get(`/api/subject-exam-marks/by-class/${classId}/by-subject/${subjectId}/by-term/${termTest}`).then(r => r.data);
export const getSubjectMark           = (studentId, classId, subjectId, termTest)         => api.get(`/api/subject-exam-marks/mark/${studentId}/${classId}/${subjectId}/${termTest}`).then(r => r.data);
export const bulkCreateSubjectMarks   = (dto)                                             => api.post('/api/subject-exam-marks/bulk', dto).then(r => r.data);
export const updateSubjectMark        = (studentId, classId, subjectId, termTest, dto)    => api.put(`/api/subject-exam-marks/mark/${studentId}/${classId}/${subjectId}/${termTest}`, dto).then(r => r.data);
export const deleteSubjectMark        = (studentId, classId, subjectId, termTest)         => api.delete(`/api/subject-exam-marks/mark/${studentId}/${classId}/${subjectId}/${termTest}`).then(r => r.data);

// ── Module Exam Marks (MODULE_BASE classes) ───────────────────────────────────
export const getModuleMarks           = ()                               => api.get('/api/module-exam-marks').then(r => r.data);
export const getModuleMarksByStudent  = (studentId)                      => api.get(`/api/module-exam-marks/by-student/${studentId}`).then(r => r.data);
export const getModuleMarksByModule   = (moduleId)                       => api.get(`/api/module-exam-marks/by-module/${moduleId}`).then(r => r.data);
export const getModuleMark            = (studentId, moduleId)            => api.get(`/api/module-exam-marks/mark/${studentId}/${moduleId}`).then(r => r.data);
export const bulkCreateModuleMarks    = (dto)                            => api.post('/api/module-exam-marks/bulk', dto).then(r => r.data);
export const updateModuleMark         = (studentId, moduleId, dto)       => api.put(`/api/module-exam-marks/mark/${studentId}/${moduleId}`, dto).then(r => r.data);
export const deleteModuleMark         = (studentId, moduleId)            => api.delete(`/api/module-exam-marks/mark/${studentId}/${moduleId}`).then(r => r.data);
