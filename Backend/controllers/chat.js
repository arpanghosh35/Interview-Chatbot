import { v4 as uuidv4 } from "uuid";
import { createInterviewAgent } from "./technical.js";
import Session from "../model/Session.js";

 // START CONVERSATION


export const startConversation = async (req, res) => {
  try {
    const { company } = req.body;

    const sessionId = uuidv4();

    const newSession = new Session({
      _id: sessionId, // UUID as primary key
      company: company || "General",
      history: [],
      questionCount: 0
    });

    await newSession.save();

    res.json({
      message: "Interview session started",
      sessionId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to start session" });
  }
};



 // CREATE INTERVIEW (CHAT)


export const createInterview = async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message required" });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const agent = createInterviewAgent(session.company);

    // Build previous conversation text
    const historyText = session.history
      .map(item => `${item.role === "user" ? "User" : "AI"}: ${item.message}`)
      .join("\n");

    const finalPrompt = `
Previous Conversation:
${historyText}

User: ${message}
`;

    const aiReply = await agent.ask(finalPrompt);
    let userMessage = message;



    // Save user message
    session.history.push({
      role: "user",
      message: message
    });

    // Save AI reply
    session.history.push({
      role: "assistant",
      message: aiReply
    });

    session.questionCount++;

    await session.save();

    res.json({
      reply: aiReply,
      questionNumber: session.questionCount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Interview processing failed" });
  }
};



  // GENERATE REPORT


export const generateReport = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      message: "Interview Ended",
      totalQuestions: session.questionCount,
      fullConversation: session.history
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate report" });
  }
};



//   GET CHAT HISTORY


export const chatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      company: session.company,
      totalQuestions: session.questionCount,
      history: session.history
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};



 //  ASK TECHNICAL QUESTION (Standalone)


export const askTechnicalQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const agent = createInterviewAgent("Technical Expert");

    const prompt = `
You are a senior technical mentor.

Answer the following question clearly and concisely.
If it is coding related:
- Explain logic
- Provide example
- Give code snippet
- Mention time complexity if applicable

Question:
${question}
`;

    const answer = await agent.ask(prompt);

    res.json({
      question,
      answer
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate answer" });
  }
};


//   NORMAL CHAT START


export const startNormalChat = async (req, res) => {
  try {

    const sessionId = uuidv4();

    const newSession = new Session({
      _id: sessionId,
      company: "Normal Technical Chat",
      history: [],
      questionCount: 0
    });

    await newSession.save();

    res.json({
      message: "Normal chat started",
      sessionId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to start normal chat" });
  }
};


 //  NORMAL CHAT MESSAGE


export const normalChatMessage = async (req, res) => {
  try {

    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        error: "sessionId and message required"
      });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        error: "Session not found"
      });
    }

    // ⭐ Use assistant persona (not interviewer)
    const agent = createInterviewAgent("Technical Assistant");

    const historyText = session.history
      .map(item =>
        `${item.role === "user" ? "User" : "AI"}: ${item.message}`
      )
      .join("\n");

    const prompt = `
You are a friendly technical assistant.

Your task is to answer user technical questions.

Rules:
- Do NOT behave like an interviewer.
- Do NOT generate next questions.
- Do NOT continue conversation automatically.
- Just answer the user's query.
- If the question is technical → explain clearly.
- If coding question → provide example code if needed.
- If question is not technical → say you can help only with technical topics.

Conversation History:
${historyText}

User Question:
${message}
`;

    const reply = await agent.ask(prompt);

    session.history.push({
      role: "user",
      message
    });

    session.history.push({
      role: "assistant",
      message: reply
    });

    session.questionCount++;

    await session.save();

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Normal chat failed"
    });
  }
};