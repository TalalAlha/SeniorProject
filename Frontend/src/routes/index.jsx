import { createBrowserRouter, Navigate } from 'react-router-dom';
import { USER_ROLES } from '../contexts';
import { ProtectedRoute, PublicRoute, GuestRoute } from './ProtectedRoute';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Public Pages
import PublicHome from '../pages/public/PublicHome';
import TrainingTopics from '../pages/public/TrainingTopics';
import TopicTraining from '../pages/public/TopicTraining';
import PublicQuiz from '../pages/public/PublicQuiz';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import CommunityPortal from '../pages/public/CommunityPortal';
import UnauthorizedPage from '../pages/public/UnauthorizedPage';
import NotFoundPage from '../pages/public/NotFoundPage';

// Employee Pages
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import EmployeeQuizzes from '../pages/employee/EmployeeQuizzes';
import TakeQuiz from '../pages/employee/TakeQuiz';
import EmployeeTraining from '../pages/employee/EmployeeTraining';
import TakeTraining from '../pages/employee/TakeTraining';
import EmployeeBadges from '../pages/employee/EmployeeBadges';
import EmployeeLeaderboard from '../pages/employee/EmployeeLeaderboard';
import EmployeeProfile from '../pages/employee/EmployeeProfile';

// Company Admin Pages
import CompanyDashboard from '../pages/company/CompanyDashboard';
import CampaignList from '../pages/company/CampaignList';
import CampaignCreate from '../pages/company/CampaignCreate';
import CampaignDetails from '../pages/company/CampaignDetails';
import CompanySimulations from '../pages/company/CompanySimulations';
import CompanyEmployees from '../pages/company/CompanyEmployees';
import CompanyAnalytics from '../pages/company/CompanyAnalytics';
import CompanyProfile from '../pages/company/CompanyProfile';
import TrainingManagement from '../pages/company/TrainingManagement';

// Super Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import CompanyList from '../pages/admin/CompanyList';
import CompanyCreate from '../pages/admin/CompanyCreate';
import PlatformAnalytics from '../pages/admin/PlatformAnalytics';
import UserManagement from '../pages/admin/UserManagement';

// Router configuration
const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: (
      <GuestRoute>
        <PublicLayout />
      </GuestRoute>
    ),
    children: [
      { index: true, element: <PublicHome /> },
      { path: 'training', element: <TrainingTopics /> },
      { path: 'training/:topic', element: <TopicTraining /> },
      { path: 'quiz', element: <PublicQuiz /> },
      { path: 'community', element: <CommunityPortal /> },
    ],
  },

  // Auth routes (redirect if already logged in)
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },

  // Employee routes
  {
    path: '/employee',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.EMPLOYEE]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <EmployeeDashboard /> },
      { path: 'quizzes', element: <EmployeeQuizzes /> },
      { path: 'quizzes/:id', element: <TakeQuiz /> },
      { path: 'training', element: <EmployeeTraining /> },
      { path: 'training/:id', element: <TakeTraining /> },
      { path: 'badges', element: <EmployeeBadges /> },
      { path: 'leaderboard', element: <EmployeeLeaderboard /> },
      { path: 'profile', element: <EmployeeProfile /> },
    ],
  },

  // Company Admin routes
  {
    path: '/company',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.COMPANY_ADMIN]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <CompanyDashboard /> },
      { path: 'campaigns', element: <CampaignList /> },
      { path: 'campaigns/create', element: <CampaignCreate /> },
      { path: 'campaigns/:id', element: <CampaignDetails /> },
      { path: 'simulations', element: <CompanySimulations /> },
      { path: 'employees', element: <CompanyEmployees /> },
      { path: 'training', element: <TrainingManagement /> },
      { path: 'analytics', element: <CompanyAnalytics /> },
      { path: 'profile', element: <CompanyProfile /> },
    ],
  },

  // Super Admin routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'companies', element: <CompanyList /> },
      { path: 'companies/create', element: <CompanyCreate /> },
      { path: 'analytics', element: <PlatformAnalytics /> },
      { path: 'users', element: <UserManagement /> },
      { path: 'profile', element: <EmployeeProfile /> },
    ],
  },

  // Error pages
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <NotFoundPage /> },
]);

export default router;
