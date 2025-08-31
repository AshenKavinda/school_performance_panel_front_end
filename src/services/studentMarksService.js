import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const studentMarksService = {
  // Get test enrollments by course and test (for teachers to view students)
  async getTestEnrollments(courseId, testId) {
    const response = await api.get(`/test-enrollment/course/${courseId}/test/${testId}`);
    return response.data;
  },

  // Update student mark (teachers and officers)
  async updateStudentMark(recordId, markData) {
    const response = await api.put(`/test-enrollment/${recordId}/mark`, markData);
    return response.data;
  },

  // Get courses assigned to teacher
  async getTeacherCourses(teacherId) {
    const response = await api.get(`/course-subject-enrollment/teacher/${teacherId}`);
    return response.data;
  },

  // Get student marks report (no auth required)
  async getStudentMarks(studentId) {
    const response = await api.get(`/reports/student/${studentId}/marks`);
    return response.data;
  },
};

export default studentMarksService;
