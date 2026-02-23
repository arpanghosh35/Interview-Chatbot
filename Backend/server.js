import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import interviewRoutes from "./routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   MongoDB Connection
========================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });

/* =========================
   Routes
========================= */

app.use("/api/interview", interviewRoutes);

app.get("/", (req, res) => {
  res.send("Backend is alive");
});

/* =========================
   Server Start
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AI Technical Interview Platform running on port ${PORT}`);
});