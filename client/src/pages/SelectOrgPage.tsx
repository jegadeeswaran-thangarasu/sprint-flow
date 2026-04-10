import { useNavigate } from 'react-router-dom';
import { useMyOrganisations } from '@/hooks/useOrganisation';
import { IOrganisation } from '@/types';

const roleBadgeClasses: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-gray-100 text-gray-600',
};

const OrgInitialAvatar = ({ name }: { name: string }) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-lg font-bold">{initials}</span>
    </div>
  );
};

const OrgCard = ({ org }: { org: IOrganisation }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all group">
      {org.logo ? (
        <img
          src={org.logo}
          alt={org.name}
          className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <OrgInitialAvatar name={org.name} />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 truncate">{org.name}</span>
          {org.myRole && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                roleBadgeClasses[org.myRole] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {org.myRole}
            </span>
          )}
        </div>
        {org.memberCount !== undefined && (
          <p className="text-sm text-gray-400 mt-0.5">
            {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
          </p>
        )}
      </div>

      <button
        onClick={() => navigate(`/org/${org.slug}/dashboard`)}
        className="flex-shrink-0 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
      >
        Open
      </button>
    </div>
  );
};

const SelectOrgPage = () => {
  const navigate = useNavigate();
  const { data: orgs, isLoading } = useMyOrganisations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
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
          <h1 className="text-2xl font-bold text-gray-900">Choose a workspace</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Select an organisation to continue
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orgs?.map((org) => <OrgCard key={org._id} org={org} />)}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/onboarding')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors inline-flex items-center gap-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create a new workspace
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectOrgPage;
