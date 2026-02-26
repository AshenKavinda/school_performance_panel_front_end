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

// ── Student Analytics ─────────────────────────────────────────────────────────
export const getStudentDashboard         = (classId)                     => api.get('/api/analytics/student/dashboard', { params: { classId } }).then(r => r.data);
export const getStudentTermTrend         = (classId)                     => api.get('/api/analytics/student/term-trend', { params: { classId } }).then(r => r.data);
export const getStudentGPAReport         = (classId)                     => api.get('/api/analytics/student/gpa-report', { params: { classId } }).then(r => r.data);
export const getStudentModulePerformance = (classId)                     => api.get('/api/analytics/student/module-performance', { params: { classId } }).then(r => r.data);
export const getStudentClassRanks        = (term, classId)               => api.get('/api/analytics/student/class-ranks', { params: { term, classId } }).then(r => r.data);
export const getStudentVsClassAverage    = (term, classId)               => api.get('/api/analytics/student/vs-class-average', { params: { term, classId } }).then(r => r.data);

// ── Manager Analytics ─────────────────────────────────────────────────────────
export const getManagerSchoolOverview        = ()                            => api.get('/api/analytics/manager/school-overview').then(r => r.data);
export const getManagerPerformanceByCluster  = (term)                        => api.get('/api/analytics/manager/performance-by-cluster', { params: { term } }).then(r => r.data);
export const getManagerPerformanceBySection  = (term)                        => api.get('/api/analytics/manager/performance-by-section', { params: { term } }).then(r => r.data);
export const getManagerPerformanceBySubject  = (term)                        => api.get('/api/analytics/manager/performance-by-subject', { params: { term } }).then(r => r.data);
export const getManagerClassRankings         = (term)                        => api.get('/api/analytics/manager/class-rankings', { params: { term } }).then(r => r.data);
export const getManagerTermTrend             = ()                            => api.get('/api/analytics/manager/term-trend').then(r => r.data);
export const getManagerGPADistribution       = (term)                        => api.get('/api/analytics/manager/gpa-distribution', { params: { term } }).then(r => r.data);
export const getManagerTopStudents           = (term, count = 10)            => api.get('/api/analytics/manager/top-students', { params: { term, count } }).then(r => r.data);
export const getManagerTeacherPerformance    = (term)                        => api.get('/api/analytics/manager/teacher-performance', { params: { term } }).then(r => r.data);
export const getManagerAcademicYearComparison = ()                           => api.get('/api/analytics/manager/academic-year-comparison').then(r => r.data);
export const getManagerModulePerformance     = ()                           => api.get('/api/analytics/manager/module-performance').then(r => r.data);
