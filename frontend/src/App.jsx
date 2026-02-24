import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null);
  // 🆕 NEW STATE FOR SIDEBAR
  const [sessions, setSessions] = useState([]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // 🆕 LOAD ALL SESSIONS
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/interview/history"
      );
      setSessions(res.data);
    } catch (error) {
      console.error("Failed to load sessions");
    }
  };

  // 🆕 LOAD SINGLE SESSION HISTORY
  const loadSessionHistory = async (id) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/interview/history/${id}`
      );

      setSessionId(id);

      // convert backend history format to your frontend format
      const formattedChat = res.data.history.map((msg) => ({
        role: msg.role === "assistant" ? "ai" : "user",
        text: msg.message,
      }));

      setChat(formattedChat);
    } catch (error) {
      console.error("Failed to load chat history");
    }
  };

  const startInterview = async () => {
  if (!company) {
    alert("Enter company name");
    return;
  }

  try {
    const res = await axios.post(
      "http://localhost:5000/api/interview/start",
      { company }
    );

    const newSessionId = res.data.sessionId;

    setSessionId(newSessionId);
    setMode("interview");

    const firstQuestionRes = await axios.post(
      "http://localhost:5000/api/interview/chat",
      {
        sessionId: newSessionId,
        message: "Begin the interview and ask Question 1 immediately."
      }
    );

    setChat([
      { role: "ai", text: firstQuestionRes.data.reply }
    ]);

    loadSessions();

  } catch (error) {
    console.error(error);
    alert("Failed to start interview");
  }
};

  const sendMessage = async () => {

  if (!message.trim() || !sessionId) return;

  const userText = message;

  setMessage("");

  setChat(prev => [...prev, { role: "user", text: userText }]);

  setLoading(true);

  try {

    if (mode === "interview") {

      await askBotQuestion(sessionId, userText);

    } else if (mode === "normal") {

      const res = await axios.post(
        "http://localhost:5000/api/interview/chat-normal",
        {
          sessionId,
          message: userText
        }
      );

      setChat(prev => [
        ...prev,
        { role: "ai", text: res.data.reply }
      ]);
    }

  } catch (error) {
    console.error(error);
    alert("Error sending message");
  }

  setLoading(false);
};

  const askBotQuestion = async (session, userInput) => {
    const res = await axios.post(
      "http://localhost:5000/api/interview/chat",
      {
        sessionId: session,
        message: userInput,
      }
    );

    setChat((prev) => [...prev, { role: "ai", text: res.data.reply }]);
  };

  const endInterview = async () => {
    if (!sessionId) return;

    try {
      const res = await axios.post(
        "http://localhost:5000/api/interview/end",
        { sessionId }
      );

      const { totalQuestions } = res.data;

      let score = totalQuestions * 10;
      if (score > 100) score = 100;

      let strength =
        score > 80
          ? "Excellent"
          : score > 60
          ? "Good"
          : score > 40
          ? "Average"
          : "Needs Improvement";

      alert(
        `Interview Ended\n\nTotal Questions: ${totalQuestions}\nScore: ${score}/100\nStrength: ${strength}`
      );

      setSessionId(null);
      setChat([]);
      setCompany("");

      loadSessions(); // 🆕 refresh sidebar
    } catch (error) {
      console.error(error);
      alert("Failed to end interview");
    }
  };
const startNormalChat = async () => {
  try {

    const res = await axios.post(
      "http://localhost:5000/api/interview/chat-normal/start"
    );

    const newSessionId = res.data.sessionId;

    setSessionId(newSessionId);
    setMode("normal");

    setChat([
      {
        role: "ai",
        text: "Ask any technical question 😊"
      }
    ]);

    loadSessions();

  } catch (error) {
    console.error(error);
    alert("Failed to start normal chat");
  }
};
  return (
    <div className="app">

  {/* LEFT SIDEBAR */}
  <div className="sidebar">

    <h2>AI Interview</h2>

    <button className="new-btn" onClick={() => {
      setSessionId(null);
      setChat([]);
      setCompany("");
    }}>
      + New Interview
    </button>
     <button
  className="normal-btn"
   onClick={startNormalChat}
>
  💬 Normal Technical Chat
</button>
    <div className="history-section">
      {sessions.map((session) => (
        <div
          key={session._id}
          className={`history-item ${sessionId === session._id ? "active" : ""}`}
          onClick={() => loadSessionHistory(session._id)}
        >
          <strong>{session.company}</strong>
          <small>
            {new Date(session.createdAt).toLocaleDateString()}
          </small>
        </div>
      ))}
    </div>
  </div>


  {/* RIGHT CHAT AREA */}
  <div className="chat-container">

    <div className="chat-header">
      <h3>Technical Interview</h3>

      {!sessionId && (
        <div className="start-section">
          <input
            placeholder="Company Name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <button className="start-btn" onClick={startInterview}>
            Start Interview
          </button>
        </div>
      )}

      {sessionId && (
        <button className="end-btn" onClick={endInterview}>
          End Interview
        </button>
      )}
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