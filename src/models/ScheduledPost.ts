import mongoose, { Schema, Model, Document } from "mongoose";
import { IScheduledPost } from "@/types";

export interface ScheduledPostDocument
  extends Omit<IScheduledPost, "_id">,
    Document {}

const ScheduledPostSchema = new Schema<ScheduledPostDocument>(
  {
    pageId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    caption: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "published", "failed"],
      default: "pending",
      index: true,
    },
    fbPostId: {
      type: String,
      default: "",
    },
    errorLog: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for high performance cron polling
ScheduledPostSchema.index({ status: 1, scheduledTime: 1 });

const ScheduledPost: Model<ScheduledPostDocument> =
  mongoose.models.ScheduledPost ||
  mongoose.model<ScheduledPostDocument>("ScheduledPost", ScheduledPostSchema);

export default ScheduledPost;
