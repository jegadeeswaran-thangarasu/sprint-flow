import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useOrgMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/hooks/useOrganisation';
import useOrgStore from '@/store/orgStore';
import useAuthStore from '@/store/authStore';
import { IOrgMember, OrgRole } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { transferOwnership } from '@/api/organisationApi';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/utils/constants';

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['admin', 'member']),
});

type TInviteForm = z.infer<typeof inviteSchema>;

const roleBadgeClasses: Record<OrgRole, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-gray-100 text-gray-600',
};

const statusBadgeClasses: Record<IOrgMember['status'], string> = {
  active: 'bg-green-100 text-green-700',
  invited: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
};

const UserAvatar = ({ name, avatar }: { name: string; avatar?: string }) => {
  if (avatar) {
    return (
      <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
    );
  }
  const initial = name?.[0]?.toUpperCase() ?? '?';
  return (
    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <span className="text-blue-700 text-xs font-semibold">{initial}</span>
    </div>
  );
};

const ConfirmDialog = ({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </div>
);

const MemberActionsDropdown = ({
  member,
  currentUserRole,
  currentUserId,
  orgSlug,
}: {
  member: IOrgMember;
  currentUserRole: OrgRole | undefined;
  currentUserId: string | undefined;
  orgSlug: string;
}) => {
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { mutate: updateRole } = useUpdateMemberRole(orgSlug);
  const { mutate: removeMemberMutation, isPending: isRemoving } = useRemoveMember(orgSlug);

  const memberId = member.user?._id ?? '';
  const memberName = member.user?.name ?? member.email;

  const canManage =
    currentUserRole === 'owner' || currentUserRole === 'admin';
  const isOwner = member.role === 'owner';
  const isSelf = currentUserId === memberId;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!canManage || isOwner || isSelf) return null;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
            {member.role !== 'admin' && (
              <button
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  updateRole({ userId: memberId, role: 'admin' });
                  setOpen(false);
                }}
              >
                Make admin
              </button>
            )}
            {member.role !== 'member' && (
              <button
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  updateRole({ userId: memberId, role: 'member' });
                  setOpen(false);
                }}
              >
                Make member
              </button>
            )}
            {currentUserRole === 'owner' && (
              <button
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                onClick={() => {
                  setOpen(false);
                  setConfirmTransfer(true);
                }}
              >
                Transfer ownership
              </button>
            )}
            <div className="h-px bg-gray-100 my-1" />
            <button
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={() => {
                setOpen(false);
                setConfirmRemove(true);
              }}
            >
              Remove from org
            </button>
          </div>
        )}
      </div>

      {confirmRemove && (
        <ConfirmDialog
          title="Remove member"
          message={`Are you sure you want to remove ${memberName} from this organisation?`}
          confirmLabel={isRemoving ? 'Removing…' : 'Remove'}
          danger
          onConfirm={() => {
            removeMemberMutation(memberId, { onSuccess: () => setConfirmRemove(false) });
          }}
          onCancel={() => setConfirmRemove(false)}
        />
      )}

      {confirmTransfer && (
        <ConfirmDialog
          title="Transfer ownership"
          message={`Transfer ownership of this organisation to ${memberName}? You will become an admin.`}
          confirmLabel="Transfer"
          danger
          onConfirm={async () => {
            await transferOwnership(orgSlug, memberId);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORG_MEMBERS(orgSlug) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORGANISATION(orgSlug) });
            setConfirmTransfer(false);
          }}
          onCancel={() => setConfirmTransfer(false)}
        />
      )}
    </>
  );
};

const MemberRow = ({
  member,
  currentUserRole,
  currentUserId,
  orgSlug,
}: {
  member: IOrgMember;
  currentUserRole: OrgRole | undefined;
  currentUserId: string | undefined;
  orgSlug: string;
}) => {
  const displayName = member.user?.name ?? '—';
  const displayEmail = member.user?.email ?? member.email;
  const joinedDate = member.joinedAt
    ? new Date(member.joinedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={displayName} avatar={member.user?.avatar} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
            roleBadgeClasses[member.role]
          }`}
        >
          {member.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
            statusBadgeClasses[member.status]
          }`}
        >
          {member.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{joinedDate}</td>
      <td className="px-4 py-3 text-right">
        <MemberActionsDropdown
          member={member}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          orgSlug={orgSlug}
        />
      </td>
    </tr>
  );
};

const TableSkeleton = () => (
  <div className="flex flex-col gap-2 mt-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
    ))}
  </div>
);

const OrgMembersPage = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const slug = orgSlug ?? '';

  const currentOrg = useOrgStore((state) => state.currentOrg);
  const currentUser = useAuthStore((state) => state.user);
  const currentUserRole = currentOrg?.myRole;

  const { data: members, isLoading } = useOrgMembers(slug);
  const { mutate: invite, isPending: isInviting, data: inviteResult, reset } = useInviteMember(slug);
  const [copiedLink, setCopiedLink] = useState(false);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<TInviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'member' },
  });

  const canInvite = currentUserRole === 'owner' || currentUserRole === 'admin';

  const activeMembers = members?.filter((m) => m.status !== 'invited') ?? [];
  const pendingInvites = members?.filter((m) => m.status === 'invited') ?? [];

  const onInvite = (values: TInviteForm) => {
    invite(
      { email: values.email, role: values.role as OrgRole },
      {
        onSuccess: () => {
          resetForm();
        },
      },
    );
  };

  const handleCopyLink = () => {
    if (inviteResult?.inviteLink) {
      navigator.clipboard.writeText(inviteResult.inviteLink).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">Members</h1>
        {members && (
          <span className="text-sm font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
            {members.length}
          </span>
        )}
      </div>

      {canInvite && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Invite a teammate</h2>
          <form onSubmit={handleSubmit(onInvite)} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                id="invite-email"
                placeholder="colleague@company.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <div className="flex-shrink-0">
              <select
                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('role')}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button type="submit" isLoading={isInviting} className="flex-shrink-0">
              Send invite
            </Button>
          </form>

          {inviteResult?.inviteLink && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Share this link with your teammate
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-blue-800 bg-blue-100 rounded px-2 py-1.5 truncate font-mono">
                  {inviteResult.inviteLink}
                </code>
                <button
                  onClick={handleCopyLink}
                  className="flex-shrink-0 text-xs font-medium text-blue-700 border border-blue-300 rounded px-3 py-1.5 hover:bg-blue-100 transition-colors"
                >
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <button
                onClick={() => reset()}
                className="mt-2 text-xs text-blue-500 hover:text-blue-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Active members</h2>
        </div>

        {isLoading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : activeMembers.length === 0 ? (
          <p className="text-sm text-gray-400 px-4 py-6 text-center">No active members yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                    User
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Joined
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {activeMembers.map((member) => (
                  <MemberRow
                    key={member._id}
                    member={member}
                    currentUserRole={currentUserRole}
                    currentUserId={currentUser?._id}
                    orgSlug={slug}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingInvites.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Pending invites{' '}
              <span className="text-gray-400 font-normal">({pendingInvites.length})</span>
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingInvites.map((invite) => (
              <div key={invite._id} className="px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="h-4 w-4 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{invite.email}</p>
                  <p className="text-xs text-gray-400">
                    Invited by {invite.invitedBy} ·{' '}
                    <span className="capitalize">{invite.role}</span>
                  </p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgMembersPage;
