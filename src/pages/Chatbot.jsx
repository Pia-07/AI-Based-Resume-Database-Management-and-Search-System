import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import ChartRenderer from "../components/ChartRenderer";


const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { sender: "hr", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Temporary thinking message
    setMessages((prev) => [...prev, { sender: "ai", text: "Thinking..." }]);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });

      const data = await res.json();

      setMessages((prev) => [
  ...prev.slice(0, -1),
  {
    sender: "ai",
    text: data.reply || null,
    chart: data.chart || null,
  },
]);

    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "ai", text: "❌ Server error. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{ marginBottom: "12px" }}>AI Recruiter Chat</h2>

      <div
        style={{
          height: "420px",
          overflowY: "auto",
          background: "#fff",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.sender === "hr" ? "right" : "left",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "10px 14px",
                borderRadius: "16px",
                background: m.sender === "hr" ? "#2563eb" : "#f1f5f9",
                color: m.sender === "hr" ? "#fff" : "#000",
                maxWidth: "70%",
                wordWrap: "break-word",
              }}
            >
             {m.text && <div>{m.text}</div>}
  {m.chart && <ChartRenderer chart={m.chart} />}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", marginTop: "12px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask hiring requirements..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            marginLeft: "10px",
            padding: "10px 18px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          Send
        </button>
      </div>
    </DashboardLayout>
  );
};

export default Chatbot;
