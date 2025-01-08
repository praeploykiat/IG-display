const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema({
  instagram: String,
  quote: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Queue", queueSchema);
