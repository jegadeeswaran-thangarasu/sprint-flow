import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import Organisation, { IOrganisationDocument } from '../models/Organisation';
import OrgMember, { IOrgMemberDocument } from '../models/OrgMember';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import { OrgRole } from '../types';
import { BCRYPT_ROUNDS } from '../constants/auth';

const INVITE_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Helpers ────────────────────────────────────────────────────────────────

async function resolveOrgBySlug(slug: string): Promise<IOrganisationDocument> {
  const org = await Organisation.findOne({ slug, isActive: true });
  if (!org) throw new ApiError(404, 'Organisation not found');
  return org;
}

async function requireActiveMember(
  orgId: Types.ObjectId,
  userId: string
): Promise<IOrgMemberDocument> {
  const member = await OrgMember.findOne({
    organisation: orgId,
    user: new Types.ObjectId(userId),
    status: 'active',
  });
  if (!member) throw new ApiError(403, 'You are not an active member of this organisation');
  return member;
}

async function requireOwnerOrAdmin(
  orgId: Types.ObjectId,
  userId: string
): Promise<IOrgMemberDocument> {
  const member = await requireActiveMember(orgId, userId);
  if (member.role !== 'owner' && member.role !== 'admin') {
    throw new ApiError(403, 'Owner or admin access required');
  }
  return member;
}

async function requireOwner(
  orgId: Types.ObjectId,
  userId: string
): Promise<IOrgMemberDocument> {
  const member = await requireActiveMember(orgId, userId);
  if (member.role !== 'owner') throw new ApiError(403, 'Owner access required');
  return member;
}

async function ensureUniqueSlug(candidate: string): Promise<string> {
  let slug = candidate;
  let exists = await Organisation.findOne({ slug });
  while (exists) {
    slug = Organisation.generateSlug(slug.replace(/-[a-z0-9]{4}$/, ''));
    exists = await Organisation.findOne({ slug });
  }
  return slug;
}

// ─── Service Functions ───────────────────────────────────────────────────────

export interface TCreateOrgResult {
  organisation: IOrganisationDocument;
  memberCount: number;
}

export const createOrganisation = async (
  userId: string,
  name: string,
  description?: string
): Promise<TCreateOrgResult> => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const rawSlug = Organisation.generateSlug(name);
  const slug = await ensureUniqueSlug(rawSlug);

  const org = new Organisation({
    name,
    slug,
    description,
    owner: new Types.ObjectId(userId),
  });
  await org.save();

  await OrgMember.create({
    organisation: org._id,
    user: new Types.ObjectId(userId),
    email: user.email,
    role: 'owner',
    status: 'active',
    invitedBy: new Types.ObjectId(userId),
    joinedAt: new Date(),
  });

  return { organisation: org, memberCount: 1 };
};

export interface TOrgWithRole {
  organisation: IOrganisationDocument;
  role: OrgRole;
}

export const getUserOrganisations = async (userId: string): Promise<TOrgWithRole[]> => {
  const memberships = await OrgMember.find({
    user: new Types.ObjectId(userId),
    status: 'active',
  }).populate<{ organisation: IOrganisationDocument }>('organisation');

  return memberships
    .filter((m) => m.organisation && (m.organisation as IOrganisationDocument).isActive)
    .map((m) => ({
      organisation: m.organisation as IOrganisationDocument,
      role: m.role,
    }));
};

export interface TOrgDetail {
  organisation: IOrganisationDocument;
  memberCount: number;
  role: OrgRole;
}

export const getOrganisationBySlug = async (
  slug: string,
  userId: string
): Promise<TOrgDetail> => {
  const org = await resolveOrgBySlug(slug);
  const member = await requireActiveMember(org._id, userId);
  const memberCount = await OrgMember.countDocuments({
    organisation: org._id,
    status: 'active',
  });

  return { organisation: org, memberCount, role: member.role };
};

export const updateOrganisation = async (
  orgSlug: string,
  userId: string,
  updates: { name?: string; description?: string; logo?: string }
): Promise<IOrganisationDocument> => {
  const org = await resolveOrgBySlug(orgSlug);
  await requireOwnerOrAdmin(org._id, userId);

  const allowedUpdates: Partial<{ name: string; description: string; logo: string }> = {};
  if (updates.name !== undefined) allowedUpdates.name = updates.name;
  if (updates.description !== undefined) allowedUpdates.description = updates.description;
  if (updates.logo !== undefined) allowedUpdates.logo = updates.logo;

  const updated = await Organisation.findByIdAndUpdate(org._id, allowedUpdates, { new: true });
  if (!updated) throw new ApiError(500, 'Failed to update organisation');
  return updated;
};

export const deleteOrganisation = async (orgSlug: string, userId: string): Promise<void> => {
  const org = await resolveOrgBySlug(orgSlug);
  await requireOwner(org._id, userId);
  await Organisation.findByIdAndUpdate(org._id, { isActive: false });
};

export interface TInviteResult {
  inviteToken: string;
  inviteLink: string;
}

export const inviteMember = async (
  orgSlug: string,
  invitedByUserId: string,
  email: string,
  role: OrgRole
): Promise<TInviteResult> => {
  const org = await resolveOrgBySlug(orgSlug);
  await requireOwnerOrAdmin(org._id, invitedByUserId);

  const normalizedEmail = email.toLowerCase();

  const existing = await OrgMember.findOne({
    organisation: org._id,
    email: normalizedEmail,
  });

  if (existing) {
    if (existing.status === 'active') {
      throw new ApiError(409, 'This email is already an active member of the organisation');
    }
    if (existing.status === 'invited') {
      throw new ApiError(409, 'A pending invite already exists for this email');
    }
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);

  await OrgMember.create({
    organisation: org._id,
    user: null,
    email: normalizedEmail,
    role,
    status: 'invited',
    inviteToken: hashedToken,
    inviteTokenExpiry: new Date(Date.now() + INVITE_TOKEN_EXPIRY_MS),
    invitedBy: new Types.ObjectId(invitedByUserId),
  });

  return {
    inviteToken: rawToken,
    inviteLink: `/invite/accept?token=${rawToken}`,
  };
};

export const acceptInvite = async (
  rawToken: string,
  userId: string
): Promise<IOrganisationDocument> => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const pendingInvites = await OrgMember.find({
    email: user.email.toLowerCase(),
    status: 'invited',
    inviteTokenExpiry: { $gt: new Date() },
  });

  if (pendingInvites.length === 0) {
    throw new ApiError(404, 'No valid invite found for your account');
  }

  let matchedMember: IOrgMemberDocument | null = null;
  for (const invite of pendingInvites) {
    if (!invite.inviteToken) continue;
    const isMatch = await bcrypt.compare(rawToken, invite.inviteToken);
    if (isMatch) {
      matchedMember = invite;
      break;
    }
  }

  if (!matchedMember) {
    throw new ApiError(400, 'Invalid or expired invite token');
  }

  matchedMember.user = new Types.ObjectId(userId);
  matchedMember.status = 'active';
  matchedMember.joinedAt = new Date();
  matchedMember.inviteToken = undefined;
  matchedMember.inviteTokenExpiry = undefined;
  await matchedMember.save();

  const org = await Organisation.findById(matchedMember.organisation);
  if (!org) throw new ApiError(404, 'Organisation not found');
  return org;
};

export interface TOrgMemberDetail {
  member: IOrgMemberDocument;
  user?: { name: string; email: string; avatar: string };
}

export const getOrgMembers = async (
  orgSlug: string,
  requestingUserId: string
): Promise<IOrgMemberDocument[]> => {
  const org = await resolveOrgBySlug(orgSlug);
  await requireActiveMember(org._id, requestingUserId);

  const members = await OrgMember.find({ organisation: org._id }).populate(
    'user',
    'name email avatar'
  );

  return members;
};

export const updateMemberRole = async (
  orgSlug: string,
  targetUserId: string,
  newRole: OrgRole,
  requestingUserId: string
): Promise<IOrgMemberDocument> => {
  const org = await resolveOrgBySlug(orgSlug);
  await requireOwnerOrAdmin(org._id, requestingUserId);

  const targetMember = await OrgMember.findOne({
    organisation: org._id,
    user: new Types.ObjectId(targetUserId),
  });
  if (!targetMember) throw new ApiError(404, 'Member not found in this organisation');

  if (targetMember.role === 'owner') {
    throw new ApiError(403, "Cannot change the owner's role — use transfer ownership instead");
  }

  if (newRole === 'owner') {
    throw new ApiError(403, 'Cannot promote to owner — use transfer ownership instead');
  }

  targetMember.role = newRole;
  await targetMember.save();
  return targetMember;
};

export const removeMember = async (
  orgSlug: string,
  targetUserId: string,
  requestingUserId: string
): Promise<void> => {
  const org = await resolveOrgBySlug(orgSlug);
  await requireOwnerOrAdmin(org._id, requestingUserId);

  const targetMember = await OrgMember.findOne({
    organisation: org._id,
    user: new Types.ObjectId(targetUserId),
  });
  if (!targetMember) throw new ApiError(404, 'Member not found in this organisation');

  if (targetMember.role === 'owner') {
    throw new ApiError(403, 'Cannot remove the organisation owner');
  }

  await OrgMember.findByIdAndDelete(targetMember._id);
};

export const transferOwnership = async (
  orgSlug: string,
  newOwnerId: string,
  currentOwnerId: string
): Promise<void> => {
  const org = await resolveOrgBySlug(orgSlug);
  await requireOwner(org._id, currentOwnerId);

  const newOwnerMember = await OrgMember.findOne({
    organisation: org._id,
    user: new Types.ObjectId(newOwnerId),
    status: 'active',
  });
  if (!newOwnerMember) throw new ApiError(404, 'New owner must be an active member of the organisation');

  const currentOwnerMember = await OrgMember.findOne({
    organisation: org._id,
    user: new Types.ObjectId(currentOwnerId),
  });
  if (!currentOwnerMember) throw new ApiError(500, 'Current owner member record not found');

  currentOwnerMember.role = 'admin';
  newOwnerMember.role = 'owner';

  await Promise.all([
    currentOwnerMember.save(),
    newOwnerMember.save(),
    Organisation.findByIdAndUpdate(org._id, { owner: new Types.ObjectId(newOwnerId) }),
  ]);
};
