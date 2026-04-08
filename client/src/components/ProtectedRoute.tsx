import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { useGetMe } from '@/hooks/useAuth';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <svg
      className="h-8 w-8 animate-spin text-blue-600"
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
  </div>
);

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isLoading } = useGetMe();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <Spinner />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
