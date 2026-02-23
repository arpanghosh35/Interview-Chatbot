import mongoose from "mongoose";

/* =========================
   MESSAGE SCHEMA
========================= */

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

/* =========================
   SESSION SCHEMA
========================= */

const sessionSchema = new mongoose.Schema({
  _id: {
    type: String   // ✅ Allow UUID string as primary key
  },
  company: {
    type: String,
    required: true
  },
  history: {
    type: [messageSchema],
    default: []
  },
  questionCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model("Session", sessionSchema);