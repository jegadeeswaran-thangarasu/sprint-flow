import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IIssueCounterDocument extends Document {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  count: number;
}

interface IIssueCounterModel extends Model<IIssueCounterDocument> {}

const IssueCounterSchema = new Schema<IIssueCounterDocument, IIssueCounterModel>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: false }
);

const IssueCounter = mongoose.model<IIssueCounterDocument, IIssueCounterModel>(
  'IssueCounter',
  IssueCounterSchema
);

export default IssueCounter;
