import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate(); // ✅ FIX: define navigate

  return (
    <div
      className="sidebar"
      style={{
        width: "220px",
        background: "#FFFFFF",
        height: "100vh",
        padding: "20px",
        boxShadow: "2px 0 6px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column", // ✅ vertical layout
        gap: "12px",
      }}
    >
      <h3 style={{ marginBottom: "20px" }}>SmartHire</h3>

      <button style={btnStyle} onClick={() => navigate("/chatbot")}>
        Chatbot
      </button>

      <button style={btnStyle} onClick={() => navigate("/upload")}>
        Upload Resume
      </button>

      <button style={btnStyle} onClick={() => navigate("/analytics")}>
        Analytics
      </button>
    </div>
  );
};

const btnStyle = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  background: "#247f8b",
  cursor: "pointer",
  textAlign: "left",
  fontWeight: "500",
};

export default Sidebar;
