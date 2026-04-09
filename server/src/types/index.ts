import { Document, Types } from 'mongoose';
import { IProjectDocument } from '../models/Project';

/** User shape as returned in JSON API responses */
export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
  createdAt: string;
  updatedAt: string;
}

export type ProjectRole = 'lead' | 'member';
export type ProjectStatus = 'active' | 'archived';

export interface IProjectMember {
  user: IUser;
  role: ProjectRole;
  addedAt: string;
}

export interface IProject extends Document {
  _id: Types.ObjectId;
  name: string;
  key: string;
  description?: string;
  organisation: Types.ObjectId;
  lead?: IUser;
  members: IProjectMember[];
  status: ProjectStatus;
  icon?: string;
  color?: string;
  issueCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type IssueType = 'story' | 'task' | 'bug' | 'epic' | 'subtask';
export type IssueStatus = 'backlog' | 'todo' | 'inprogress' | 'review' | 'done';
export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low';

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
  epic: IIssue | null;
  parent: IIssue | null;
  assignee: IUser | null;
  reporter: IUser;
  storyPoints: number | null;
  labels: string[];
  order: number;
  dueDate: string | null;
  watchers: IUser[];
  createdAt: string;
  updatedAt: string;
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
  epic: IIssue | null;
  parent: IIssue | null;
  sprint: ISprint | null;
  project: IProject;
}

export interface IOrganisation extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  owner: Types.ObjectId;
  plan: 'free' | 'pro';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type OrgRole = 'owner' | 'admin' | 'member';
export type OrgStatus = 'invited' | 'active' | 'suspended';

export interface IOrgMember extends Document {
  _id: Types.ObjectId;
  organisation: Types.ObjectId;
  user: Types.ObjectId | null;
  email: string;
  role: OrgRole;
  status: OrgStatus;
  inviteToken?: string;
  inviteTokenExpiry?: Date;
  joinedAt?: Date;
  invitedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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

export type TApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export type TJwtPayload = {
  userId: string;
  email: string;
};

export interface IBoardColumn {
  id: IssueStatus;
  label: string;
  issues: IIssue[];
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

declare global {
  namespace Express {
    interface Request {
      user?: TJwtPayload;
      orgMember?: IOrgMember;
      project?: IProjectDocument;
    }
  }
}
