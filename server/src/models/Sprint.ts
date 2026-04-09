import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type SprintStatus = 'planning' | 'active' | 'completed';

export interface ISprintDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  goal?: string;
  project: Types.ObjectId;
  organisation: Types.ObjectId;
  status: SprintStatus;
  startDate: Date | null;
  endDate: Date | null;
  completedAt: Date | null;
  order: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface ISprintModel extends Model<ISprintDocument> {}

const SprintSchema = new Schema<ISprintDocument, ISprintModel>(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    goal: { type: String },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed'],
      default: 'planning',
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    order: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

SprintSchema.index({ project: 1, status: 1 });
SprintSchema.index({ project: 1, order: 1 });

const Sprint = mongoose.model<ISprintDocument, ISprintModel>('Sprint', SprintSchema);

export default Sprint;
