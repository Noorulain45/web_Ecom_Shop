import mongoose, { Schema, Document, Model } from "mongoose";

export type OrderStatus = "pending" | "processing" | "delivered" | "cancelled" | "returned";

interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  orderId: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "delivered", "cancelled", "returned"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
