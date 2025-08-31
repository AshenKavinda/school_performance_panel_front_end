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

const reportsService = {
  // Get top performing students
  async getTopStudents(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.year) queryParams.append('year', params.year);
    if (params.term_type) queryParams.append('term_type', params.term_type);
    if (params.limitCount) queryParams.append('limitCount', params.limitCount);
    
    const response = await api.get(`/reports/topstudents?${queryParams.toString()}`);
    return response.data;
  },

  // Get average marks per subject
  async getAverageMarks(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.year) queryParams.append('year', params.year);
    if (params.term_type) queryParams.append('term_type', params.term_type);
    
    const response = await api.get(`/reports/avgmarks?${queryParams.toString()}`);
    return response.data;
  },

  // Get teacher performance report
  async getTeacherPerformance() {
    const response = await api.get('/reports/teacherperformance');
    return response.data;
  },

  // Get student progress across terms
  async getStudentProgress(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.year) queryParams.append('year', params.year);
    
    const response = await api.get(`/reports/studentprogress?${queryParams.toString()}`);
    return response.data;
  },

  // Get low performing subjects
  async getLowPerformingSubjects(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.year) queryParams.append('year', params.year);
    if (params.threshold) queryParams.append('threshold', params.threshold);
    
    const response = await api.get(`/reports/lowperformingsubjects?${queryParams.toString()}`);
    return response.data;
  },

  // Get top performing courses
  async getTopCourses(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.year) queryParams.append('year', params.year);
    if (params.term_type) queryParams.append('term_type', params.term_type);
    
    const response = await api.get(`/reports/topcourses?${queryParams.toString()}`);
    return response.data;
  },
};

export default reportsService;
