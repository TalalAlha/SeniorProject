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
  verifyEmail: (token) => api.post(`/auth/verify-email/${token}/`),
  resendVerification: (email) => api.post('/auth/resend-verification/', { email }),
  requestPasswordReset: (email) => api.post('/auth/password-reset/', { email }),
  resetPassword: (token, password) => api.post(`/auth/password-reset/${token}/`, { password }),
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
  getInvitationDetails: (token) => api.get(`/employees/invite/${token}/`),
  acceptInvitation: (token, data) => api.post(`/employees/invite/${token}/accept/`, data),
  getRiskScore: (id) => api.get(`/employees/${id}/risk-score/`),
  bulkImport: (formData) => api.post('/employees/bulk-import/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPendingInvitations: () => api.get('/employees/pending/'),
  resendInvitation: (userId) => api.post(`/employees/${userId}/resend/`),
  cancelInvitation: (userId) => api.delete(`/employees/${userId}/cancel/`),
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
  getAssignedEmployees: (id) => api.get(`/campaigns/campaigns/${id}/assigned_employees/`),
  getProgress: (id) => api.get(`/campaigns/campaigns/${id}/progress/`),
  // Employee-specific endpoints
  getMyQuizzes: (params) => api.get('/campaigns/quizzes/', { params }),
  // Quiz actions
  getQuiz: (id) => api.get(`/campaigns/quizzes/${id}/`),
  getQuizQuestions: (id) => api.get(`/campaigns/quizzes/${id}/questions/`),
  startQuiz: (id) => api.post(`/campaigns/quizzes/${id}/start/`),
  answerQuestion: (id, data) => api.post(`/campaigns/quizzes/${id}/answer_question/`, data),
  submitQuiz: (id) => api.post(`/campaigns/quizzes/${id}/submit/`),
  getQuizResult: (id) => api.get(`/campaigns/quizzes/${id}/result/`),
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
  send: (id, data = {}) => api.post(`/simulations/campaigns/${id}/send/`, data),
  generatePackage: (id) => api.post(`/simulations/campaigns/${id}/generate_package/`, {}, { responseType: 'blob' }),
  markSent: (id) => api.post(`/simulations/campaigns/${id}/mark_sent/`),
  complete: (id) => api.post(`/simulations/campaigns/${id}/complete/`),
  pause: (id) => api.post(`/simulations/campaigns/${id}/pause/`),
  resume: (id) => api.post(`/simulations/campaigns/${id}/resume/`),
  getAnalytics: (id) => api.get(`/simulations/campaigns/${id}/analytics/`),
  getResults: (id) => api.get(`/simulations/campaigns/${id}/results/`),
  getSummary: (id) => api.get(`/simulations/campaigns/${id}/summary/`),
  // Tracking (for phishing link clicks)
  recordClick: (trackingId) => api.post(`/simulations/track/${trackingId}/click/`),
  recordReport: (trackingId) => api.post(`/simulations/track/${trackingId}/report/`),
  // Landing page feedback (public – no auth required)
  getSimulationFeedback: (linkToken, lang) =>
    api.get(`/simulations/feedback/${linkToken}/`, { params: lang ? { lang } : {} }),
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
  // Modules (admin)
  getModules: (params) => api.get('/training/modules/', { params }),
  getModule: (id) => api.get(`/training/modules/${id}/`),
  getModuleQuestions: (id) => api.get(`/training/modules/${id}/questions/`),
  getCategories: () => api.get('/training/modules/categories/'),

  // Assignments
  getAssignments: (params) => api.get('/training/assignments/', { params }),
  getAssignment: (id) => api.get(`/training/assignments/${id}/`),

  // Employee actions
  getMyTrainings: (params) => api.get('/training/assignments/my_trainings/', { params }),
  startTraining: (id) => api.post(`/training/assignments/${id}/start/`),
  viewContent: (id, data) => api.post(`/training/assignments/${id}/view_content/`, data),
  getQuiz: (id) => api.get(`/training/assignments/${id}/quiz/`),
  submitQuiz: (id, answers) => api.post(`/training/assignments/${id}/submit_quiz/`, { answers }),

  // Admin actions
  bulkAssign: (data) => api.post('/training/assignments/bulk_assign/', data),
  getPending: (params) => api.get('/training/assignments/pending/', { params }),
  getOverdue: (params) => api.get('/training/assignments/overdue/', { params }),

  // Risk scores
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
