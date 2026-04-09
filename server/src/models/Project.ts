import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type ProjectRole = 'lead' | 'member';
export type ProjectStatus = 'active' | 'archived';

export interface IProjectMemberEntry {
  user: Types.ObjectId;
  role: ProjectRole;
  addedAt: Date;
}

export interface IProjectDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  key: string;
  description?: string;
  organisation: Types.ObjectId;
  lead?: Types.ObjectId;
  members: IProjectMemberEntry[];
  status: ProjectStatus;
  icon?: string;
  color?: string;
  issueCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IProjectModel extends Model<IProjectDocument> {
  generateKey(name: string): string;
}

const ProjectMemberSchema = new Schema<IProjectMemberEntry>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['lead', 'member'], default: 'member' },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProjectDocument, IProjectModel>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    key: { type: String, required: true, uppercase: true, trim: true, minlength: 2, maxlength: 6 },
    description: { type: String },
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    lead: { type: Schema.Types.ObjectId, ref: 'User' },
    members: { type: [ProjectMemberSchema], default: [] },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    icon: { type: String },
    color: { type: String },
    issueCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// key must be unique per organisation, not globally
ProjectSchema.index({ organisation: 1, key: 1 }, { unique: true });

ProjectSchema.statics.generateKey = function (name: string): string {
  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  // Take first letter of each word, up to 6 chars
  return words
    .map((word) => word[0])
    .join('')
    .slice(0, 6)
    .toUpperCase();
};

const Project = mongoose.model<IProjectDocument, IProjectModel>('Project', ProjectSchema);

export default Project;
