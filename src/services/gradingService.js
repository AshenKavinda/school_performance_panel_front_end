/**
 * gradingService.js
 * Covers: GPA Gradings (/api/gpa-gradings) and Subject Gradings (/api/subject-gradings).
 */
import api from './api';

// ── GPA Gradings (MODULE_BASE grade calculation) ──────────────────────────────
export const getGPAGradings         = ()         => api.get('/api/gpa-gradings').then(r => r.data);
export const getGPAGrading          = (id)       => api.get(`/api/gpa-gradings/${id}`).then(r => r.data);
export const getMyGPAGradings       = ()         => api.get('/api/gpa-gradings/my-gradings').then(r => r.data);
export const getGPAGradingsByAdmin  = (adminId)  => api.get(`/api/gpa-gradings/by-admin/${adminId}`).then(r => r.data);
export const createGPAGrading       = (dto)      => api.post('/api/gpa-gradings', dto).then(r => r.data);
export const updateGPAGrading       = (id, dto)  => api.put(`/api/gpa-gradings/${id}`, dto).then(r => r.data);
export const deleteGPAGrading       = (id)       => api.delete(`/api/gpa-gradings/${id}`).then(r => r.data);

// ── Subject Gradings (SUBJECT_BASE grade labels) ──────────────────────────────
export const getSubjectGradings         = ()         => api.get('/api/subject-gradings').then(r => r.data);
export const getSubjectGrading          = (id)       => api.get(`/api/subject-gradings/${id}`).then(r => r.data);
export const getMySubjectGradings       = ()         => api.get('/api/subject-gradings/my-gradings').then(r => r.data);
export const getSubjectGradingsByAdmin  = (adminId)  => api.get(`/api/subject-gradings/by-admin/${adminId}`).then(r => r.data);
export const createSubjectGrading       = (dto)      => api.post('/api/subject-gradings', dto).then(r => r.data);
export const updateSubjectGrading       = (id, dto)  => api.put(`/api/subject-gradings/${id}`, dto).then(r => r.data);
export const deleteSubjectGrading       = (id)       => api.delete(`/api/subject-gradings/${id}`).then(r => r.data);

// ── Grade lookup helper ───────────────────────────────────────────────────────
/**
 * Finds the grade label for a numeric mark from a grading config array.
 * Works for both GPA gradings (returns { grade, gradePoint, label }) and
 * subject gradings (returns { grade, label }).
 *
 * @param {number} mark
 * @param {Array}  gradings  — array of GPAGradingDto or SubjectGradingDto
 * @returns {{ grade: string, gradePoint?: number } | null}
 */
export const resolveGrade = (mark, gradings = []) => {
  if (mark == null || !gradings.length) return null;
  const found = gradings.find(
    (g) => mark >= g.minMark && mark <= g.maxMark
  );
  return found
    ? { grade: found.grade, gradePoint: found.gradePoint ?? null }
    : null;
};
