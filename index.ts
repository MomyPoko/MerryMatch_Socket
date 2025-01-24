import express, { Request, Response } from "express";
import cors from "cors";
import http from "http";
import { Server, Socket } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: "*" }));

const server = http.createServer(app);

console.log("Allowed Origins:", process.env.FRONTEND_URL);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

declare global {
  var onlineUsers: Map<string, string>;
  var chatSocket: Socket;
}

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);
  global.chatSocket = socket;

  socket.on("addUser", (userId) => {
    console.log("User added:", userId);
    onlineUsers.set(userId, socket.id);
  });

  socket.on("sendMessage", (data) => {
    // console.log("Message received on server:", data);

    const sendUserSocket = onlineUsers.get(data.to);

    if (sendUserSocket) {
      console.log(
        `Sending message to ${data.to}, socket id: ${sendUserSocket}`
      );

      socket.to(sendUserSocket).emit("receiveMessage", {
        from: data.from,
        msg: data.msg,
      });
    } else {
      console.log(`User ${data.to} is not online`);
    }
  });

  socket.on("disconnect", () => {
    // console.log(`User disconnected: ${socket.id}`);
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        onlineUsers.delete(key);
        console.log(`Removed user ${key} from onlineUsers`);
      }
    });
  });
});

app.get("/", (req: Request, res: Response) => {
  res.json("Welcome to the Socket.IO server!");
});

server.listen(port, () => {
  console.log(`Server API is running at ${port}`);
});
