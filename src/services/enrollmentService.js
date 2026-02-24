/**
 * enrollmentService.js
 * Covers all /api/enrollments/* endpoints.
 */
import api from './api';

// ── Class Enrollments ─────────────────────────────────────────────────────────
export const bulkEnrollClass          = (dto)                    => api.post('/api/enrollments/class/bulk', dto).then(r => r.data);
export const enrollStudentToClass     = (classId, studentId)     => api.post(`/api/enrollments/class/${classId}/student/${studentId}`).then(r => r.data);
export const removeStudentFromClass   = (classId, studentId)     => api.delete(`/api/enrollments/class/${classId}/student/${studentId}`).then(r => r.data);
export const getClassStudents         = (classId)                 => api.get(`/api/enrollments/class/${classId}/students`).then(r => r.data);

// ── Subject Enrollments ──────────────────────────────────────────────────────
export const enrollClassCommonSubjects  = (dto)                              => api.post('/api/enrollments/subjects/class-common', dto).then(r => r.data);
export const enrollElectiveSubject      = (dto)                              => api.post('/api/enrollments/subjects/elective', dto).then(r => r.data);
export const enrollSingleSubject        = ({ studentId, subjectId, sectionId }) => api.post('/api/enrollments/subjects/single', null, { params: { studentId, subjectId, sectionId } }).then(r => r.data);
export const getSubjectStudents         = (subjectId, sectionId)             => api.get(`/api/enrollments/subject/${subjectId}/section/${sectionId}/students`).then(r => r.data);
export const removeStudentFromSubject   = (subjectId, sectionId, studentId) => api.delete(`/api/enrollments/subject/${subjectId}/section/${sectionId}/student/${studentId}`).then(r => r.data);
export const getStudentEnrollment       = (studentId)                        => api.get(`/api/enrollments/student/${studentId}`).then(r => r.data);
export const getStudentSubjects         = (studentId)                        => api.get(`/api/enrollments/student/${studentId}/subjects`).then(r => r.data);
export const getStudentCurriculum       = (classId, studentId)               => api.get(`/api/enrollments/class/${classId}/student/${studentId}/curriculum`).then(r => r.data);

// ── Teacher Assignments ───────────────────────────────────────────────────────
export const assignTeacherToSubject        = (dto)                      => api.post('/api/enrollments/teacher-subject', dto).then(r => r.data);
export const bulkAssignTeacherSubjects     = (dto)                      => api.post('/api/enrollments/teacher-subject/bulk', dto).then(r => r.data);
export const removeTeacherFromSubject      = (teacherId, subjectId)     => api.delete(`/api/enrollments/teacher-subject/${teacherId}/${subjectId}`).then(r => r.data);
export const getSubjectTeachers            = (subjectId)                => api.get(`/api/enrollments/subject/${subjectId}/teachers`).then(r => r.data);
export const getTeacherSubjects            = (teacherId)                => api.get(`/api/enrollments/teacher/${teacherId}/subjects`).then(r => r.data);

export const assignTeacherToSection        = (dto)                      => api.post('/api/enrollments/teacher-section', dto).then(r => r.data);
export const bulkAssignTeacherSections     = (dto)                      => api.post('/api/enrollments/teacher-section/bulk', dto).then(r => r.data);
export const removeTeacherFromSection      = (teacherId, sectionId)     => api.delete(`/api/enrollments/teacher-section/${teacherId}/${sectionId}`).then(r => r.data);
export const getSectionTeachers            = (sectionId)                => api.get(`/api/enrollments/section/${sectionId}/teachers`).then(r => r.data);
export const getTeacherSections            = (teacherId)                => api.get(`/api/enrollments/teacher/${teacherId}/sections`).then(r => r.data);

export const assignTeachersToSubjectSections = (dto)                   => api.post('/api/enrollments/assign-teachers-to-subject-sections', dto).then(r => r.data);
export const getTeacherAssignments           = (teacherId)             => api.get(`/api/enrollments/teacher/${teacherId}/assignments`).then(r => r.data);

export const getEligibleTeachers = (params) => api.get('/api/enrollments/eligible-teachers', { params }).then(r => r.data);
export const getSectionSubjectTeachers = (sectionId, subjectId) => api.get(`/api/enrollments/section/${sectionId}/subject/${subjectId}/teachers`).then(r => r.data);
export const checkTeacherEligibility   = (teacherId) => api.get(`/api/enrollments/teacher/${teacherId}/eligible`).then(r => r.data);
