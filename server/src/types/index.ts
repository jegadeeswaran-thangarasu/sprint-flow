import { Document, Types } from 'mongoose';
import { IProjectDocument } from '../models/Project';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: 'admin' | 'member';
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface IIssue extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done';
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'story' | 'bug' | 'task' | 'subtask';
  project: Types.ObjectId;
  assignee?: Types.ObjectId;
  reporter: Types.ObjectId;
  sprint?: Types.ObjectId;
  storyPoints?: number;
  labels: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
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

export type TApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export type TJwtPayload = {
  userId: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: TJwtPayload;
      orgMember?: IOrgMember;
      project?: IProjectDocument;
    }
  }
}
