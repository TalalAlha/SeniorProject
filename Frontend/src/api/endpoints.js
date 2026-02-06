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
  // Employee management within company
  getUsers: (companyId, params) => api.get(`/companies/${companyId}/users/`, { params }),
  addUser: (companyId, data) => api.post(`/companies/${companyId}/users/add/`, data),
  updateUser: (companyId, userId, data) => api.patch(`/companies/${companyId}/users/${userId}/`, data),
  removeUser: (companyId, userId) => api.delete(`/companies/${companyId}/users/${userId}/remove/`),
  inviteUsers: (companyId, emails) => api.post(`/companies/${companyId}/invite_users/`, { emails }),
  importCSV: (companyId, formData) => api.post(`/companies/${companyId}/import_csv/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  exportUsers: (companyId) => api.get(`/companies/${companyId}/export_users/`, { responseType: 'blob' }),
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
  // CRUD operations
  list: (params) => api.get('/campaigns/campaigns/', { params }),
  create: (data) => api.post('/campaigns/campaigns/', data),
  get: (id) => api.get(`/campaigns/campaigns/${id}/`),
  update: (id, data) => api.patch(`/campaigns/campaigns/${id}/`, data),
  delete: (id) => api.delete(`/campaigns/campaigns/${id}/`),
  // Campaign actions
  activate: (id) => api.post(`/campaigns/campaigns/${id}/activate/`),
  deactivate: (id) => api.post(`/campaigns/campaigns/${id}/deactivate/`),
  assignEmployees: (id, employeeIds) => api.post(`/campaigns/campaigns/${id}/assign_to_employees/`, { employee_ids: employeeIds }),
  unassignEmployees: (id, employeeIds) => api.post(`/campaigns/campaigns/${id}/unassign_employees/`, { employee_ids: employeeIds }),
  getStatistics: (id) => api.get(`/campaigns/campaigns/${id}/statistics/`),
  getProgress: (id) => api.get(`/campaigns/campaigns/${id}/progress/`),
  getAssignedEmployees: (id) => api.get(`/campaigns/campaigns/${id}/assigned_employees/`),
  // Employee-specific endpoints
  getMyQuizzes: (params) => api.get('/campaigns/quizzes/', { params }),
};

// ============== Simulations ==============
export const simulationsAPI = {
  // CRUD for simulation campaigns
  list: (params) => api.get('/simulations/campaigns/', { params }),
  create: (data) => api.post('/simulations/campaigns/', data),
  get: (id) => api.get(`/simulations/campaigns/${id}/`),
  update: (id, data) => api.patch(`/simulations/campaigns/${id}/`, data),
  delete: (id) => api.delete(`/simulations/campaigns/${id}/`),
  // Templates
  getTemplates: (params) => api.get('/simulations/templates/', { params }),
  getTemplate: (id) => api.get(`/simulations/templates/${id}/`),
  // Simulation actions
  generatePackage: (id) => api.get(`/simulations/campaigns/${id}/generate_package/`, { responseType: 'blob' }),
  markSent: (id) => api.post(`/simulations/campaigns/${id}/mark_sent/`),
  getAnalytics: (id) => api.get(`/simulations/campaigns/${id}/analytics/`),
  // Tracking (for phishing link clicks)
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
  // Employee-specific endpoints
  getMyTrainings: (params) => api.get('/training/assignments/my_trainings/', { params }),
  getMyRiskScore: () => api.get('/training/risk-scores/my_score/'),
};

// ============== Analytics ==============
export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard/'),
  getCompanyStats: (companyId) => api.get(`/analytics/company/${companyId}/`),
  getEmployeeStats: (employeeId) => api.get(`/analytics/employee/${employeeId}/`),
  getCampaignAnalytics: (campaignId) => api.get(`/analytics/campaign/${campaignId}/`),
  getRiskTrends: (params) => api.get('/analytics/risk-trends/', { params }),
  getRiskDistribution: () => api.get('/analytics/risk/distribution/'),
  exportReport: (params) => api.get('/analytics/export/', { params, responseType: 'blob' }),
  // Analytics dashboard endpoints
  getOverview: (params) => api.get('/analytics/dashboard/overview/', { params }),
  getTrends: (params) => api.get('/analytics/dashboard/trends/', { params }),
  getSimulationAnalytics: (id) => api.get(`/analytics/simulations/${id}/`),
  getHighRiskEmployees: () => api.get('/analytics/risk/high_risk_employees/'),
  getTrainingEffectiveness: () => api.get('/analytics/training/effectiveness/'),
  exportCSV: (data) => api.post('/analytics/export/csv/', data, { responseType: 'blob' }),
};

// ============== Gamification ==============
export const gamificationAPI = {
  getLeaderboard: (params) => api.get('/gamification/leaderboard/', { params }),
  getMyPosition: () => api.get('/gamification/leaderboard/my_position/'),
  getMyBadges: () => api.get('/gamification/badges/my_badges/'),
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
