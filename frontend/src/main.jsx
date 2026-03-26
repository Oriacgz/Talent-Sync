import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import './index.css'
import AppShell from './components/AppShell.jsx'
import App from './App.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import AppLayout from './components/shared/AppLayout.jsx'
import ErrorBoundary from './components/shared/ErrorBoundary.jsx'
import ProtectedRoute from './components/shared/ProtectedRoute.jsx'
import RoleRedirect from './components/shared/RoleRedirect.jsx'
import ScrollToTop from './components/shared/ScrollToTop.jsx'
import { ToastProvider } from './components/shared/ToastProvider.jsx'
import { MatchAliasRedirect, RouteFallback } from './router/RouteHelpers.jsx'

const StudentDashboardPage = lazy(() => import('./components/student/DashboardPage.jsx'))
const StudentProfilePage = lazy(() => import('./components/student/ProfilePage.jsx'))
const StudentApplicationsPage = lazy(() => import('./components/student/ApplicationsPage.jsx'))
const StudentMatchDetailPage = lazy(() => import('./components/student/MatchDetailPage.jsx'))
const StudentOnboardingPage = lazy(() => import('./components/student/OnboardingPage.jsx'))

const RecruiterDashboardPage = lazy(() => import('./components/recruiter/DashboardPage.jsx'))
const RecruiterPostJobPage = lazy(() => import('./components/recruiter/PostJobPage.jsx'))
const RecruiterCandidatesPage = lazy(() => import('./components/recruiter/CandidatesPage.jsx'))
const RecruiterCandidateDetailPage = lazy(() => import('./components/recruiter/CandidateDetailPage.jsx'))
const RecruiterAnalyticsPage = lazy(() => import('./components/recruiter/AnalyticsPage.jsx'))
const HowMatchingWorksPage = lazy(() => import('./pages/HowMatchingWorksPage.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ScrollToTop />
        <AppShell>
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
              <Route path="/" element={<App />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route element={<ProtectedRoute requiredRole="STUDENT" />}>
                    <Route path="/student/dashboard" element={<StudentDashboardPage />} />
                    <Route path="/student/profile" element={<StudentProfilePage />} />
                    <Route path="/student/matches" element={<StudentDashboardPage />} />
                    <Route path="/student/applications" element={<StudentApplicationsPage />} />
                    <Route path="/student/match/:id" element={<StudentMatchDetailPage />} />
                    <Route path="/student/onboarding" element={<StudentOnboardingPage />} />
                  </Route>

                  <Route element={<ProtectedRoute requiredRole="RECRUITER" />}>
                    <Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
                    <Route path="/recruiter/post-job" element={<RecruiterPostJobPage />} />
                    <Route path="/recruiter/candidates" element={<RecruiterCandidatesPage />} />
                    <Route path="/recruiter/candidates/:id" element={<RecruiterCandidateDetailPage />} />
                    <Route path="/recruiter/analytics" element={<RecruiterAnalyticsPage />} />
                  </Route>

                  <Route path="/how-matching-works" element={<HowMatchingWorksPage />} />
                </Route>
              </Route>

              <Route path="/dashboard" element={<RoleRedirect />} />
              <Route path="/profile" element={<Navigate to="/student/profile" replace />} />
              <Route path="/matches" element={<Navigate to="/student/matches" replace />} />
              <Route path="/applications" element={<Navigate to="/student/applications" replace />} />
              <Route path="/match/:id" element={<MatchAliasRedirect />} />

              <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AppShell>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
