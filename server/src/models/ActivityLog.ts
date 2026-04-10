import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export const ACTIVITY_ACTIONS = [
  'created',
  'updated',
  'status_changed',
  'priority_changed',
  'assignee_changed',
  'sprint_changed',
  'comment_added',
  'comment_deleted',
  'attachment_added',
  'watcher_added',
  'watcher_removed',
  'epic_linked',
  'parent_changed',
] as const;

export type TActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export interface IActivityLogDocument extends Document {
  _id: Types.ObjectId;
  issue: Types.ObjectId;
  project: Types.ObjectId;
  organisation: Types.ObjectId;
  actor: Types.ObjectId;
  action: TActivityAction;
  field?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IActivityLogModel extends Model<IActivityLogDocument> {}

const ActivityLogSchema = new Schema<IActivityLogDocument, IActivityLogModel>(
  {
    issue: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    field: { type: String, trim: true },
    oldValue: { type: String },
    newValue: { type: String },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ issue: 1, createdAt: -1 });

const ActivityLog = mongoose.model<IActivityLogDocument, IActivityLogModel>(
  'ActivityLog',
  ActivityLogSchema
);

export default ActivityLog;
