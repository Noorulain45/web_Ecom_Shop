import "dotenv/config";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server as SocketIOServer, Socket } from "socket.io";

import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import cartRoutes from "./routes/cart";
import userRoutes from "./routes/users";
import reviewRoutes from "./routes/reviews";
import uploadRoutes from "./routes/upload";
import dashboardRoutes from "./routes/dashboard";
import paymentRoutes from "./routes/payments";

const app = express();
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const PORT = parseInt(process.env.PORT || "4000", 10);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// ✅ Stripe webhook MUST use raw body (NO custom middleware needed)
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// ✅ Normal JSON parsing for all other routes
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  path: "/api/socket",
  cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] },
});

(global as any).__io = io;

io.on("connection", (socket: Socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on("register_role", (role: string) => {
    if (role === "admin" || role === "superadmin") {
      socket.join("admins");
      console.log(`[socket] ${socket.id} joined admins room`);
    }
  });

  socket.on("join_product", (productId: string) => {
    socket.join(`product:${productId}`);
  });

  socket.on("leave_product", (productId: string) => {
    socket.leave(`product:${productId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`> Backend ready on http://localhost:${PORT}`);
});
