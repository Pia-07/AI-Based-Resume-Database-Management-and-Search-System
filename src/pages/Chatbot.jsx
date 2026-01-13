import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add HR message
    const newMessages = [...messages, { sender: "hr", text: input }];
    setMessages(newMessages);
    setInput("");

    // Show thinking bubble
    setMessages([...newMessages, { sender: "ai", text: "Thinking..." }]);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: input })
      });

      const data = await res.json();

      // Replace thinking with real reply
      setMessages([...newMessages, { sender: "ai", text: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { sender: "ai", text: "Server error. Try again." }]);
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "15px" }}>
        AI Recruiter Chat
      </h2>

      {/* Chat Box */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "15px",
          height: "420px",
          overflowY: "auto",
          border: "1px solid #e5e7eb"
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.sender === "hr" ? "right" : "left",
              marginBottom: "12px"
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "10px 14px",
                borderRadius: "18px",
                background: m.sender === "hr" ? "#2563eb" : "#f1f5f9",
                color: m.sender === "hr" ? "#fff" : "#000",
                maxWidth: "70%"
              }}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div
        style={{
          display: "flex",
          marginTop: "15px",
          background: "#fff",
          padding: "10px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb"
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask hiring requirements..."
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            outline: "none",
            fontSize: "15px"
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            background: "#2563eb",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </div>
    </DashboardLayout>
  );
};

export default Chatbot;
