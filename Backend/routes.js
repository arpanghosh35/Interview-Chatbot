
import express from "express";
import Session from "./model/Session.js";

import { startConversation } from "./controllers/chat.js";
import { createInterview } from "./controllers/chat.js";
import { generateReport } from "./controllers/chat.js";
import { chatHistory } from "./controllers/chat.js";
import { askTechnicalQuestion } from "./controllers/chat.js";
import {
  startNormalChat,
  normalChatMessage
} from "./chat.js";
const router = express.Router();

  // NORMAL CHAT ROUTES


router.post("/chat-normal/start", startNormalChat);

router.post("/chat-normal", normalChatMessage);

 /*  GET ALL SESSIONS (For Sidebar)
   URL: GET /api/interview/history */


router.get("/history", async (req, res) => {
  try {
    const sessions = await Session.find()
      .sort({ createdAt: -1 })
      .select("_id company createdAt");

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


 /*  GET SINGLE SESSION (Load full chat)
   URL: GET /api/interview/history/:sessionId*/

router.get("/history/:sessionId", chatHistory);

 //  START INTERVIEW

router.post("/start", startConversation);
 //  CHAT MESSAGE
router.post("/chat", createInterview);

 //  ASK TECHNICAL QUESTION
router.post("/ask", askTechnicalQuestion);
// end interview
router.post("/end", generateReport);

export default router;