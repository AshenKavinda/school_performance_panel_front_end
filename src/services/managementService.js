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

const managementService = {
  // Student Management
  students: {
    async getAll() {
      const response = await api.get('/student');
      return response.data;
    },

    async getById(id) {
      const response = await api.get(`/student/${id}`);
      return response.data;
    },

    async create(studentData) {
      const response = await api.post('/student', studentData);
      return response.data;
    },

    async update(id, studentData) {
      const response = await api.put(`/student/${id}`, studentData);
      return response.data;
    },

    async delete(id) {
      const response = await api.delete(`/student/${id}`);
      return response.data;
    },

    async restore(id) {
      const response = await api.post(`/student/${id}/restore`);
      return response.data;
    },

    async getDeleted() {
      const response = await api.get('/student/deleted');
      return response.data;
    },

    async searchByName(name) {
      const response = await api.get(`/student/search?name=${encodeURIComponent(name)}`);
      return response.data;
    },
  },

  // Subject Management
  subjects: {
    async getAll() {
      const response = await api.get('/subject');
      return response.data;
    },

    async getById(id) {
      const response = await api.get(`/subject/${id}`);
      return response.data;
    },

    async create(subjectData) {
      const response = await api.post('/subject', subjectData);
      return response.data;
    },

    async update(id, subjectData) {
      const response = await api.put(`/subject/${id}`, subjectData);
      return response.data;
    },

    async delete(id) {
      const response = await api.delete(`/subject/${id}`);
      return response.data;
    },

    async restore(id) {
      const response = await api.post(`/subject/${id}/restore`);
      return response.data;
    },

    async getDeleted() {
      const response = await api.get('/subject/deleted');
      return response.data;
    },

    async searchByName(name) {
      const response = await api.get(`/subject/search/${encodeURIComponent(name)}`);
      return response.data;
    },
  },

  // Course Management
  courses: {
    async getAll() {
      const response = await api.get('/course');
      return response.data;
    },

    async getById(id) {
      const response = await api.get(`/course/${id}`);
      return response.data;
    },

    async create(courseData) {
      const response = await api.post('/course', courseData);
      return response.data;
    },

    async update(id, courseData) {
      const response = await api.put(`/course/${id}`, courseData);
      return response.data;
    },

    async delete(id) {
      const response = await api.delete(`/course/${id}`);
      return response.data;
    },

    async restore(id) {
      const response = await api.post(`/course/${id}/restore`);
      return response.data;
    },

    async getDeleted() {
      const response = await api.get('/course/deleted');
      return response.data;
    },

    async getYears() {
      const response = await api.get('/course/years');
      return response.data;
    },

    async searchByName(name) {
      const response = await api.get(`/course/search/name/${encodeURIComponent(name)}`);
      return response.data;
    },

    async searchByYear(year) {
      const response = await api.get(`/course/search/year/${year}`);
      return response.data;
    },

    async searchByNameAndYear(name, year) {
      const response = await api.get(`/course/search/name/${encodeURIComponent(name)}/year/${year}`);
      return response.data;
    },
  },

  // Test Management
  tests: {
    async getAll() {
      const response = await api.get('/test');
      return response.data;
    },

    async getById(id) {
      const response = await api.get(`/test/${id}`);
      return response.data;
    },

    async create(testData) {
      const response = await api.post('/test', testData);
      return response.data;
    },

    async update(id, testData) {
      const response = await api.put(`/test/${id}`, testData);
      return response.data;
    },

    async delete(id) {
      const response = await api.delete(`/test/${id}`);
      return response.data;
    },

    async restore(id) {
      const response = await api.post(`/test/${id}/restore`);
      return response.data;
    },

    async getDeleted() {
      const response = await api.get('/test/deleted');
      return response.data;
    },

    async getYears() {
      const response = await api.get('/test/years');
      return response.data;
    },

    async getByType(type) {
      const response = await api.get(`/test/types/${type}`);
      return response.data;
    },

    async getByYear(year) {
      const response = await api.get(`/test/year/${year}`);
      return response.data;
    },

    async searchByName(name) {
      const response = await api.get(`/test/search/name/${encodeURIComponent(name)}`);
      return response.data;
    },

    async getBySubject(subjectId) {
      const response = await api.get(`/test/subject/${subjectId}`);
      return response.data;
    },
  },
};

export default managementService;
