export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'member';
  createdAt: string;
  updatedAt: string;
}

export type OrgRole = 'owner' | 'admin' | 'member';

export interface IOrganisation {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  owner: string;
  plan: 'free' | 'pro';
  isActive: boolean;
  memberCount?: number;
  myRole?: OrgRole;
  createdAt: string;
}

export interface IOrgMember {
  _id: string;
  organisation: string;
  user: IUser | null;
  email: string;
  role: OrgRole;
  status: 'invited' | 'active' | 'suspended';
  invitedBy: string;
  joinedAt?: string;
  createdAt: string;
}

export interface TAuthResponse {
  user: IUser;
  accessToken: string;
}

export type ProjectRole = 'lead' | 'member';
export type ProjectStatus = 'active' | 'archived';

export interface IProjectMember {
  user: IUser;
  role: ProjectRole;
  addedAt: string;
}

export interface IProject {
  _id: string;
  name: string;
  key: string;
  description: string;
  organisation: string;
  lead: IUser;
  members: IProjectMember[];
  status: ProjectStatus;
  icon: string;
  color: string;
  issueCount: number;
  createdAt: string;
  updatedAt: string;
}

export type IssueType = 'story' | 'task' | 'bug' | 'epic' | 'subtask';
export type IssueStatus = 'backlog' | 'todo' | 'inprogress' | 'review' | 'done';
export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low';

/** Populated epic/parent from API */
export interface IIssueRef {
  _id: string;
  key: string;
  title: string;
  status?: IssueStatus;
}

export interface IIssue {
  _id: string;
  key: string;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  project: string;
  organisation: string;
  sprint: string | null;
  epic: IIssueRef | null;
  parent: IIssueRef | null;
  assignee: IUser | null;
  reporter: IUser;
  storyPoints: number | null;
  labels: string[];
  order: number;
  dueDate: string | null;
  watchers?: IUser[];
  createdAt: string;
  updatedAt: string;
}

export type SprintStatus = 'planning' | 'active' | 'completed';

export interface ISprint {
  _id: string;
  name: string;
  goal: string;
  project: string;
  organisation: string;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  order: number;
  createdBy: IUser;
  issueCount?: number;
  completedIssueCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICompleteSprintResult {
  sprint: ISprint;
  completedIssues: number;
  movedIssues: number;
}

export type TAuthState = {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
};

export type TApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export type BoardStatus = 'todo' | 'inprogress' | 'review' | 'done';

export interface IBoardColumn {
  id: BoardStatus;
  label: string;
  color: string;
}

export interface IBulkUpdateItem {
  issueId: string;
  status: IssueStatus;
  order: number;
}

export interface IBoardData {
  todo: IIssue[];
  inprogress: IIssue[];
  review: IIssue[];
  done: IIssue[];
}

export interface IReaction {
  emoji: string;
  users: IUser[];
}

export interface IComment {
  _id: string;
  content: string;
  issue: string;
  author: IUser;
  isEdited: boolean;
  editedAt: string | null;
  mentions: IUser[];
  reactions: IReaction[];
  parentComment: string | null;
  replies?: IComment[];
  createdAt: string;
  updatedAt: string;
}

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'priority_changed'
  | 'assignee_changed'
  | 'sprint_changed'
  | 'comment_added'
  | 'comment_deleted'
  | 'attachment_added'
  | 'watcher_added'
  | 'watcher_removed'
  | 'epic_linked'
  | 'parent_changed';

export interface IActivityLog {
  _id: string;
  issue: string;
  actor: IUser;
  action: ActivityAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface IFullIssue extends Omit<IIssue, 'project' | 'sprint'> {
  assignee: IUser | null;
  reporter: IUser;
  watchers: IUser[];
  epic: IIssueRef | null;
  parent: IIssueRef | null;
  sprint: ISprint | null;
  project: IProject;
}

/** Dashboard / search: issue row with populated project (and optional sprint) */
export interface IDashboardMyIssue extends Omit<IIssue, 'project' | 'sprint'> {
  project: Pick<IProject, '_id' | 'name' | 'key' | 'color'>;
  sprint: Pick<ISprint, '_id' | 'name'> | null;
}

export interface ISprintProgress {
  sprint: ISprint;
  project: IProject;
  total: number;
  done: number;
  percentage: number;
}

export interface IIssueStats {
  byStatus: Record<IssueStatus, number>;
  byPriority: Record<IssuePriority, number>;
}

export interface IDashboardData {
  myIssues: IDashboardMyIssue[];
  recentProjects: IProject[];
  sprintProgress: ISprintProgress[];
  issueStats: IIssueStats;
}

export interface ISearchIssue extends Omit<IIssue, 'project'> {
  project: Pick<IProject, '_id' | 'name' | 'key' | 'color'>;
}

export interface ISearchResults {
  issues: ISearchIssue[];
  projects: IProject[];
  members: IUser[];
}

export interface IBurndownData {
  sprintName: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  data: Array<{
    date: string;
    ideal: number;
    actual: number;
  }>;
}

export type IVelocityData = Array<{
  sprintName: string;
  committed: number;
  completed: number;
}>;

export interface IIssueBreakdown {
  byType: Record<IssueType, number>;
  byPriority: Record<IssuePriority, number>;
  byStatus: Record<IssueStatus, number>;
  byAssignee: Array<{ user: IUser; count: number }>;
}

export interface ISprintReport {
  sprint: ISprint;
  completedIssues: IIssue[];
  incompleteIssues: IIssue[];
  addedDuringSprintCount: number;
  velocityPoints: number;
  teamContributions: Array<{
    user: IUser;
    issuesCompleted: number;
    storyPoints: number;
  }>;
}
