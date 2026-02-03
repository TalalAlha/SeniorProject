import api from './axios';

// ============== Authentication ==============
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

// ============== Companies ==============
export const companiesAPI = {
  list: (params) => api.get('/companies/', { params }),
  create: (data) => api.post('/companies/', data),
  get: (id) => api.get(`/companies/${id}/`),
  update: (id, data) => api.patch(`/companies/${id}/`, data),
  delete: (id) => api.delete(`/companies/${id}/`),
  getStats: (id) => api.get(`/companies/${id}/stats/`),
};

// ============== Employees ==============
export const employeesAPI = {
  list: (params) => api.get('/employees/', { params }),
  create: (data) => api.post('/employees/', data),
  get: (id) => api.get(`/employees/${id}/`),
  update: (id, data) => api.patch(`/employees/${id}/`, data),
  delete: (id) => api.delete(`/employees/${id}/`),
  invite: (data) => api.post('/employees/invite/', data),
  getRiskScore: (id) => api.get(`/employees/${id}/risk-score/`),
  bulkImport: (formData) => api.post('/employees/bulk-import/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// ============== Campaigns ==============
export const campaignsAPI = {
  list: (params) => api.get('/campaigns/', { params }),
  create: (data) => api.post('/campaigns/', data),
  get: (id) => api.get(`/campaigns/${id}/`),
  update: (id, data) => api.patch(`/campaigns/${id}/`, data),
  delete: (id) => api.delete(`/campaigns/${id}/`),
  assignEmployees: (id, employeeIds) => api.post(`/campaigns/${id}/assign-employees/`, { employee_ids: employeeIds }),
  getProgress: (id) => api.get(`/campaigns/${id}/progress/`),
  // Employee-specific endpoints
  getMyQuizzes: (params) => api.get('/campaigns/quizzes/', { params }),
};

// ============== Simulations ==============
export const simulationsAPI = {
  list: (params) => api.get('/simulations/', { params }),
  create: (data) => api.post('/simulations/', data),
  get: (id) => api.get(`/simulations/${id}/`),
  update: (id, data) => api.patch(`/simulations/${id}/`, data),
  delete: (id) => api.delete(`/simulations/${id}/`),
  getTemplates: () => api.get('/simulations/templates/'),
  generatePackage: (id) => api.post(`/simulations/${id}/generate-package/`),
  getResults: (id) => api.get(`/simulations/${id}/results/`),
  recordClick: (trackingId) => api.post(`/simulations/track/${trackingId}/click/`),
  recordReport: (trackingId) => api.post(`/simulations/track/${trackingId}/report/`),
};

// ============== Quizzes ==============
export const quizzesAPI = {
  list: (params) => api.get('/quizzes/', { params }),
  create: (data) => api.post('/quizzes/', data),
  get: (id) => api.get(`/quizzes/${id}/`),
  update: (id, data) => api.patch(`/quizzes/${id}/`, data),
  delete: (id) => api.delete(`/quizzes/${id}/`),
  getQuestions: (id) => api.get(`/quizzes/${id}/questions/`),
  submitAttempt: (id, answers) => api.post(`/quizzes/${id}/submit/`, { answers }),
  getMyAttempts: () => api.get('/quizzes/my-attempts/'),
  getAttemptDetails: (attemptId) => api.get(`/quizzes/attempts/${attemptId}/`),
};

// ============== Training ==============
export const trainingAPI = {
  list: (params) => api.get('/training/', { params }),
  create: (data) => api.post('/training/', data),
  get: (id) => api.get(`/training/${id}/`),
  update: (id, data) => api.patch(`/training/${id}/`, data),
  delete: (id) => api.delete(`/training/${id}/`),
  getModules: (id) => api.get(`/training/${id}/modules/`),
  startModule: (id, moduleId) => api.post(`/training/${id}/modules/${moduleId}/start/`),
  completeModule: (id, moduleId) => api.post(`/training/${id}/modules/${moduleId}/complete/`),
  getMyProgress: () => api.get('/training/my-progress/'),
};

// ============== Analytics ==============
export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard/'),
  getCompanyStats: (companyId) => api.get(`/analytics/company/${companyId}/`),
  getEmployeeStats: (employeeId) => api.get(`/analytics/employee/${employeeId}/`),
  getCampaignAnalytics: (campaignId) => api.get(`/analytics/campaign/${campaignId}/`),
  getRiskTrends: (params) => api.get('/analytics/risk-trends/', { params }),
  exportReport: (params) => api.get('/analytics/export/', { params, responseType: 'blob' }),
};

// ============== Gamification ==============
export const gamificationAPI = {
  getLeaderboard: (params) => api.get('/gamification/leaderboard/', { params }),
  getMyBadges: () => api.get('/gamification/my-badges/'),
  getAllBadges: () => api.get('/gamification/badges/'),
  getMyPoints: () => api.get('/gamification/my-points/'),
};

// ============== Community Portal ==============
export const communityAPI = {
  getArticles: (params) => api.get('/community/articles/', { params }),
  getArticle: (slug) => api.get(`/community/articles/${slug}/`),
  getResources: (params) => api.get('/community/resources/', { params }),
  getTips: (params) => api.get('/community/tips/', { params }),
  getPublicQuizzes: () => api.get('/community/quizzes/'),
};

export default {
  auth: authAPI,
  companies: companiesAPI,
  employees: employeesAPI,
  campaigns: campaignsAPI,
  simulations: simulationsAPI,
  quizzes: quizzesAPI,
  training: trainingAPI,
  analytics: analyticsAPI,
  gamification: gamificationAPI,
  community: communityAPI,
};
