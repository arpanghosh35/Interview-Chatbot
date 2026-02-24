import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  // ---------------- States ----------------
  const [mode, setMode] = useState(null); // "interview" or "query"
  const [company, setCompany] = useState(""); // Company name in interview mode
  const [sessionId, setSessionId] = useState(null);
  const [chat, setChat] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    loadSessions();
  }, []);

  // ---------------- Load All Sessions ----------------
  const loadSessions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/interview/history");
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };

  // ---------------- Load Single Session History ----------------
  const loadSessionHistory = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/interview/history/${id}`);
      setSessionId(id);
      const formattedChat = res.data.history.map((msg) => ({
        role: msg.role === "assistant" ? "ai" : "user",
        text: msg.message,
      }));
      setChat(formattedChat);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  // ---------------- Start Interview ----------------
  const startInterview = async () => {
    if (!company.trim()) return alert("Enter a company name");
    try {
      const res = await axios.post("http://localhost:5000/api/interview/start", { company });
      const newSessionId = res.data.sessionId;
      setSessionId(newSessionId);
      setMode("interview");

      // Ask first question automatically
      const firstQ = await axios.post("http://localhost:5000/api/interview/chat", {
        sessionId: newSessionId,
        message: "Begin the interview and ask Question 1 immediately."
      });
      setChat([{ role: "ai", text: firstQ.data.reply }]);
      loadSessions();
    } catch (err) {
      console.error(err);
      alert("Failed to start interview");
    }
  };

  // ---------------- Start Query Mode ----------------
  const startQuery = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/interview/chat-normal/start");
      const newSessionId = res.data.sessionId;
      setSessionId(newSessionId);
      setMode("query");
      setChat([{ role: "ai", text: "Ask any technical question 😊" }]);
      loadSessions();
    } catch (err) {
      console.error(err);
      alert("Failed to start query mode");
    }
  };

  // ---------------- Send Message ----------------
  const sendMessage = async () => {
    if (!message.trim() || !sessionId) return;
    const userText = message;
    setMessage("");
    setChat(prev => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      let res;
      if (mode === "interview") {
        res = await axios.post("http://localhost:5000/api/interview/chat", { sessionId, message: userText });
      } else if (mode === "query") {
        res = await axios.post("http://localhost:5000/api/interview/chat-normal", { sessionId, message: userText });
      }
      setChat(prev => [...prev, { role: "ai", text: res.data.reply }]);
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    }
    setLoading(false);
  };

  // ---------------- End Interview ----------------
  const endInterview = async () => {
    if (!sessionId) return;
    try {
      const res = await axios.post("http://localhost:5000/api/interview/end", { sessionId });
      alert(`Interview ended.\nTotal Questions: ${res.data.totalQuestions}`);
      setSessionId(null);
      setChat([]);
      setCompany("");
      setMode(null);
      loadSessions();
    } catch (err) {
      console.error(err);
      alert("Failed to end interview");
    }
  };

  // ---------------- Render Mode Selection ----------------
  if (!mode) {
    return (
      <div className="mode-selection">
        <h1>Choose Mode</h1>
        <div className="mode-buttons">
          <button onClick={startQuery}>💬 Technical Query</button>
          <button onClick={() => setMode("interview")}>👔 Interview Mode</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ---------------- Sidebar ---------------- */}
      <div className="sidebar">
        <h2>{mode === "interview" ? "Interview Mode" : "Query Mode"}</h2>

        {/* Company input only in Interview mode */}
        {mode === "interview" && !sessionId && (
          <div className="start-section">
            <input
              placeholder="Company Name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <button className="start-btn" onClick={startInterview}>
              Start
            </button>
          </div>
        )}

        <div className="history-section">
          {sessions.map(s => (
            <div
              key={s._id}
              className={`history-item ${s._id === sessionId ? "active" : ""}`}
              onClick={() => loadSessionHistory(s._id)}
            >
              <strong>{s.company || "Query Session"}</strong>
              <small>{new Date(s.createdAt).toLocaleDateString()}</small>
            </div>
          ))}
        </div>

        {sessionId && (
          <button className="end-btn" onClick={endInterview}>
            End {mode === "interview" ? "Interview" : "Query"}
          </button>
        )}
      </div>

      {/* ---------------- Chat Area ---------------- */}
      <div className="chat-container">
        <div className="chat-header">
          <h3>{mode === "interview" ? "Technical Interview" : "Technical Query"}</h3>
        </div>

        <div className="chat-body">
          {chat.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
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
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              placeholder="Type your answer..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;