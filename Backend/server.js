import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import interviewRoutes from "./routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Use routes
app.use("/api/interview", interviewRoutes);

app.get("/", (req, res) => {
  res.send("Backend is alive");
});

app.listen(5000, () => {
  console.log("AI Technical Interview Platform running on port 5000");
});