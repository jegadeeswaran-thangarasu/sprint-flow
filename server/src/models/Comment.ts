import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IReactionSubdoc {
  emoji: string;
  users: Types.ObjectId[];
}

export interface ICommentDocument extends Document {
  _id: Types.ObjectId;
  content: string;
  issue: Types.ObjectId;
  project: Types.ObjectId;
  organisation: Types.ObjectId;
  author: Types.ObjectId;
  isEdited: boolean;
  editedAt?: Date;
  mentions: Types.ObjectId[];
  reactions: IReactionSubdoc[];
  parentComment?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ICommentModel extends Model<ICommentDocument> {}

const ReactionSchema = new Schema<IReactionSubdoc>(
  {
    emoji: { type: String, required: true, trim: true },
    users: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { _id: false }
);

const CommentSchema = new Schema<ICommentDocument, ICommentModel>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 10000,
    },
    issue: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organisation: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    mentions: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    reactions: { type: [ReactionSchema], default: [] },
    parentComment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  },
  { timestamps: true }
);

CommentSchema.index({ issue: 1, createdAt: 1 });
CommentSchema.index({ issue: 1, parentComment: 1 });

const Comment = mongoose.model<ICommentDocument, ICommentModel>('Comment', CommentSchema);

export default Comment;
