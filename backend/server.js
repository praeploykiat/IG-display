const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const Queue = require("./models/Queue");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Connect MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/ig_queue", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.json());

// Serve Static Files
app.use(express.static(path.join(__dirname, "../frontend"))); // Updated

// Serve Uploaded Images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Multer Setup (File Upload)
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// API Endpoints
app.post("/api/submit", upload.single("image"), async (req, res) => {
  const { instagram, quote } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const newEntry = new Queue({ instagram, quote, imageUrl });
  await newEntry.save();

  io.emit("updateQueue"); // Notify clients to update
  res.json({ success: true });
});

app.get("/api/queue", async (req, res) => {
  const queue = await Queue.find().sort({ createdAt: 1 });
  res.json(queue);
});

app.delete("/api/queue/:id", async (req, res) => {
  await Queue.findByIdAndDelete(req.params.id);
  io.emit("updateQueue");
  res.json({ success: true });
});

// WebSockets for Live Updates
io.on("connection", (socket) => {
  console.log("Client connected");
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
