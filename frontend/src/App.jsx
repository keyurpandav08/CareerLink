import React from 'react';
import './index.css';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoleRoute from './components/PublicRoleRoute';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';
import Dashboard from './pages/Dashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import CreateJob from './pages/CreateJob';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import SavedJobs from "./pages/SavedJobs";
import EditProfile from "./pages/EditProfile";
import Profile from "./pages/Profile";
import Applications from "./pages/Applications";
import Settings from "./pages/Settings";
import Contact from "./pages/Contact";
import CareerAdvice from "./pages/CareerAdvice";
import ResumeBuilder from "./pages/ResumeBuilder";
import InterviewTips from "./pages/InterviewTips";
import TalentSearch from "./pages/TalentSearch";
import Pricing from "./pages/Pricing";
import ForgotPassword from './pages/ForgotPassword';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/admin/login"
              element={
                <PublicRoleRoute guestOnly>
                  <AdminLogin />
                </PublicRoleRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="ADMIN" redirectTo="/admin/login">
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute role="ADMIN" redirectTo="/admin/login">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Layout Wrapper */}
            <Route path="/" element={<Layout />}>

              {/* Public Pages */}
              <Route index element={<Home />} />
              <Route
                path="login"
                element={
                  <PublicRoleRoute guestOnly>
                    <Login />
                  </PublicRoleRoute>
                }
              />
              <Route
                path="register"
                element={
                  <PublicRoleRoute guestOnly>
                    <Register />
                  </PublicRoleRoute>
                }
              />
              <Route
                path="jobs"
                element={
                  <PublicRoleRoute allowGuests allowedRoles={['APPLICANT']}>
                    <JobList />
                  </PublicRoleRoute>
                }
              />
              <Route
                path="jobs/:id"
                element={
                  <PublicRoleRoute allowGuests allowedRoles={['APPLICANT']}>
                    <JobDetail />
                  </PublicRoleRoute>
                }
              />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="contact" element={<Contact />} />
              <Route path="career-advice" element={<CareerAdvice />} />
              <Route
                path="resume-builder"
                element={
                  <ProtectedRoute role="APPLICANT">
                    <ResumeBuilder />
                  </ProtectedRoute>
                }
              />
              <Route path="interview-tips" element={<InterviewTips />} />
              <Route path="talent-search" element={<TalentSearch />} />
              <Route path="pricing" element={<Pricing />} />
              <Route
                path="forgot-password"
                element={
                  <PublicRoleRoute guestOnly>
                    <ForgotPassword />
                  </PublicRoleRoute>
                }
              />

              {/* Protected Pages */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute role="APPLICANT">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employer-dashboard"
                element={
                  <ProtectedRoute role="EMPLOYER">
                    <EmployerDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="profile"
                element={
                  <ProtectedRoute role="APPLICANT">
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="edit-profile"
                element={
                  <ProtectedRoute role="APPLICANT">
                    <EditProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="applications"
                element={
                  <ProtectedRoute>
                    <Applications />
                  </ProtectedRoute>
                }
              />

              <Route
                path="settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              <Route
                path="saved-jobs"
                element={
                  <ProtectedRoute role="APPLICANT">
                    <SavedJobs />
                  </ProtectedRoute>
                }
              />

              <Route
                path="post-job"
                element={
                  <ProtectedRoute role="EMPLOYER">
                    <CreateJob />
                  </ProtectedRoute>
                }
              />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />

            </Route>

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
