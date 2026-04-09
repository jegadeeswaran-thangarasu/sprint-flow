import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import useOrgStore from '@/store/orgStore';
import { getOrganisationBySlug } from '@/api/organisationApi';
import OrgLayout from '@/components/layout/OrgLayout';
import FullPageSpinner from '@/components/ui/FullPageSpinner';

const ForbiddenPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
    <div className="text-6xl font-black text-gray-200">403</div>
    <h1 className="text-xl font-semibold text-gray-700">Access denied</h1>
    <p className="text-sm text-gray-400 text-center max-w-xs">
      You don&apos;t have permission to access this organisation, or it doesn&apos;t exist.
    </p>
    <a
      href="/select-org"
      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
    >
      Back to workspaces
    </a>
  </div>
);

const OrgRoute = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { myOrgs, currentOrg, setCurrentOrg } = useOrgStore();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!orgSlug) return;

    // Already have the right org loaded — no fetch needed
    if (currentOrg?.slug === orgSlug) return;

    setIsFetching(true);
    setFetchError(false);

    getOrganisationBySlug(orgSlug)
      .then((org) => {
        setCurrentOrg(org);
        setIsFetching(false);
      })
      .catch(() => {
        setFetchError(true);
        setIsFetching(false);
      });
  }, [orgSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (myOrgs.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  if (fetchError) {
    return <ForbiddenPage />;
  }

  // Slug changed and org hasn't loaded yet — hold the spinner
  if (isFetching || (orgSlug && currentOrg && currentOrg.slug !== orgSlug)) {
    return <FullPageSpinner />;
  }

  return <OrgLayout />;
};

export default OrgRoute;
