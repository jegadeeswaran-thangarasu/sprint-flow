import { Document, Types } from 'mongoose';

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

export interface IProject extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  key: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
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
    }
  }
}
