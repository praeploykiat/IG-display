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

// Load environment variables
require('dotenv').config({ path: './.env' }); // Ensure .env is loaded correctly
const dbPassword = process.env.DB_PASSWORD;

// Connect MongoDB
mongoose.connect(`mongodb+srv://praeploy05:${dbPassword}@ig-display.mxwde.mongodb.net/?retryWrites=true&w=majority&appName=IG-Display`)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Failed to connect to MongoDB Atlas", err));

app.use(cors());
app.use(express.json());

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, "../frontend")));

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

// Start server
const port = process.env.PORT || 3000;  // Default port 3000
server.listen(port, () => console.log(`Server running on http://localhost:${port}`));
