/**
 * analyticsService.js
 * Covers all /api/analytics/* endpoints.
 */
import api from './api';

// ── Teacher Analytics ─────────────────────────────────────────────────────────
export const getTeacherMyClasses       = ()                              => api.get('/api/analytics/teacher/my-classes').then(r => r.data);
export const getTeacherSubjectAverages = (term)                          => api.get('/api/analytics/teacher/subject-averages', { params: { term } }).then(r => r.data);
export const getTeacherGradeDistribution = (classId, subjectId, term)    => api.get(`/api/analytics/teacher/grade-distribution/${classId}/${subjectId}/${term}`).then(r => r.data);
export const getTeacherStudentRankings = (classId, subjectId, term)      => api.get(`/api/analytics/teacher/student-rankings/${classId}/${subjectId}/${term}`).then(r => r.data);
export const getTeacherAtRiskStudents  = (term, threshold = 35)          => api.get('/api/analytics/teacher/at-risk-students', { params: { term, threshold } }).then(r => r.data);
export const getTeacherClassComparison = (subjectId, term)               => api.get(`/api/analytics/teacher/class-comparison/${subjectId}`, { params: { term } }).then(r => r.data);
export const getTeacherModulePerformance = (classId)                     => api.get(`/api/analytics/teacher/module-performance/${classId}`).then(r => r.data);
