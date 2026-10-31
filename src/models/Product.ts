import mongoose, { Schema, Model, Document } from "mongoose";
import { IProduct } from "@/types";

export interface ProductDocument extends Omit<IProduct, "_id">, Document {}

const ProductSchema = new Schema<ProductDocument>(
  {
    pageId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    keywords: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying by page and searching
ProductSchema.index({ pageId: 1, name: 1 });

const Product: Model<ProductDocument> =
  mongoose.models.Product ||
  mongoose.model<ProductDocument>("Product", ProductSchema);

export default Product;
