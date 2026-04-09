import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useParams, useMatch, Link } from 'react-router-dom';
import useOrgStore from '@/store/orgStore';
import useAuthStore from '@/store/authStore';
import useProjectStore from '@/store/projectStore';
import { useLogout } from '@/hooks/useAuth';
import { IOrganisation } from '@/types';

const OrgInitialAvatar = ({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const sizeClass = size === 'md' ? 'h-8 w-8 text-sm' : 'h-6 w-6 text-xs';
  return (
    <div
      className={`${sizeClass} rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0`}
    >
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
};

const OrgSwitcher = ({ currentOrg }: { currentOrg: IOrganisation | null }) => {
  const [open, setOpen] = useState(false);
  const myOrgs = useOrgStore((state) => state.myOrgs);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
      >
        {currentOrg ? (
          currentOrg.logo ? (
            <img
              src={currentOrg.logo}
              alt={currentOrg.name}
              className="h-6 w-6 rounded-md object-cover flex-shrink-0"
            />
          ) : (
            <OrgInitialAvatar name={currentOrg.name} />
          )
        ) : (
          <div className="h-6 w-6 rounded-md bg-gray-200 flex-shrink-0" />
        )}
        <span className="flex-1 text-left text-sm font-semibold text-gray-900 truncate">
          {currentOrg?.name ?? 'Select workspace'}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
          <p className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Workspaces
          </p>
          {myOrgs.map((org) => (
            <button
              key={org._id}
              onClick={() => {
                navigate(`/org/${org.slug}/projects`);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                org.slug === currentOrg?.slug ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              {org.logo ? (
                <img src={org.logo} alt={org.name} className="h-5 w-5 rounded object-cover" />
              ) : (
                <OrgInitialAvatar name={org.name} />
              )}
              <span className="flex-1 text-left truncate font-medium">{org.name}</span>
              {org.myRole && (
                <span className="text-xs text-gray-400 capitalize">{org.myRole}</span>
              )}
            </button>
          ))}
          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={() => {
              navigate('/onboarding');
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create new workspace
          </button>
        </div>
      )}
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const NavItem = ({ to, icon, label, badge }: NavItemProps) => (
  <NavLink
    to={to}
    end={label === 'Projects'}
    className={({ isActive }) =>
      [
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      ].join(' ')
    }
  >
    {icon}
    <span className="flex-1">{label}</span>
    {badge !== undefined && (
      <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        {badge}
      </span>
    )}
  </NavLink>
);

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { mutate: logout } = useLogout();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const initial = user?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 text-xs font-semibold">{initial}</span>
          </div>
        )}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

const OrgLayout = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const { projects, currentProject } = useProjectStore();
  const canViewSettings =
    currentOrg?.myRole === 'owner' || currentOrg?.myRole === 'admin';

  const slug = orgSlug ?? '';

  // Detect if we're inside a specific project route
  const insideProject = useMatch('/org/:orgSlug/projects/:projectId/*');

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 flex-shrink-0 flex flex-col bg-white border-r border-gray-200">
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2 px-1 py-1 mb-1">
            <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">SprintFlow</span>
          </div>
          <OrgSwitcher currentOrg={currentOrg} />
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          <NavItem
            to={`/org/${slug}/projects`}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            }
            label="Projects"
            badge={projects.length > 0 ? projects.length : undefined}
          />

          {/* Project context — shown when inside a project route */}
          {insideProject && currentProject && (
            <div className="mt-1 ml-1 pl-3 border-l-2 border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 pt-1 pb-0.5">
                Current project
              </p>
              <Link
                to={`/org/${slug}/projects/${currentProject._id}/board`}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base leading-none">{currentProject.icon || '📁'}</span>
                <span className="truncate">{currentProject.name}</span>
              </Link>
              <Link
                to={`/org/${slug}/projects`}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                All projects
              </Link>
            </div>
          )}
          <NavItem
            to={`/org/${slug}/members`}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Members"
          />
          {canViewSettings && (
            <NavItem
              to={`/org/${slug}/settings`}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              label="Settings"
            />
          )}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <UserMenu />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OrgLayout;
