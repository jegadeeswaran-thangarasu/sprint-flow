import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import OrgRoute from '@/components/layout/OrgRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import OnboardingPage from '@/pages/OnboardingPage';
import SelectOrgPage from '@/pages/SelectOrgPage';
import OrgMembersPage from '@/pages/OrgMembersPage';
import AcceptInvitePage from '@/pages/AcceptInvitePage';
import ProjectsPage from '@/pages/ProjectsPage';
import BoardPage from '@/pages/BoardPage';
import BacklogPage from '@/pages/BacklogPage';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64">
    <p className="text-gray-400 text-sm">{title} — coming soon</p>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/select-org" replace />} />

        {/* Public — no auth required */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/invite/:token" element={<AcceptInvitePage />} />

        {/* Auth-required — ProtectedRoute initializes session + org list */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/select-org" element={<SelectOrgPage />} />

          {/* Org-scoped — OrgRoute handles org loading and layout */}
          <Route path="/org/:orgSlug" element={<OrgRoute />}>
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId/board" element={<BoardPage />} />
            <Route path="projects/:projectId/backlog" element={<BacklogPage />} />
            <Route path="members" element={<OrgMembersPage />} />
            <Route path="settings" element={<PlaceholderPage title="Org Settings" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
