import DashboardLayout from "../layouts/DashboardLayout";
import ChatMessage from "../components/ChatMessage";

const Chatbot = () => {
  return (
    <DashboardLayout>
      <h2>AI Recruiter Chat</h2>

      <div className="card" style={{ height: "420px", overflowY: "auto" }}>
        <ChatMessage sender="hr" text="We need Java freshers near Ahmedabad" />
        <ChatMessage sender="ai" text="Analyzing resumes from database..." />
        <ChatMessage sender="ai" text="Top candidates found near your location" />
      </div>

      <input
        placeholder="Ask hiring requirements..."
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "10px",
          borderRadius: "6px",
          border: "1px solid #CBD5E1"
        }}
      />
    </DashboardLayout>
  );
};

export default Chatbot;
