import { Types } from 'mongoose';
import Issue from '../models/Issue';
import Project from '../models/Project';
import Sprint from '../models/Sprint';
import OrgMember from '../models/OrgMember';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import {
  IDashboardData,
  IIssue,
  IIssueStats,
  ISearchResults,
  ISprintProgress,
  IssuePriority,
  IssueStatus,
  IUser,
} from '../types';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PRIORITY_RANK: Record<IssuePriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const EMPTY_BY_STATUS: Record<IssueStatus, number> = {
  backlog: 0,
  todo: 0,
  inprogress: 0,
  review: 0,
  done: 0,
};

const EMPTY_BY_PRIORITY: Record<IssuePriority, number> = {
  urgent: 0,
  high: 0,
  medium: 0,
  low: 0,
};

function mapUserToIUser(doc: {
  _id: Types.ObjectId;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
}): IUser {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    avatar: doc.avatar,
    role: doc.role,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function buildAccessibleProjectsMatch(
  orgOid: Types.ObjectId,
  userOid: Types.ObjectId
): {
  organisation: Types.ObjectId;
  status: 'active';
  $or: ({ lead: Types.ObjectId } | { 'members.user': Types.ObjectId })[];
} {
  return {
    organisation: orgOid,
    status: 'active',
    $or: [{ lead: userOid }, { 'members.user': userOid }],
  };
}

export const getUserDashboard = async (userId: string, orgId: string): Promise<IDashboardData> => {
  const userOid = new Types.ObjectId(userId);
  const orgOid = new Types.ObjectId(orgId);

  const myIssueIds = await Issue.aggregate<{ _id: Types.ObjectId }>([
    {
      $match: {
        assignee: userOid,
        organisation: orgOid,
        status: { $nin: ['done', 'backlog'] },
      },
    },
    {
      $addFields: {
        priorityRank: {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'urgent'] }, then: PRIORITY_RANK.urgent },
              { case: { $eq: ['$priority', 'high'] }, then: PRIORITY_RANK.high },
              { case: { $eq: ['$priority', 'medium'] }, then: PRIORITY_RANK.medium },
              { case: { $eq: ['$priority', 'low'] }, then: PRIORITY_RANK.low },
            ],
            default: 99,
          },
        },
      },
    },
    { $sort: { priorityRank: 1, updatedAt: -1 } },
    { $limit: 10 },
    { $project: { _id: 1 } },
  ]);

  let myIssues: IIssue[] = [];
  if (myIssueIds.length > 0) {
    const idOrder = myIssueIds.map((row) => row._id.toString());
    const fetched = await Issue.find({ _id: { $in: myIssueIds.map((r) => r._id) } })
      .populate('project', 'name key color')
      .populate('sprint', 'name')
      .lean();

    const byId = new Map(fetched.map((doc) => [doc._id.toString(), doc]));
    const ordered = idOrder.map((id) => byId.get(id)).filter((d): d is NonNullable<typeof d> => d != null);
    myIssues = ordered as unknown as IIssue[];
  }

  const recentProjectDocs = await Project.find(buildAccessibleProjectsMatch(orgOid, userOid))
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  const recentProjects = recentProjectDocs as unknown as IDashboardData['recentProjects'];

  const accessibleProjectIds = await Project.find(buildAccessibleProjectsMatch(orgOid, userOid))
    .select('_id')
    .lean();

  const projectIdList = accessibleProjectIds.map((p) => p._id);

  let sprintProgress: ISprintProgress[] = [];
  if (projectIdList.length > 0) {
    const activeSprints = await Sprint.find({
      project: { $in: projectIdList },
      status: 'active',
    })
      .populate('createdBy', 'name email avatar role createdAt updatedAt')
      .lean();

    const sprintIds = activeSprints.map((s) => s._id);

    type TSprintAgg = { _id: Types.ObjectId; total: number; done: number };
    let aggRows: TSprintAgg[] = [];
    if (sprintIds.length > 0) {
      aggRows = await Issue.aggregate<TSprintAgg>([
        {
          $match: {
            organisation: orgOid,
            sprint: { $in: sprintIds },
          },
        },
        {
          $group: {
            _id: '$sprint',
            total: { $sum: 1 },
            done: {
              $sum: {
                $cond: [{ $eq: ['$status', 'done'] }, 1, 0],
              },
            },
          },
        },
      ]);
    }

    const countsBySprint = new Map<string, { total: number; done: number }>();
    for (const row of aggRows) {
      countsBySprint.set(row._id.toString(), { total: row.total, done: row.done });
    }

    const projectIdsForSprints = [...new Set(activeSprints.map((s) => s.project.toString()))];
    const projectDocs = await Project.find({
      _id: { $in: projectIdsForSprints.map((id) => new Types.ObjectId(id)) },
    }).lean();
    const projectById = new Map(projectDocs.map((p) => [p._id.toString(), p]));

    sprintProgress = activeSprints
      .map((sprintDoc): ISprintProgress | null => {
        const counts = countsBySprint.get(sprintDoc._id.toString()) ?? { total: 0, done: 0 };
        const total = counts.total;
        const done = counts.done;
        const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
        const proj = projectById.get(sprintDoc.project.toString());
        if (!proj) return null;
        const createdByRaw = sprintDoc.createdBy as unknown;
        if (
          !createdByRaw ||
          typeof createdByRaw !== 'object' ||
          !('_id' in createdByRaw) ||
          !('name' in createdByRaw) ||
          !('email' in createdByRaw)
        ) {
          throw new ApiError(500, 'Sprint createdBy could not be resolved');
        }
        const createdBy = mapUserToIUser(
          createdByRaw as {
            _id: Types.ObjectId;
            name: string;
            email: string;
            avatar?: string;
            role: 'admin' | 'member';
            createdAt: Date;
            updatedAt: Date;
          }
        );

        return {
          sprint: {
            _id: sprintDoc._id.toString(),
            name: sprintDoc.name,
            goal: sprintDoc.goal ?? '',
            project: sprintDoc.project.toString(),
            organisation: sprintDoc.organisation.toString(),
            status: sprintDoc.status,
            startDate: sprintDoc.startDate ? sprintDoc.startDate.toISOString() : null,
            endDate: sprintDoc.endDate ? sprintDoc.endDate.toISOString() : null,
            completedAt: sprintDoc.completedAt ? sprintDoc.completedAt.toISOString() : null,
            order: sprintDoc.order,
            createdBy,
            createdAt: sprintDoc.createdAt.toISOString(),
            updatedAt: sprintDoc.updatedAt.toISOString(),
          },
          project: proj as unknown as ISprintProgress['project'],
          total,
          done,
          percentage,
        };
      })
      .filter((row): row is ISprintProgress => row !== null);
  }

  const [statusGroups, priorityGroups] = await Promise.all([
    Issue.aggregate<{ _id: IssueStatus; count: number }>([
      { $match: { organisation: orgOid } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Issue.aggregate<{ _id: IssuePriority; count: number }>([
      { $match: { organisation: orgOid, assignee: userOid } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus: Record<IssueStatus, number> = { ...EMPTY_BY_STATUS };
  for (const row of statusGroups) {
    if (row._id && row._id in byStatus) {
      byStatus[row._id] = row.count;
    }
  }

  const byPriority: Record<IssuePriority, number> = { ...EMPTY_BY_PRIORITY };
  for (const row of priorityGroups) {
    if (row._id && row._id in byPriority) {
      byPriority[row._id] = row.count;
    }
  }

  const issueStats: IIssueStats = { byStatus, byPriority };

  return {
    myIssues,
    recentProjects,
    sprintProgress,
    issueStats,
  };
};

export const globalSearch = async (
  query: string,
  orgId: string,
  _userId: string,
  limit = 20
): Promise<ISearchResults> => {
  const orgOid = new Types.ObjectId(orgId);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const pattern = escapeRegExp(query.trim());

  const orgMemberIds = await OrgMember.distinct('user', {
    organisation: orgOid,
    status: 'active',
    user: { $ne: null },
  });

  const [issues, projects, members] = await Promise.all([
    Issue.find({
      organisation: orgOid,
      $or: [{ title: { $regex: pattern, $options: 'i' } }, { key: { $regex: pattern, $options: 'i' } }],
    })
      .populate('project', 'name key color')
      .limit(safeLimit)
      .lean(),
    Project.find({
      organisation: orgOid,
      status: 'active',
      $or: [{ name: { $regex: pattern, $options: 'i' } }, { key: { $regex: pattern, $options: 'i' } }],
    })
      .limit(5)
      .lean(),
    User.find({
      _id: { $in: orgMemberIds },
      $or: [{ name: { $regex: pattern, $options: 'i' } }, { email: { $regex: pattern, $options: 'i' } }],
    })
      .select('name email avatar role createdAt updatedAt')
      .limit(5)
      .lean(),
  ]);

  return {
    issues: issues as unknown as IIssue[],
    projects: projects as unknown as ISearchResults['projects'],
    members: members.map((m) => mapUserToIUser(m)),
  };
};
