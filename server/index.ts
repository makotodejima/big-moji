require('dotenv').config()
import express from "express";
import http from "http";
// import { Server, Socket } from "socket.io";
import blocks from "./routes/blocks";
import operations from "./routes/operations";
import test from "./routes/test";


const app = express();
const server = http.createServer(app);
// const io = new Server(server);
app.use(express.json());
app.use("/test", test);

app.use("/", express.static("dist"));
app.use("/test", test);
app.use("/blocks", blocks);
app.use("/operations", operations);

// io.on("connection", (socket: Socket) => {
//   console.log("a user connected");
//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//   });
//   socket.on("new message", (message) => {
//     console.log("Received message: ", message);
//     socket.broadcast.emit("broadcast", message);
//   });
// });

server.listen(3000, () => {
  console.log("Listening on *:3000");
});
