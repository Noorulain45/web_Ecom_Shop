import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer, Socket } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Make io accessible to API routes via global
  (global as any).__io = io;

  io.on("connection", (socket: Socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // Client tells us their role so we can put admins in the "admins" room
    socket.on("register_role", (role: string) => {
      if (role === "admin" || role === "superadmin") {
        socket.join("admins");
        console.log(`[socket] ${socket.id} joined admins room`);
      }
    });

    socket.on("join_product", (productId: string) => {
      socket.join(`product:${productId}`);
      console.log(`[socket] ${socket.id} joined product:${productId}`);
    });

    socket.on("leave_product", (productId: string) => {
      socket.leave(`product:${productId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
