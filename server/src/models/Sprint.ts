import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Minimal Sprint model so Issue.sprint can reference Sprint.
 * Extend with sprint-specific fields when the sprints feature is built out.
 */
export interface ISprintDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  project: Types.ObjectId;
  organisation: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<ISprintDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
  },
  { timestamps: true }
);

SprintSchema.index({ project: 1 });

const Sprint = mongoose.model<ISprintDocument>('Sprint', SprintSchema);

export default Sprint;
