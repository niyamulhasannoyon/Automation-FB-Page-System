import mongoose, { Schema, Model, Document } from "mongoose";
import { IOrder } from "@/types";

export interface OrderDocument extends Omit<IOrder, "_id">, Document {}

const OrderSchema = new Schema<OrderDocument>(
  {
    pageId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    customerPsid: {
      type: String,
      default: "",
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerAddress: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productId: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "cancelled"],
      default: "pending",
      index: true,
    },
    source: {
      type: String,
      enum: ["messenger_auto", "manual"],
      default: "messenger_auto",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ pageId: 1, status: 1, createdAt: -1 });

const Order: Model<OrderDocument> =
  mongoose.models.Order ||
  mongoose.model<OrderDocument>("Order", OrderSchema);

export default Order;
