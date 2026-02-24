import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId: initSessionId, company } = location.state || {};
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(initSessionId);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!sessionId) navigate("/");
    else loadSessions();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const loadSessions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/interview/history");
      setSessions(res.data.filter(s => s.mode === "interview"));
    } catch {
      console.error("Failed to load sessions");
    }
  };

  const loadSessionHistory = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/interview/history/${id}`);
      setSessionId(id);
      const formatted = res.data.history.map(m => ({
        role: m.role === "assistant" ? "ai" : "user",
        text: m.message
      }));
      setChat(formatted);
    } catch {
      console.error("Failed to load history");
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userText = message;
    setMessage("");
    setChat(prev => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/interview/chat", { sessionId, message: userText });
      setChat(prev => [...prev, { role: "ai", text: res.data.reply }]);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const endInterview = async () => {
    try {
      await axios.post("http://localhost:5000/api/interview/end", { sessionId });
      navigate("/");
    } catch {
      alert("Failed to end interview");
    }
  };

  // Load first AI question if new session
  useEffect(() => {
    if (initSessionId && chat.length === 0) {
      axios.post("http://localhost:5000/api/interview/chat", {
        sessionId: initSessionId,
        message: "Begin the interview and ask Question 1 immediately."
      }).then(res => setChat([{ role: "ai", text: res.data.reply }]));
    }
  }, [initSessionId]);

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Interview History</h2>
        {sessions.map(s => (
          <div key={s._id} className={`history-item ${s._id === sessionId ? "active" : ""}`} onClick={() => loadSessionHistory(s._id)}>
            <strong>{s.company}</strong>
            <small>{new Date(s.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="chat-container">
        <div className="chat-header">
          <h3>{company || "Interview Mode"}</h3>
          <button className="end-btn" onClick={endInterview}>End Interview</button>
        </div>

        <div className="chat-body">
          {chat.map((m, i) => <div key={i} className={`message ${m.role}`}>{m.text}</div>)}
          {loading && <div className="message ai"><div className="typing"><span></span><span></span><span></span></div></div>}
          <div ref={chatEndRef}></div>
        </div>

        <div className="chat-input">
          <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key==="Enter" && sendMessage()} placeholder="Type your answer..." />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}