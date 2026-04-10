import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import useOrgStore from '@/store/orgStore';
import { getMe } from '@/api/authApi';
import { getMyOrganisations } from '@/api/organisationApi';
import FullPageSpinner from '@/components/ui/FullPageSpinner';

const ProtectedRoute = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const { setMyOrgs } = useOrgStore();

  useEffect(() => {
    const initialize = async () => {
      // Not logged in — nothing to restore, proceed immediately
      if (!isAuthenticated) {
        setIsInitialized(true);
        return;
      }

      try {
        // getMe triggers the 401 → /auth/refresh interceptor when accessToken
        // is null (e.g. after page refresh), so the session is silently restored
        const user = await getMe();
        const orgs = await getMyOrganisations();
        setMyOrgs(orgs);
        // Preserve the refreshed accessToken that the interceptor put in the store
        setAuth(user, useAuthStore.getState().accessToken ?? '');
      } catch {
        // Refresh token expired or invalid — force re-login
        clearAuth();
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isInitialized) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
