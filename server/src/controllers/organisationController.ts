import { Request, Response, NextFunction } from 'express';
import {
  createOrganisation as createOrganisationService,
  getUserOrganisations as getUserOrganisationsService,
  getOrganisationBySlug as getOrganisationBySlugService,
  updateOrganisation as updateOrganisationService,
  deleteOrganisation as deleteOrganisationService,
  inviteMember as inviteMemberService,
  acceptInvite as acceptInviteService,
  getOrgMembers as getOrgMembersService,
  updateMemberRole as updateMemberRoleService,
  removeMember as removeMemberService,
  transferOwnership as transferOwnershipService,
} from '../services/organisationService';
import { TApiResponse, TJwtPayload, OrgRole } from '../types';
import { IOrganisationDocument } from '../models/Organisation';

// ─── Response Shape ──────────────────────────────────────────────────────────
// Client expects a flat IOrganisation object with myRole and memberCount
// embedded. Service returns nested { organisation, role, memberCount } shapes,
// so we serialize here at the controller boundary.

interface TSerializedOrg {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  owner: string;
  plan: 'free' | 'pro';
  isActive: boolean;
  createdAt: string;
  myRole?: OrgRole;
  memberCount?: number;
}

const serializeOrg = (
  org: IOrganisationDocument,
  options: { myRole?: OrgRole; memberCount?: number } = {},
): TSerializedOrg => ({
  _id: org._id.toString(),
  name: org.name,
  slug: org.slug,
  description: org.description ?? '',
  logo: org.logo ?? '',
  owner: org.owner.toString(),
  plan: org.plan,
  isActive: org.isActive,
  createdAt: org.createdAt.toISOString(),
  myRole: options.myRole,
  memberCount: options.memberCount,
});

// ─── Controllers ─────────────────────────────────────────────────────────────

export const createOrganisation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { name, description } = req.body as { name: string; description?: string };

    const result = await createOrganisationService(userId, name, description);

    const body: TApiResponse<TSerializedOrg> = {
      success: true,
      data: serializeOrg(result.organisation, { myRole: 'owner', memberCount: result.memberCount }),
      message: 'Organisation created successfully',
    };

    res.status(201).json(body);
  } catch (error) {
    next(error);
  }
};

export const getUserOrganisations = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const memberships = await getUserOrganisationsService(userId);

    const serialized = memberships.map(({ organisation, role }) =>
      serializeOrg(organisation, { myRole: role }),
    );

    const body: TApiResponse<TSerializedOrg[]> = {
      success: true,
      data: serialized,
      message: 'Organisations retrieved successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const getOrganisationBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { orgSlug } = req.params;

    const result = await getOrganisationBySlugService(orgSlug, userId);

    const body: TApiResponse<TSerializedOrg> = {
      success: true,
      data: serializeOrg(result.organisation, {
        myRole: result.role,
        memberCount: result.memberCount,
      }),
      message: 'Organisation retrieved successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const updateOrganisation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { orgSlug } = req.params;
    const updates = req.body as { name?: string; description?: string; logo?: string };

    const org = await updateOrganisationService(orgSlug, userId, updates);

    const body: TApiResponse<TSerializedOrg> = {
      success: true,
      data: serializeOrg(org),
      message: 'Organisation updated successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const deleteOrganisation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { orgSlug } = req.params;

    await deleteOrganisationService(orgSlug, userId);

    const body: TApiResponse<null> = {
      success: true,
      data: null,
      message: 'Organisation deleted successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { orgSlug } = req.params;
    const { email, role } = req.body as { email: string; role: 'admin' | 'member' };

    const result = await inviteMemberService(orgSlug, userId, email, role);

    const body: TApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Invite sent successfully',
    };

    res.status(201).json(body);
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { token } = req.body as { token: string };

    const org = await acceptInviteService(token, userId);

    const body: TApiResponse<TSerializedOrg> = {
      success: true,
      data: serializeOrg(org),
      message: 'Invite accepted successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const getOrgMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { orgSlug } = req.params;

    const members = await getOrgMembersService(orgSlug, userId);

    const body: TApiResponse<typeof members> = {
      success: true,
      data: members,
      message: 'Members retrieved successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { orgSlug, userId: targetUserId } = req.params;
    const { role } = req.body as { role: 'admin' | 'member' };

    const member = await updateMemberRoleService(orgSlug, targetUserId, role, userId);

    const body: TApiResponse<typeof member> = {
      success: true,
      data: member,
      message: 'Member role updated successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { orgSlug, userId: targetUserId } = req.params;

    await removeMemberService(orgSlug, targetUserId, userId);

    const body: TApiResponse<null> = {
      success: true,
      data: null,
      message: 'Member removed successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const transferOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { orgSlug } = req.params;
    const { newOwnerId } = req.body as { newOwnerId: string };

    await transferOwnershipService(orgSlug, newOwnerId, userId);

    const body: TApiResponse<null> = {
      success: true,
      data: null,
      message: 'Ownership transferred successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};
