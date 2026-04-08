export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface IProject {
  _id: string;
  name: string;
  description: string;
  key: string;
  owner: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IIssue {
  _id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done';
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'story' | 'bug' | 'task' | 'subtask';
  project: string;
  assignee?: string;
  reporter: string;
  sprint?: string;
  storyPoints?: number;
  labels: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
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
