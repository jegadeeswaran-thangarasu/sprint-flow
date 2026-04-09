import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IOrganisationDocument extends Document {
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

interface IOrganisationModel extends Model<IOrganisationDocument> {
  generateSlug(name: string): string;
}

const OrganisationSchema = new Schema<IOrganisationDocument, IOrganisationModel>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    logo: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

OrganisationSchema.statics.generateSlug = function (name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
};

const Organisation = mongoose.model<IOrganisationDocument, IOrganisationModel>(
  'Organisation',
  OrganisationSchema
);

export default Organisation;
