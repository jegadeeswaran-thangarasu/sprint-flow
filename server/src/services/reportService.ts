import { Types } from 'mongoose';
import ActivityLog from '../models/ActivityLog';
import Issue, { IssuePriority, IssueStatus, IssueType } from '../models/Issue';
import Sprint, { ISprintDocument } from '../models/Sprint';
import ApiError from '../utils/ApiError';
import {
  IBurndownData,
  IIssue,
  IIssueBreakdown,
  ISprint,
  ISprintReport,
  IUser,
  IVelocityData,
} from '../types';

const populateReportIssue = [
  { path: 'assignee', select: 'name avatar email role createdAt updatedAt' },
  { path: 'reporter', select: 'name avatar email role createdAt updatedAt' },
  { path: 'watchers', select: 'name avatar email role createdAt updatedAt' },
  { path: 'epic', select: 'key title status' },
  { path: 'parent', select: 'key title status' },
  { path: 'sprint', select: 'name' },
] as const;

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function enumerateDaysInclusive(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const s = startOfUtcDay(start);
  const e = startOfUtcDay(end);
  for (let cur = new Date(s); cur.getTime() <= e.getTime(); cur.setUTCDate(cur.getUTCDate() + 1)) {
    days.push(new Date(cur));
  }
  return days;
}

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

type TPopulatedUserFields = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
};

function isPopulatedUserDoc(v: unknown): v is TPopulatedUserFields {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.name === 'string' &&
    typeof o.email === 'string' &&
    (o.role === 'admin' || o.role === 'member') &&
    o.createdAt instanceof Date &&
    o.updatedAt instanceof Date &&
    o._id instanceof Types.ObjectId
  );
}

function mapLeanIssueToIIssue(raw: Record<string, unknown>): IIssue {
  const id = raw._id as Types.ObjectId;
  const assigneeRaw = raw.assignee;
  const reporterRaw = raw.reporter;
  const epicRaw = raw.epic;
  const parentRaw = raw.parent;

  const isPopulatedIssueRef = (
    v: unknown
  ): v is { _id: Types.ObjectId; key: string; title: string; status?: IssueStatus } =>
    typeof v === 'object' &&
    v !== null &&
    'key' in v &&
    'title' in v &&
    typeof (v as { key: unknown }).key === 'string';

  const assignee =
    assigneeRaw &&
    typeof assigneeRaw === 'object' &&
    assigneeRaw !== null &&
    '_id' in assigneeRaw
      ? mapUserToIUser(
          assigneeRaw as {
            _id: Types.ObjectId;
            name: string;
            email: string;
            avatar?: string;
            role: 'admin' | 'member';
            createdAt: Date;
            updatedAt: Date;
          }
        )
      : null;

  const reporter =
    reporterRaw &&
    typeof reporterRaw === 'object' &&
    reporterRaw !== null &&
    '_id' in reporterRaw
      ? mapUserToIUser(
          reporterRaw as {
            _id: Types.ObjectId;
            name: string;
            email: string;
            avatar?: string;
            role: 'admin' | 'member';
            createdAt: Date;
            updatedAt: Date;
          }
        )
      : (() => {
          throw new ApiError(500, 'Issue reporter could not be resolved');
        })();

  const epic = isPopulatedIssueRef(epicRaw)
    ? ({
        _id: String((epicRaw as { _id: Types.ObjectId })._id),
        key: epicRaw.key,
        title: epicRaw.title,
        status: epicRaw.status,
      } as IIssue['epic'])
    : null;

  const parent = isPopulatedIssueRef(parentRaw)
    ? ({
        _id: String((parentRaw as { _id: Types.ObjectId })._id),
        key: parentRaw.key,
        title: parentRaw.title,
        status: parentRaw.status,
      } as IIssue['parent'])
    : null;

  const sprintRef = raw.sprint;
  const sprintId =
    sprintRef === null || sprintRef === undefined
      ? null
      : typeof sprintRef === 'object' && sprintRef !== null && '_id' in sprintRef
        ? String((sprintRef as { _id: Types.ObjectId })._id)
        : String(sprintRef);

  const watchersRaw = raw.watchers;
  const watchers: IUser[] = Array.isArray(watchersRaw)
    ? watchersRaw
        .filter((w): w is Record<string, unknown> => typeof w === 'object' && w !== null && '_id' in w)
        .map((w) =>
          mapUserToIUser(
            w as {
              _id: Types.ObjectId;
              name: string;
              email: string;
              avatar?: string;
              role: 'admin' | 'member';
              createdAt: Date;
              updatedAt: Date;
            }
          )
        )
    : [];

  const due = raw.dueDate;
  const dueDate =
    due === null || due === undefined
      ? null
      : due instanceof Date
        ? due.toISOString()
        : String(due);

  return {
    _id: id.toString(),
    key: String(raw.key),
    title: String(raw.title),
    description: typeof raw.description === 'string' ? raw.description : '',
    type: raw.type as IssueType,
    status: raw.status as IssueStatus,
    priority: raw.priority as IssuePriority,
    project: String(raw.project),
    organisation: String(raw.organisation),
    sprint: sprintId,
    epic,
    parent,
    assignee,
    reporter,
    storyPoints:
      raw.storyPoints === null || raw.storyPoints === undefined ? null : Number(raw.storyPoints),
    labels: Array.isArray(raw.labels) ? (raw.labels as string[]) : [],
    order: Number(raw.order ?? 0),
    dueDate,
    watchers,
    createdAt: (raw.createdAt as Date).toISOString(),
    updatedAt: (raw.updatedAt as Date).toISOString(),
  };
}

async function buildCompletionDayMap(issueIds: Types.ObjectId[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (issueIds.length === 0) return map;

  const logs = await ActivityLog.find({
    issue: { $in: issueIds },
    action: 'status_changed',
    newValue: 'done',
  })
    .sort({ createdAt: 1 })
    .lean();

  for (const log of logs) {
    const iid = (log.issue as Types.ObjectId).toString();
    if (!map.has(iid)) {
      map.set(iid, toDateKey(new Date(log.createdAt)));
    }
  }

  return map;
}

function sprintToISprint(doc: ISprintDocument, createdByUser: IUser): ISprint {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    goal: doc.goal ?? '',
    project: doc.project.toString(),
    organisation: doc.organisation.toString(),
    status: doc.status,
    startDate: doc.startDate ? doc.startDate.toISOString() : null,
    endDate: doc.endDate ? doc.endDate.toISOString() : null,
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    order: doc.order,
    createdBy: createdByUser,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const getBurndownData = async (
  sprintId: string,
  projectId: string
): Promise<IBurndownData> => {
  const sprint = await Sprint.findOne({
    _id: new Types.ObjectId(sprintId),
    project: new Types.ObjectId(projectId),
  });

  if (!sprint) {
    throw new ApiError(404, 'Sprint not found');
  }

  if (!sprint.startDate || !sprint.endDate) {
    throw new ApiError(400, 'Sprint must have start and end dates for burndown');
  }

  const issues = await Issue.find({
    sprint: sprint._id,
    project: new Types.ObjectId(projectId),
  }).lean();

  const issueObjectIds = issues.map((i) => i._id as Types.ObjectId);
  const completionByIssue = await buildCompletionDayMap(issueObjectIds);

  for (const issue of issues) {
    const id = issue._id.toString();
    if (issue.status === 'done' && !completionByIssue.has(id)) {
      completionByIssue.set(id, toDateKey(new Date(issue.updatedAt)));
    }
  }

  const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  const today = startOfUtcDay(new Date());
  const sprintEnd = startOfUtcDay(sprint.endDate);
  const rangeEnd = today.getTime() <= sprintEnd.getTime() ? today : sprintEnd;
  const rangeStart = startOfUtcDay(sprint.startDate);

  if (rangeEnd.getTime() < rangeStart.getTime()) {
    throw new ApiError(400, 'Burndown is only available after the sprint has started');
  }

  const days = enumerateDaysInclusive(sprint.startDate, rangeEnd);
  if (days.length === 0) {
    throw new ApiError(400, 'Invalid sprint date range');
  }

  const data: IBurndownData['data'] = [];
  const dayCount = days.length;

  for (let i = 0; i < dayCount; i++) {
    const day = days[i];
    const dayKey = toDateKey(day);

    let actualRemaining = 0;
    for (const issue of issues) {
      const pts = issue.storyPoints ?? 0;
      const id = issue._id.toString();
      if (issue.status !== 'done') {
        actualRemaining += pts;
        continue;
      }
      const doneDay = completionByIssue.get(id);
      if (!doneDay) {
        actualRemaining += pts;
        continue;
      }
      if (doneDay > dayKey) {
        actualRemaining += pts;
      }
    }

    const ideal =
      dayCount === 1 ? 0 : totalPoints * (1 - i / (dayCount - 1));

    data.push({
      date: dayKey,
      ideal: Math.round(ideal * 100) / 100,
      actual: Math.round(actualRemaining * 100) / 100,
    });
  }

  return {
    sprintName: sprint.name,
    startDate: sprint.startDate.toISOString(),
    endDate: sprint.endDate.toISOString(),
    totalPoints,
    data,
  };
};

export const getVelocityData = async (projectId: string, limit = 6): Promise<IVelocityData> => {
  const cap = Math.min(Math.max(1, limit), 24);
  const sprints = await Sprint.find({
    project: new Types.ObjectId(projectId),
    status: 'completed',
  })
    .sort({ endDate: -1 })
    .limit(cap)
    .lean();

  const result: IVelocityData = [];

  for (const sp of sprints) {
    const sprintOid = sp._id as Types.ObjectId;
    const startBoundary = sp.startDate ? new Date(sp.startDate) : new Date(0);

    let committedIssues = await Issue.find({
      sprint: sprintOid,
      project: new Types.ObjectId(projectId),
      createdAt: { $lte: startBoundary },
    }).lean();

    if (committedIssues.length === 0) {
      committedIssues = await Issue.find({
        sprint: sprintOid,
        project: new Types.ObjectId(projectId),
      }).lean();
    }

    const committed = committedIssues.reduce((s, i) => s + (i.storyPoints ?? 0), 0);

    const doneIssues = await Issue.find({
      sprint: sprintOid,
      project: new Types.ObjectId(projectId),
      status: 'done',
    }).lean();

    const completed = doneIssues.reduce((s, i) => s + (i.storyPoints ?? 0), 0);

    result.push({
      sprintName: sp.name,
      committed,
      completed,
    });
  }

  return result;
};

const EMPTY_TYPE: Record<IssueType, number> = {
  story: 0,
  task: 0,
  bug: 0,
  epic: 0,
  subtask: 0,
};

const EMPTY_PRIORITY: Record<IssuePriority, number> = {
  urgent: 0,
  high: 0,
  medium: 0,
  low: 0,
};

const EMPTY_STATUS: Record<IssueStatus, number> = {
  backlog: 0,
  todo: 0,
  inprogress: 0,
  review: 0,
  done: 0,
};

export const getIssueBreakdown = async (
  projectId: string,
  sprintId?: string
): Promise<IIssueBreakdown> => {
  const match: Record<string, unknown> = { project: new Types.ObjectId(projectId) };
  if (sprintId) {
    const sp = await Sprint.findOne({
      _id: new Types.ObjectId(sprintId),
      project: new Types.ObjectId(projectId),
    });
    if (!sp) {
      throw new ApiError(404, 'Sprint not found for this project');
    }
    match.sprint = new Types.ObjectId(sprintId);
  }

  const issues = await Issue.find(match).populate('assignee', 'name avatar email role createdAt updatedAt').lean();

  const byType: Record<IssueType, number> = { ...EMPTY_TYPE };
  const byPriority: Record<IssuePriority, number> = { ...EMPTY_PRIORITY };
  const byStatus: Record<IssueStatus, number> = { ...EMPTY_STATUS };

  const assigneeCounts = new Map<string, { user: IUser; count: number }>();

  for (const row of issues) {
    const t = row.type as IssueType;
    const p = row.priority as IssuePriority;
    const s = row.status as IssueStatus;
    if (t in byType) byType[t] += 1;
    if (p in byPriority) byPriority[p] += 1;
    if (s in byStatus) byStatus[s] += 1;

    const a = row.assignee;
    if (isPopulatedUserDoc(a)) {
      const user = mapUserToIUser(a);
      const uid = user._id;
      const prev = assigneeCounts.get(uid);
      if (prev) {
        prev.count += 1;
      } else {
        assigneeCounts.set(uid, { user, count: 1 });
      }
    }
  }

  const byAssignee = Array.from(assigneeCounts.values()).sort((x, y) => y.count - x.count);

  return { byType, byPriority, byStatus, byAssignee };
};

export const getSprintReport = async (sprintId: string, projectId: string): Promise<ISprintReport> => {
  const projectOid = new Types.ObjectId(projectId);
  const sprint = await Sprint.findOne({
    _id: new Types.ObjectId(sprintId),
    project: projectOid,
  }).populate('createdBy', 'name email avatar role createdAt updatedAt');

  if (!sprint) {
    throw new ApiError(404, 'Sprint not found');
  }

  const createdByRaw = sprint.createdBy as unknown;
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

  const sprintISprint = sprintToISprint(sprint, createdBy);

  const issueDocs = (await Issue.find({ sprint: sprint._id })
    .populate([...populateReportIssue])
    .lean()) as unknown as Record<string, unknown>[];

  const completedIssues: IIssue[] = [];
  const incompleteIssues: IIssue[] = [];

  for (const raw of issueDocs) {
    const mapped = mapLeanIssueToIIssue(raw);
    if (mapped.status === 'done') {
      completedIssues.push(mapped);
    } else {
      incompleteIssues.push(mapped);
    }
  }

  const sprintStart = sprint.startDate ? new Date(sprint.startDate) : null;
  let addedDuringSprintCount = 0;
  if (sprintStart) {
    addedDuringSprintCount = await Issue.countDocuments({
      sprint: sprint._id,
      createdAt: { $gt: sprintStart },
    });
  }

  const velocityPoints = completedIssues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  const doneIssueDocs = await Issue.find({
    sprint: sprint._id,
    status: 'done',
  })
    .populate('assignee', 'name avatar email role createdAt updatedAt')
    .lean();

  const contribMap = new Map<
    string,
    { user: IUser; issuesCompleted: number; storyPoints: number }
  >();

  for (const row of doneIssueDocs) {
    const a = row.assignee;
    if (!isPopulatedUserDoc(a)) continue;
    const user = mapUserToIUser(a);
    const pts = row.storyPoints ?? 0;
    const prev = contribMap.get(user._id);
    if (prev) {
      prev.issuesCompleted += 1;
      prev.storyPoints += pts;
    } else {
      contribMap.set(user._id, { user, issuesCompleted: 1, storyPoints: pts });
    }
  }

  const teamContributions = Array.from(contribMap.values()).sort(
    (a, b) => b.storyPoints - a.storyPoints
  );

  return {
    sprint: sprintISprint,
    completedIssues,
    incompleteIssues,
    addedDuringSprintCount,
    velocityPoints,
    teamContributions,
  };
};
