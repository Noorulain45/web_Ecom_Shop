import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "user" | "admin" | "superadmin";
export type AuthProvider = "local" | "google" | "github" | "discord";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  provider: AuthProvider;
  providerId?: string;
  isBlocked: boolean;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
    avatar: { type: String },
    provider: { type: String, enum: ["local", "google", "github", "discord"], default: "local" },
    providerId: { type: String },
    isBlocked: { type: Boolean, default: false },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
