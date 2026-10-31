import mongoose, { Schema, Model, Document } from "mongoose";
import { IAutomationLog } from "@/types";

export interface AutomationLogDocument extends Omit<IAutomationLog, "_id">, Document {}

const AutomationLogSchema = new Schema<AutomationLogDocument>(
  {
    pageId: {
      type: String,
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ["comment", "message", "order", "stock_inquiry", "ai_reply", "post_publish"],
      default: "message",
    },
    senderId: {
      type: String,
      default: "",
    },
    senderName: {
      type: String,
      default: "Customer",
    },
    inputMessage: {
      type: String,
      default: "",
    },
    replyMessage: {
      type: String,
      default: "",
    },
    handledBy: {
      type: String,
      default: "System",
    },
    status: {
      type: String,
      enum: ["success", "failed", "duplicate"],
      default: "success",
      index: true,
    },
    error: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent recompilation in hot reload
const AutomationLog: Model<AutomationLogDocument> =
  mongoose.models.AutomationLog ||
  mongoose.model<AutomationLogDocument>("AutomationLog", AutomationLogSchema);

export default AutomationLog;
