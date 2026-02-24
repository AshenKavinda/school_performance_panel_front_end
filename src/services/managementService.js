/**
 * managementService.js
 * Covers: Admins, ApplicationAdmins, Managers, Operators, Teachers,
 *         Students, StudentGlobals, Users, Clusters, Sections, Classes,
 *         Subjects, Modules, Packages.
 */
import api from './api';

// ── Admins ────────────────────────────────────────────────────────────────────
export const getAdmins              = ()          => api.get('/api/admins').then(r => r.data);
export const getAdmin               = (id)        => api.get(`/api/admins/${id}`).then(r => r.data);
export const getAdminByUser         = (userId)    => api.get(`/api/admins/by-user/${userId}`).then(r => r.data);
export const createAdmin            = (dto)       => api.post('/api/admins', dto).then(r => r.data);
export const updateAdmin            = (id, dto)   => api.put(`/api/admins/${id}`, dto).then(r => r.data);
export const deleteAdmin            = (id)        => api.delete(`/api/admins/${id}`).then(r => r.data);

// ── ApplicationAdmins ─────────────────────────────────────────────────────────
export const getApplicationAdmins    = ()         => api.get('/api/application-admins').then(r => r.data);
export const getApplicationAdmin     = (id)       => api.get(`/api/application-admins/${id}`).then(r => r.data);
export const getApplicationAdminByUser = (userId) => api.get(`/api/application-admins/by-user/${userId}`).then(r => r.data);
export const updateApplicationAdmin  = (id, dto)  => api.put(`/api/application-admins/${id}`, dto).then(r => r.data);
export const enableApplicationAdmin  = (id)       => api.patch(`/api/application-admins/${id}/enable`).then(r => r.data);
export const disableApplicationAdmin = (id)       => api.patch(`/api/application-admins/${id}/disable`).then(r => r.data);

// ── Managers ──────────────────────────────────────────────────────────────────
export const getManagers            = ()              => api.get('/api/managers').then(r => r.data);
export const getManager             = (id)            => api.get(`/api/managers/${id}`).then(r => r.data);
export const getManagerByUser       = (userId)        => api.get(`/api/managers/by-user/${userId}`).then(r => r.data);
export const getManagersByAppAdmin  = (appAdminId)    => api.get(`/api/managers/by-application-admin/${appAdminId}`).then(r => r.data);
export const createManager          = (dto)           => api.post('/api/managers', dto).then(r => r.data);
export const updateManager          = (id, dto)       => api.put(`/api/managers/${id}`, dto).then(r => r.data);
export const deleteManager          = (id)            => api.delete(`/api/managers/${id}`).then(r => r.data);

// ── Operators ─────────────────────────────────────────────────────────────────
export const getOperators           = ()              => api.get('/api/operators').then(r => r.data);
export const getOperator            = (id)            => api.get(`/api/operators/${id}`).then(r => r.data);
export const getOperatorByUser      = (userId)        => api.get(`/api/operators/by-user/${userId}`).then(r => r.data);
export const getOperatorsByAppAdmin = (appAdminId)    => api.get(`/api/operators/by-application-admin/${appAdminId}`).then(r => r.data);
export const createOperator         = (dto)           => api.post('/api/operators', dto).then(r => r.data);
export const updateOperator         = (id, dto)       => api.put(`/api/operators/${id}`, dto).then(r => r.data);
export const deleteOperator         = (id)            => api.delete(`/api/operators/${id}`).then(r => r.data);

// ── Teachers ──────────────────────────────────────────────────────────────────
export const getTeachers            = ()              => api.get('/api/teachers').then(r => r.data);
export const getTeacher             = (id)            => api.get(`/api/teachers/${id}`).then(r => r.data);
export const getTeacherByUser       = (userId)        => api.get(`/api/teachers/by-user/${userId}`).then(r => r.data);
export const getTeachersByOperator  = (operatorId)    => api.get(`/api/teachers/by-operator/${operatorId}`).then(r => r.data);
export const createTeacher          = (dto)           => api.post('/api/teachers', dto).then(r => r.data);
export const updateTeacher          = (id, dto)       => api.put(`/api/teachers/${id}`, dto).then(r => r.data);
export const deleteTeacher          = (id)            => api.delete(`/api/teachers/${id}`).then(r => r.data);

// ── Students (school-scoped) ──────────────────────────────────────────────────
export const getStudents            = ()              => api.get('/api/students').then(r => r.data);
export const getStudent             = (id)            => api.get(`/api/students/${id}`).then(r => r.data);
export const getStudentsByOperator  = (operatorId)    => api.get(`/api/students/by-operator/${operatorId}`).then(r => r.data);
export const getStudentByGlobal     = (globalId)      => api.get(`/api/students/by-student-global/${globalId}`).then(r => r.data);
export const createStudent          = (dto)           => api.post('/api/students', dto).then(r => r.data);
export const updateStudent          = (id, dto)       => api.put(`/api/students/${id}`, dto).then(r => r.data);
export const deleteStudent          = (id)            => api.delete(`/api/students/${id}`).then(r => r.data);
export const getStudentsByClassAndSubject = (classId, subjectId) => api.get(`/api/students/by-class/${classId}/subject/${subjectId}`).then(r => r.data);

// ── StudentGlobals ────────────────────────────────────────────────────────────
export const getStudentGlobals       = ()             => api.get('/api/student-globals').then(r => r.data);
export const getStudentGlobal        = (id)           => api.get(`/api/student-globals/${id}`).then(r => r.data);
export const getStudentGlobalByUser  = (userId)       => api.get(`/api/student-globals/by-user/${userId}`).then(r => r.data);
export const getStudentGlobalByEmail = (email)        => api.get(`/api/student-globals/by-email/${encodeURIComponent(email)}`).then(r => r.data);
export const getStudentGlobalByCode  = (code)         => api.get(`/api/student-globals/by-code/${code}`).then(r => r.data);
export const updateStudentGlobal     = (id, dto)      => api.put(`/api/student-globals/${id}`, dto).then(r => r.data);

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers               = ()              => api.get('/api/users').then(r => r.data);
export const getUser                = (id)            => api.get(`/api/users/${id}`).then(r => r.data);
export const createUser             = (dto)           => api.post('/api/users', dto).then(r => r.data);
export const updateUser             = (id, dto)       => api.put(`/api/users/${id}`, dto).then(r => r.data);
export const deleteUser             = (id)            => api.delete(`/api/users/${id}`).then(r => r.data);

// ── Clusters ──────────────────────────────────────────────────────────────────
export const getClusters            = ()              => api.get('/api/clusters').then(r => r.data);
export const getCluster             = (id)            => api.get(`/api/clusters/${id}`).then(r => r.data);
export const getClustersByOperator  = (operatorId)    => api.get(`/api/clusters/by-operator/${operatorId}`).then(r => r.data);
export const createCluster          = (dto)           => api.post('/api/clusters', dto).then(r => r.data);
export const updateCluster          = (id, dto)       => api.put(`/api/clusters/${id}`, dto).then(r => r.data);
export const deleteCluster          = (id)            => api.delete(`/api/clusters/${id}`).then(r => r.data);

// ── Sections ──────────────────────────────────────────────────────────────────
export const getSections            = ()              => api.get('/api/sections').then(r => r.data);
export const getSection             = (id)            => api.get(`/api/sections/${id}`).then(r => r.data);
export const getSectionsByCluster   = (clusterId)     => api.get(`/api/sections/by-cluster/${clusterId}`).then(r => r.data);
export const getSectionsByOperator  = (operatorId)    => api.get(`/api/sections/by-operator/${operatorId}`).then(r => r.data);
export const createSection          = (dto)           => api.post('/api/sections', dto).then(r => r.data);
export const updateSection          = (id, dto)       => api.put(`/api/sections/${id}`, dto).then(r => r.data);
export const deleteSection          = (id)            => api.delete(`/api/sections/${id}`).then(r => r.data);

// ── Classes ───────────────────────────────────────────────────────────────────
export const getClasses             = ()              => api.get('/api/classes').then(r => r.data);
export const getClass               = (id)            => api.get(`/api/classes/${id}`).then(r => r.data);
export const getClassesBySection    = (sectionId)     => api.get(`/api/classes/by-section/${sectionId}`).then(r => r.data);
export const getClassesByOperator   = (operatorId)    => api.get(`/api/classes/by-operator/${operatorId}`).then(r => r.data);
export const getClassesByYear       = (year)          => api.get(`/api/classes/by-academic-year/${year}`).then(r => r.data);
export const createClass            = (dto)           => api.post('/api/classes', dto).then(r => r.data);
export const updateClass            = (id, dto)       => api.put(`/api/classes/${id}`, dto).then(r => r.data);
export const deleteClass            = (id)            => api.delete(`/api/classes/${id}`).then(r => r.data);

// ── Subjects ──────────────────────────────────────────────────────────────────
export const getSubjects            = ()              => api.get('/api/subjects').then(r => r.data);
export const getSubject             = (id)            => api.get(`/api/subjects/${id}`).then(r => r.data);
export const getSubjectsByOperator  = (operatorId)    => api.get(`/api/subjects/by-operator/${operatorId}`).then(r => r.data);
export const getSubjectsByClass     = (classId)       => api.get(`/api/subjects/by-class/${classId}`).then(r => r.data);
export const createSubject          = (dto)           => api.post('/api/subjects', dto).then(r => r.data);
export const updateSubject          = (id, dto)       => api.put(`/api/subjects/${id}`, dto).then(r => r.data);
export const deleteSubject          = (id)            => api.delete(`/api/subjects/${id}`).then(r => r.data);

// ── Modules ───────────────────────────────────────────────────────────────────
export const getModules             = ()                          => api.get('/api/modules').then(r => r.data);
export const getModule              = (id)                        => api.get(`/api/modules/${id}`).then(r => r.data);
export const getModulesByOperator   = (operatorId)                => api.get(`/api/modules/by-operator/${operatorId}`).then(r => r.data);
export const getModulesBySectionSubject = (sectionId, subjectId) => api.get(`/api/modules/by-section/${sectionId}/subject/${subjectId}`).then(r => r.data);
export const createModule           = (dto)                       => api.post('/api/modules', dto).then(r => r.data);
export const updateModule           = (id, dto)                   => api.put(`/api/modules/${id}`, dto).then(r => r.data);
export const deleteModule           = (id)                        => api.delete(`/api/modules/${id}`).then(r => r.data);

// ── Packages ──────────────────────────────────────────────────────────────────
export const getPackages            = ()              => api.get('/api/packages').then(r => r.data);
export const getPackage             = (id)            => api.get(`/api/packages/${id}`).then(r => r.data);
export const createPackage          = (dto)           => api.post('/api/packages', dto).then(r => r.data);
export const updatePackage          = (id, dto)       => api.put(`/api/packages/${id}`, dto).then(r => r.data);
export const deletePackage          = (id)            => api.delete(`/api/packages/${id}`).then(r => r.data);
