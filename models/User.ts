import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  role: 'admin' | 'superadmin';
  departments?: string[]; // e.g., ['CSE', 'ECE', 'IT'] (mainly for admins)
}

const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // In case of OAuth later, though we are using Credentials now
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
    },
    departments: {
      type: [String],
      required: function() {
        return this.role === 'admin';
      },
    },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
