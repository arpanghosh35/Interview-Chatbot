import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

const startInterview = async () => {
  if (!company) return alert("Enter company name");

  try {
    const res = await axios.post(
      "http://localhost:5000/api/interview/start",
      { company }
    );

    const newSessionId = res.data.sessionId;
    setSessionId(newSessionId);

    const greeting = `Hello! Welcome to your ${company} technical interview. Let's get started.`;
    setChat([{ role: "ai", text: greeting }]);

    // Bot first question immediately
    setTimeout(async () => {
      const firstQuestion = "Can you explain the concept of Operating System?";
      await askBotQuestion(newSessionId, firstQuestion);
    }, 1200);

  } catch (error) {
    console.error(error);
    alert("Failed to start interview");
  }
};

// Send message function
const sendMessage = async () => {
  if (!message.trim() || !sessionId) return;

  const userText = message;
  setMessage("");
  setChat((prev) => [...prev, { role: "user", text: userText }]);
  setLoading(true);

  try {
    await askBotQuestion(sessionId, userText);
  } catch (error) {
    console.error(error);
    alert("Error sending message");
  }

  setLoading(false);
};

// Helper function: bot asks question automatically
const askBotQuestion = async (session, userInput) => {
  const res = await axios.post(
    "http://localhost:5000/api/interview/chat",
    {
      sessionId: session,
      message: userInput, // send previous message as context
    }
  );

  // Add AI reply to chat
  setChat((prev) => [...prev, { role: "ai", text: res.data.reply }]);
};

 const endInterview = async () => {
  if (!sessionId) return;

  try {
    const res = await axios.post(
      "http://localhost:5000/api/interview/end",
      { sessionId }
    );

    const { totalQuestions, fullConversation } = res.data;

    // Example strength calculation (simple placeholder)
    let score = totalQuestions * 10; // assume 10 points per question
    if (score > 100) score = 100;
    let strength =
      score > 80
        ? "Excellent"
        : score > 60
        ? "Good"
        : score > 40
        ? "Average"
        : "Needs Improvement";

    // Show report nicely
    alert(
      `Interview Ended\n\nTotal Questions: ${totalQuestions}\nScore: ${score}/100\nStrength: ${strength}`
    );

    console.log("Full Conversation:", fullConversation); // optional: log full chat

    // Reset session
    setSessionId(null);
    setChat([]);
    setCompany("");
  } catch (error) {
    console.error(error);
    alert("Failed to end interview");
  }
};

  return (
    <div className="app">
      <div className="sidebar">
        <h2>AI Interview</h2>

        {!sessionId && (
          <>
            <input
              placeholder="Company Name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <button className="start-btn" onClick={startInterview}>
              Start Interview
            </button>
          </>
        )}

        {sessionId && (
          <>
            <p className="session">Session Active</p>
            <button className="end-btn" onClick={endInterview}>
              End Interview
            </button>
          </>
        )}
      </div>

      <div className="chat-container">
        <div className="chat-header">
          <h3>Technical Interview</h3>
        </div>

        <div className="chat-body">
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.role === "user" ? "user" : "ai"
              }`}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
  <div className="message ai">
    <div className="typing">
      <span></span><span></span><span></span>
    </div>
  </div>
)}
          <div ref={chatEndRef}></div>
        </div>

        {sessionId && (
          <div className="chat-input">
  <input
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    placeholder="Type your answer..."
    onKeyDown={(e) => {
      if (e.key === "Enter") sendMessage();
    }}
  />
  <button onClick={sendMessage}>Send</button>
</div>
        )}
      </div>
    </div>
  );
}

export default App;