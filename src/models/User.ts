import mongoose, { Schema, Model, Document } from "mongoose";
import { IUser } from "@/types";

export interface UserDocument extends Omit<IUser, "_id" | "id">, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "merchant"],
      default: "merchant",
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

export default User;
