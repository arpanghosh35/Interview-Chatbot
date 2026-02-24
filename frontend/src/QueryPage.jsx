import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function QueryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId: initSessionId } = location.state || {};
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

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const loadSessions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/interview/history");
      setSessions(res.data.filter(s => s.mode === "normal"));
    } catch { console.error("Failed to load query sessions"); }
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
    } catch { console.error("Failed to load history"); }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userText = message;
    setMessage("");
    setChat(prev => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/interview/chat-normal", { sessionId, message: userText });
      setChat(prev => [...prev, { role: "ai", text: res.data.reply }]);
    } catch { console.error(); }

    setLoading(false);
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Query History</h2>
        {sessions.map(s => (
          <div key={s._id} className={`history-item ${s._id === sessionId ? "active" : ""}`} onClick={() => loadSessionHistory(s._id)}>
            <small>{new Date(s.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="chat-container">
        <div className="chat-header">
          <h3>Query / Chat Mode</h3>
          <button className="end-btn" onClick={() => navigate("/")}>End Chat</button>
        </div>

        <div className="chat-body">
          {chat.map((m, i) => <div key={i} className={`message ${m.role}`}>{m.text}</div>)}
          {loading && <div className="message ai"><div className="typing"><span></span><span></span><span></span></div></div>}
          <div ref={chatEndRef}></div>
        </div>

        <div className="chat-input">
          <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key==="Enter" && sendMessage()} placeholder="Type your question..." />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}