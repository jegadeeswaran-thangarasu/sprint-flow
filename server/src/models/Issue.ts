import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type IssueType = 'story' | 'task' | 'bug' | 'epic' | 'subtask';
export type IssueStatus = 'backlog' | 'todo' | 'inprogress' | 'review' | 'done';
export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low';

export interface IIssueAttachment {
  filename: string;
  url: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface IIssueDocument extends Document {
  _id: Types.ObjectId;
  key: string;
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  project: Types.ObjectId;
  organisation: Types.ObjectId;
  sprint: Types.ObjectId | null;
  epic?: Types.ObjectId | null;
  parent?: Types.ObjectId | null;
  assignee?: Types.ObjectId | null;
  reporter: Types.ObjectId;
  storyPoints?: number | null;
  labels: string[];
  order: number;
  dueDate?: Date | null;
  attachments: IIssueAttachment[];
  watchers: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

interface IIssueModel extends Model<IIssueDocument> {}

const AttachmentSchema = new Schema<IIssueAttachment>(
  {
    filename: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const IssueSchema = new Schema<IIssueDocument, IIssueModel>(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 500 },
    description: { type: String },
    type: {
      type: String,
      enum: ['story', 'task', 'bug', 'epic', 'subtask'],
      default: 'task',
    },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'inprogress', 'review', 'done'],
      default: 'backlog',
    },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium',
    },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    sprint: { type: Schema.Types.ObjectId, ref: 'Sprint', default: null },
    epic: { type: Schema.Types.ObjectId, ref: 'Issue', default: null },
    parent: { type: Schema.Types.ObjectId, ref: 'Issue', default: null },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storyPoints: { type: Number, min: 0, max: 100, default: null },
    labels: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
    attachments: { type: [AttachmentSchema], default: [] },
    watchers: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { timestamps: true }
);

IssueSchema.index({ project: 1, status: 1 });
IssueSchema.index({ project: 1, sprint: 1 });
IssueSchema.index({ project: 1, key: 1 }, { unique: true });
IssueSchema.index({ organisation: 1 });

const Issue = mongoose.model<IIssueDocument, IIssueModel>('Issue', IssueSchema);

export default Issue;
