import mongoose, { Schema, Model, Document } from "mongoose";
import { IConnectedPage, IAutomationRule } from "@/types";

export interface ConnectedPageDocument extends Omit<IConnectedPage, "_id">, Document {}

const AutomationRuleSchema = new Schema<IAutomationRule>(
  {
    id: { type: String, required: true },
    keyword: { type: String, required: true, trim: true },
    matchType: {
      type: String,
      enum: ["exact", "contains"],
      default: "contains",
      required: true,
    },
    commentReply: { type: String, default: "", trim: true },
    sendPrivateInbox: { type: Boolean, default: false },
    inboxReply: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const ConnectedPageSchema = new Schema<ConnectedPageDocument>(
  {
    userId: {
      type: String,
      index: true,
      default: "user_demo",
      trim: true,
    },
    pageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    pageName: {
      type: String,
      required: true,
      trim: true,
    },
    pagePicture: {
      type: String,
      default: "",
    },
    pageAccessToken: {
      type: String,
      required: true,
      trim: true,
    },
    isWebhookSubscribed: {
      type: Boolean,
      default: false,
    },
    autoReplyEnabled: {
      type: Boolean,
      default: true,
    },
    defaultInboxReply: {
      type: String,
      default:
        "Hello! Thanks for reaching out. A member of our team will get back to you shortly.",
    },
    rules: {
      type: [AutomationRuleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent recompilation in hot reload
const ConnectedPage: Model<ConnectedPageDocument> =
  mongoose.models.ConnectedPage ||
  mongoose.model<ConnectedPageDocument>("ConnectedPage", ConnectedPageSchema);

export default ConnectedPage;
