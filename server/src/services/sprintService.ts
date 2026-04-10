import { Types } from 'mongoose';
import Sprint, { ISprintDocument, SprintStatus } from '../models/Sprint';
import Issue from '../models/Issue';
import { IIssueDocument } from '../models/Issue';
import Project, { IProjectDocument } from '../models/Project';
import OrgMember from '../models/OrgMember';
import ApiError from '../utils/ApiError';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSprintManagePermission(
  sprint: ISprintDocument,
  userId: string
): Promise<void> {
  const project = await Project.findById(sprint.project);
  if (!project) throw new ApiError(404, 'Project not found');

  const isLead = project.lead?.equals(new Types.ObjectId(userId)) ?? false;
  if (isLead) return;

  const member = await OrgMember.findOne({
    organisation: project.organisation,
    user: new Types.ObjectId(userId),
    status: 'active',
  });

  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    throw new ApiError(403, 'Only the project lead or an org admin/owner can perform this action');
  }
}

async function getSprintOrThrow(sprintId: string): Promise<ISprintDocument> {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) throw new ApiError(404, 'Sprint not found');
  return sprint;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TCreateSprintData {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface TUpdateSprintData {
  name?: string;
  goal?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ISprintWithCount {
  _id: Types.ObjectId;
  name: string;
  goal?: string;
  project: Types.ObjectId;
  organisation: Types.ObjectId;
  status: SprintStatus;
  startDate: Date | null;
  endDate: Date | null;
  completedAt: Date | null;
  order: number;
  createdBy: Types.ObjectId;
  issueCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompleteSprintServiceResult {
  sprint: ISprintDocument;
  completedIssues: number;
  movedIssues: number;
}

// ─── Service Functions ────────────────────────────────────────────────────────

export const createSprint = async (
  projectId: string,
  orgId: string,
  userId: string,
  data: TCreateSprintData
): Promise<ISprintDocument> => {
  const orgObjectId = new Types.ObjectId(orgId);

  const project = await Project.findOne({
    _id: projectId,
    organisation: orgObjectId,
  });
  if (!project) throw new ApiError(404, 'Project not found');

  const count = await Sprint.countDocuments({ project: project._id });
  const name = data.name?.trim() || `Sprint ${count + 1}`;

  const lastSprint = await Sprint.findOne({ project: project._id }).sort({ order: -1 });
  const order = lastSprint ? lastSprint.order + 1 : 0;

  const sprint = await Sprint.create({
    name,
    goal: data.goal,
    project: project._id,
    organisation: orgObjectId,
    status: 'planning' as SprintStatus,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    order,
    createdBy: new Types.ObjectId(userId),
  });

  return sprint;
};

export const getProjectSprints = async (
  projectId: string,
  _userId: string
): Promise<ISprintWithCount[]> => {
  const sprints = await Sprint.find({ project: new Types.ObjectId(projectId) }).sort({ order: 1 });

  const sprintIds = sprints.map((s) => s._id);

  const counts = await Issue.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { sprint: { $in: sprintIds } } },
    { $group: { _id: '$sprint', count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>(counts.map((c) => [c._id.toString(), c.count]));

  return sprints.map((sprint) => ({
    _id: sprint._id,
    name: sprint.name,
    goal: sprint.goal,
    project: sprint.project,
    organisation: sprint.organisation,
    status: sprint.status,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    completedAt: sprint.completedAt,
    order: sprint.order,
    createdBy: sprint.createdBy,
    issueCount: countMap.get(sprint._id.toString()) ?? 0,
    createdAt: sprint.createdAt,
    updatedAt: sprint.updatedAt,
  }));
};

export const getSprintById = async (
  sprintId: string,
  _userId: string
): Promise<ISprintDocument> => {
  const sprint = await Sprint.findById(sprintId).populate('createdBy', 'name avatar');
  if (!sprint) throw new ApiError(404, 'Sprint not found');
  return sprint;
};

export const updateSprint = async (
  sprintId: string,
  userId: string,
  updates: TUpdateSprintData
): Promise<ISprintDocument> => {
  const sprint = await getSprintOrThrow(sprintId);
  await requireSprintManagePermission(sprint, userId);

  if (sprint.status === 'completed') {
    throw new ApiError(400, 'Cannot update a completed sprint');
  }

  const payload: Partial<{
    name: string;
    goal: string;
    startDate: Date | null;
    endDate: Date | null;
  }> = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.goal !== undefined) payload.goal = updates.goal;
  if (updates.startDate !== undefined) {
    payload.startDate = updates.startDate ? new Date(updates.startDate) : null;
  }
  if (updates.endDate !== undefined) {
    payload.endDate = updates.endDate ? new Date(updates.endDate) : null;
  }

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'No valid fields to update');
  }

  const updated = await Sprint.findByIdAndUpdate(sprintId, payload, { new: true });
  if (!updated) throw new ApiError(500, 'Failed to update sprint');
  return updated;
};

export const startSprint = async (
  sprintId: string,
  userId: string
): Promise<ISprintDocument> => {
  const sprint = await getSprintOrThrow(sprintId);
  await requireSprintManagePermission(sprint, userId);

  if (sprint.status !== 'planning') {
    throw new ApiError(400, 'Only sprints in planning status can be started');
  }

  const activeSprint = await Sprint.findOne({
    project: sprint.project,
    status: 'active',
  });

  if (activeSprint) {
    throw new ApiError(
      400,
      'Another sprint is already active. Complete it before starting a new one.'
    );
  }

  const issueCount = await Issue.countDocuments({ sprint: sprint._id });
  if (issueCount === 0) {
    throw new ApiError(400, 'Cannot start an empty sprint. Add issues first.');
  }

  const updated = await Sprint.findByIdAndUpdate(
    sprintId,
    { status: 'active', startDate: new Date() },
    { new: true }
  );
  if (!updated) throw new ApiError(500, 'Failed to start sprint');

  // Ensure any issues still carrying 'backlog' status are promoted to 'todo'
  await Issue.updateMany(
    { sprint: updated._id, status: 'backlog' },
    { $set: { status: 'todo' } }
  );

  return updated;
};

export const completeSprint = async (
  sprintId: string,
  userId: string,
  moveToSprintId?: string
): Promise<ICompleteSprintServiceResult> => {
  const sprint = await getSprintOrThrow(sprintId);
  await requireSprintManagePermission(sprint, userId);

  if (sprint.status !== 'active') {
    throw new ApiError(400, 'Only active sprints can be completed');
  }

  const totalIssues = await Issue.countDocuments({ sprint: sprint._id });
  const incompleteIssues = await Issue.find({
    sprint: sprint._id,
    status: { $ne: 'done' },
  }).select('_id');

  const completedCount = totalIssues - incompleteIssues.length;
  const movedCount = incompleteIssues.length;
  const incompleteIds = incompleteIssues.map((i) => i._id);

  if (moveToSprintId) {
    const targetSprint = await Sprint.findById(moveToSprintId);
    if (!targetSprint) throw new ApiError(404, 'Target sprint not found');
    if (targetSprint.status === 'completed') {
      throw new ApiError(400, 'Cannot move issues to a completed sprint');
    }

    await Issue.updateMany(
      { _id: { $in: incompleteIds } },
      { $set: { sprint: new Types.ObjectId(moveToSprintId), status: 'todo' } }
    );
  } else {
    await Issue.updateMany(
      { _id: { $in: incompleteIds } },
      { $set: { sprint: null, status: 'backlog' } }
    );
  }

  const updated = await Sprint.findByIdAndUpdate(
    sprintId,
    { status: 'completed', completedAt: new Date() },
    { new: true }
  );
  if (!updated) throw new ApiError(500, 'Failed to complete sprint');

  return {
    sprint: updated,
    completedIssues: completedCount,
    movedIssues: movedCount,
  };
};

export const deleteSprint = async (
  sprintId: string,
  userId: string
): Promise<void> => {
  const sprint = await getSprintOrThrow(sprintId);
  await requireSprintManagePermission(sprint, userId);

  if (sprint.status !== 'planning') {
    throw new ApiError(400, 'Only sprints in planning status can be deleted');
  }

  await Issue.updateMany({ sprint: sprint._id }, { $set: { sprint: null, status: 'backlog' } });
  await Sprint.findByIdAndDelete(sprintId);
};

export const moveIssuesToSprint = async (
  sprintId: string,
  issueIds: string[],
  _userId: string
): Promise<number> => {
  const sprint = await getSprintOrThrow(sprintId);

  if (sprint.status === 'completed') {
    throw new ApiError(400, 'Cannot move issues to a completed sprint');
  }

  const sprintObjectId = sprint._id;
  const issueObjectIds = issueIds.map((id) => new Types.ObjectId(id));

  // Backlog issues become 'todo' when moved to a sprint
  await Issue.updateMany(
    { _id: { $in: issueObjectIds }, status: 'backlog' },
    { $set: { sprint: sprintObjectId, status: 'todo' } }
  );

  // Non-backlog issues keep their existing status
  await Issue.updateMany(
    { _id: { $in: issueObjectIds }, status: { $ne: 'backlog' } },
    { $set: { sprint: sprintObjectId } }
  );

  return issueObjectIds.length;
};

export const removeIssuesFromSprint = async (
  issueIds: string[],
  _userId: string
): Promise<number> => {
  const issueObjectIds = issueIds.map((id) => new Types.ObjectId(id));

  await Issue.updateMany(
    { _id: { $in: issueObjectIds } },
    { $set: { sprint: null, status: 'backlog' } }
  );

  return issueObjectIds.length;
};

export const getSprintIssues = async (
  sprintId: string,
  _userId: string
): Promise<IIssueDocument[]> => {
  const sprint = await getSprintOrThrow(sprintId);

  const issues = await Issue.find({ sprint: sprint._id })
    .populate([
      { path: 'assignee', select: 'name avatar email' },
      { path: 'reporter', select: 'name avatar email' },
    ])
    .sort({ status: 1, order: 1 });

  return issues;
};
