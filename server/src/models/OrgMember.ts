import mongoose, { Document, Schema, Types } from 'mongoose';
import { OrgRole, OrgStatus } from '../types';

export interface IOrgMemberDocument extends Document {
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

const OrgMemberSchema = new Schema<IOrgMemberDocument>(
  {
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true, lowercase: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    status: { type: String, enum: ['invited', 'active', 'suspended'], default: 'invited' },
    inviteToken: { type: String },
    inviteTokenExpiry: { type: Date },
    joinedAt: { type: Date },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

OrgMemberSchema.index({ organisation: 1, email: 1 }, { unique: true });

const OrgMember = mongoose.model<IOrgMemberDocument>('OrgMember', OrgMemberSchema);

export default OrgMember;
