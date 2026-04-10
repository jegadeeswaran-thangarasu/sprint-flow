import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAcceptInvite } from '@/hooks/useOrganisation';
import useAuthStore from '@/store/authStore';

const INVITE_TOKEN_KEY = 'sf_pending_invite_token';

const Spinner = () => (
  <div className="flex flex-col items-center gap-4">
    <svg
      className="h-10 w-10 animate-spin text-blue-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <p className="text-sm text-gray-500">Processing your invitation…</p>
  </div>
);

const AcceptInvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { mutate: acceptInvite, isPending, isSuccess, isError, error, data: org } = useAcceptInvite();

  useEffect(() => {
    if (!token) return;

    if (!isAuthenticated) {
      localStorage.setItem(INVITE_TOKEN_KEY, token);
      navigate('/login', { replace: true });
      return;
    }

    acceptInvite(token);
  }, [token, isAuthenticated, acceptInvite, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">SprintFlow</span>
          </div>
        </div>

        {isPending && <Spinner />}

        {isSuccess && org && (
          <div className="flex flex-col items-center gap-5">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="h-7 w-7 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                You&apos;ve joined {org.name}!
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Your workspace is ready. Let&apos;s get started.
              </p>
            </div>
            <button
              onClick={() => navigate(`/org/${org.slug}/dashboard`)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to projects
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-5">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="h-7 w-7 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Invite failed</h1>
              <p className="text-sm text-gray-500 mt-1">
                {error?.message ?? 'This invite link is invalid or has expired.'}
              </p>
            </div>
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Back to login
            </Link>
          </div>
        )}

        {!token && (
          <div>
            <p className="text-sm text-gray-500">Invalid invite link.</p>
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export { INVITE_TOKEN_KEY };
export default AcceptInvitePage;
