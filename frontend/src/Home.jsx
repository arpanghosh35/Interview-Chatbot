import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [company, setCompany] = useState("");

  const startInterview = async () => {
    if (!company) return alert("Enter company name");

    try {
      const res = await axios.post("http://localhost:5000/api/interview/start", { company });
      navigate("/interview", { state: { sessionId: res.data.sessionId, company } });
    } catch (error) {
      console.error(error);
      alert("Failed to start interview");
    }
  };

  const startQuery = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/interview/chat-normal/start");
      navigate("/query", { state: { sessionId: res.data.sessionId } });
    } catch (error) {
      console.error(error);
      alert("Failed to start query session");
    }
  };

  return (
    <div className="mode-selection">
      {!mode && (
        <>
          <h1>Select Mode</h1>
          <button className="start-btn" onClick={() => setMode("interview")}>Interview Mode</button>
          <button className="normal-btn" onClick={() => setMode("query")}>Query Mode</button>
        </>
      )}

      {mode === "interview" && (
        <div className="start-section">
          <h2>Interview Mode</h2>
          <input placeholder="Enter Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          <button onClick={startInterview}>Start Interview</button>
          <button onClick={() => setMode(null)}>Back</button>
        </div>
      )}

      {mode === "query" && (
        <div className="start-section">
          <h2>Query / Chat Mode</h2>
          <button onClick={startQuery}>Start Chat</button>
          <button onClick={() => setMode(null)}>Back</button>
        </div>
      )}
    </div>
  );
}