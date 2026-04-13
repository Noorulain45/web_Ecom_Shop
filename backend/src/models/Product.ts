import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  category: string;
  images: string[];
  colors: string[];
  sizes: string[];
  colorImages: Map<string, string[]>;
  stock: number;
  sales: number;
  rating: number;
  reviews: number;
  isNewArrival: boolean;
  isTopSelling: boolean;
  loyaltyOnly: boolean;
  hybrid: boolean;
  style?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    category: { type: String, required: true },
    images: [{ type: String }],
    colors: [{ type: String }],
    sizes: [{ type: String }],
    colorImages: { type: Map, of: [String], default: {} },
    stock: { type: Number, default: 0, min: 0 },
    sales: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    style: { type: String, default: "" },
    isNewArrival: { type: Boolean, default: false },
    isTopSelling: { type: Boolean, default: false },
    loyaltyOnly: { type: Boolean, default: false },
    hybrid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
export default Product;
