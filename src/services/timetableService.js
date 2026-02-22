/**
 * timetableService.js
 * Covers: Time Slots (/api/TimeSlots) and Timetables (/api/timetables).
 */
import api from './api';

// ── Time Slots ────────────────────────────────────────────────────────────────
export const getTimeSlots         = ()               => api.get('/api/TimeSlots').then(r => r.data);
export const getTimeSlot          = (id)             => api.get(`/api/TimeSlots/${id}`).then(r => r.data);
export const getTimeSlotsByAdmin  = (adminId)        => api.get(`/api/TimeSlots/by-admin/${adminId}`).then(r => r.data);
export const createTimeSlot       = (dto)            => api.post('/api/TimeSlots', dto).then(r => r.data);
export const updateTimeSlot       = (id, dto)        => api.put(`/api/TimeSlots/${id}`, dto).then(r => r.data);
export const deleteTimeSlot       = (id)             => api.delete(`/api/TimeSlots/${id}`).then(r => r.data);

// ── Timetables ────────────────────────────────────────────────────────────────
export const getTimetables             = ()                       => api.get('/api/timetables').then(r => r.data);
export const getTimetable              = (id)                     => api.get(`/api/timetables/${id}`).then(r => r.data);
export const createTimetable           = (dto)                    => api.post('/api/timetables', dto).then(r => r.data);
export const bulkCreateTimetable       = (dto)                    => api.post('/api/timetables/bulk', dto).then(r => r.data);
export const updateTimetable           = (id, dto)                => api.put(`/api/timetables/${id}`, dto).then(r => r.data);
export const deleteTimetable           = (id)                     => api.delete(`/api/timetables/${id}`).then(r => r.data);
export const checkTimetableConflicts   = (dto)                    => api.post('/api/timetables/check-conflicts', dto).then(r => r.data);

// ── Weekly Schedule Fetchers ──────────────────────────────────────────────────
export const getClassWeeklySchedule   = (classId)               => api.get(`/api/timetables/class/${classId}/week`).then(r => r.data);
export const getClassDaySchedule      = (classId, day)          => api.get(`/api/timetables/class/${classId}/day/${day}`).then(r => r.data);
export const getClassAvailability     = (classId)               => api.get(`/api/timetables/class/${classId}/available`).then(r => r.data);

export const getTeacherWeeklySchedule = (teacherId)             => api.get(`/api/timetables/teacher/${teacherId}/week`).then(r => r.data);
export const getTeacherDaySchedule    = (teacherId, day)        => api.get(`/api/timetables/teacher/${teacherId}/day/${day}`).then(r => r.data);
export const getTeacherAvailability   = (teacherId)             => api.get(`/api/timetables/teacher/${teacherId}/available`).then(r => r.data);

export const getStudentWeeklySchedule = (studentId, classId)   => api.get(`/api/timetables/student/${studentId}/class/${classId}/week`).then(r => r.data);
export const getTimetablesBySubject   = (subjectId)             => api.get(`/api/timetables/subject/${subjectId}`).then(r => r.data);
export const getTimetablesByTeacher   = (teacherId)             => api.get(`/api/timetables/teacher/${teacherId}`).then(r => r.data);
export const getTimetablesByClass     = (classId)               => api.get(`/api/timetables/class/${classId}`).then(r => r.data);
