import { Types } from 'mongoose';
import Project, { IProjectDocument, ProjectRole } from '../models/Project';
import OrgMember from '../models/OrgMember';
import Organisation from '../models/Organisation';
import ApiError from '../utils/ApiError';
import { OrgRole } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireActiveOrgMember(
  orgId: Types.ObjectId,
  userId: string
): Promise<{ role: OrgRole }> {
  const member = await OrgMember.findOne({
    organisation: orgId,
    user: new Types.ObjectId(userId),
    status: 'active',
  });
  if (!member) throw new ApiError(403, 'You are not an active member of this organisation');
  return { role: member.role };
}

async function resolveOrgById(orgId: Types.ObjectId) {
  const org = await Organisation.findById(orgId);
  if (!org || !org.isActive) throw new ApiError(404, 'Organisation not found');
  return org;
}

async function requireProjectLeadOrOrgAdmin(
  project: IProjectDocument,
  userId: string
): Promise<void> {
  const userObjectId = new Types.ObjectId(userId);
  const isLead = project.lead?.equals(userObjectId);

  if (isLead) return;

  const member = await OrgMember.findOne({
    organisation: project.organisation,
    user: userObjectId,
    status: 'active',
  });

  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    throw new ApiError(403, 'Only the project lead or an org admin/owner can perform this action');
  }
}

async function ensureUniqueKey(orgId: Types.ObjectId, baseKey: string): Promise<string> {
  const existing = await Project.findOne({ organisation: orgId, key: baseKey });
  if (!existing) return baseKey;

  // Append incrementing number until unique
  let counter = 2;
  while (true) {
    const candidate = `${baseKey}${counter}`;
    const conflict = await Project.findOne({ organisation: orgId, key: candidate });
    if (!conflict) return candidate;
    counter++;
  }
}

// ─── Service Functions ────────────────────────────────────────────────────────

export interface TCreateProjectData {
  name: string;
  key?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export const createProject = async (
  orgId: string,
  userId: string,
  data: TCreateProjectData
): Promise<IProjectDocument> => {
  const orgObjectId = new Types.ObjectId(orgId);

  await resolveOrgById(orgObjectId);
  await requireActiveOrgMember(orgObjectId, userId);

  const baseKey = data.key
    ? data.key.toUpperCase()
    : Project.generateKey(data.name);

  const uniqueKey = await ensureUniqueKey(orgObjectId, baseKey);

  const project = await Project.create({
    name: data.name,
    key: uniqueKey,
    description: data.description,
    organisation: orgObjectId,
    lead: new Types.ObjectId(userId),
    icon: data.icon,
    color: data.color,
    members: [
      {
        user: new Types.ObjectId(userId),
        role: 'lead',
        addedAt: new Date(),
      },
    ],
  });

  return project;
};

export const getOrgProjects = async (
  orgId: string,
  userId: string
): Promise<IProjectDocument[]> => {
  const orgObjectId = new Types.ObjectId(orgId);

  await resolveOrgById(orgObjectId);
  await requireActiveOrgMember(orgObjectId, userId);

  const projects = await Project.find({ organisation: orgObjectId, status: 'active' })
    .populate('lead', 'name avatar email')
    .sort({ createdAt: -1 });

  return projects;
};

export const getProjectById = async (
  projectId: string,
  userId: string
): Promise<IProjectDocument> => {
  const project = await Project.findById(projectId)
    .populate('lead', 'name avatar email')
    .populate('members.user', 'name avatar email');

  if (!project) throw new ApiError(404, 'Project not found');

  await requireActiveOrgMember(project.organisation, userId);

  return project;
};

export interface TUpdateProjectData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  lead?: string;
}

export const updateProject = async (
  projectId: string,
  userId: string,
  updates: TUpdateProjectData
): Promise<IProjectDocument> => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  await requireProjectLeadOrOrgAdmin(project, userId);

  const allowedUpdates: Partial<{
    name: string;
    description: string;
    icon: string;
    color: string;
    lead: Types.ObjectId;
  }> = {};

  if (updates.name !== undefined) allowedUpdates.name = updates.name;
  if (updates.description !== undefined) allowedUpdates.description = updates.description;
  if (updates.icon !== undefined) allowedUpdates.icon = updates.icon;
  if (updates.color !== undefined) allowedUpdates.color = updates.color;
  if (updates.lead !== undefined) allowedUpdates.lead = new Types.ObjectId(updates.lead);

  const updated = await Project.findByIdAndUpdate(projectId, allowedUpdates, { new: true })
    .populate('lead', 'name avatar email')
    .populate('members.user', 'name avatar email');

  if (!updated) throw new ApiError(500, 'Failed to update project');
  return updated;
};

export const archiveProject = async (projectId: string, userId: string): Promise<void> => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  await requireProjectLeadOrOrgAdmin(project, userId);

  await Project.findByIdAndUpdate(projectId, { status: 'archived' });
};

export const addProjectMember = async (
  projectId: string,
  userId: string,
  targetUserId: string,
  role: ProjectRole
): Promise<IProjectDocument> => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  await requireProjectLeadOrOrgAdmin(project, userId);

  // Verify target is active org member
  await requireActiveOrgMember(project.organisation, targetUserId);

  const targetObjectId = new Types.ObjectId(targetUserId);

  const alreadyMember = project.members.some((m) => m.user.equals(targetObjectId));
  if (alreadyMember) throw new ApiError(409, 'User is already a member of this project');

  project.members.push({ user: targetObjectId, role, addedAt: new Date() });
  await project.save();

  const updated = await Project.findById(projectId)
    .populate('lead', 'name avatar email')
    .populate('members.user', 'name avatar email');

  if (!updated) throw new ApiError(500, 'Failed to retrieve updated project');
  return updated;
};

export const removeProjectMember = async (
  projectId: string,
  userId: string,
  targetUserId: string
): Promise<void> => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  await requireProjectLeadOrOrgAdmin(project, userId);

  const targetObjectId = new Types.ObjectId(targetUserId);

  if (project.lead?.equals(targetObjectId)) {
    throw new ApiError(403, 'Cannot remove the project lead');
  }

  const memberIndex = project.members.findIndex((m) => m.user.equals(targetObjectId));
  if (memberIndex === -1) throw new ApiError(404, 'User is not a member of this project');

  project.members.splice(memberIndex, 1);
  await project.save();
};
