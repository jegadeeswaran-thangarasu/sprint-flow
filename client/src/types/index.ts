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
