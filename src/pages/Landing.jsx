import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: "white", minHeight: "100vh" }}>
      <Navbar />

      <div style={styles.hero}>
        <h1 style={styles.title}>
          AI Powered Resume Search & Hiring Platform
        </h1>

        <p style={styles.subtitle}>
          Upload resumes, search candidates instantly and chat with AI recruiter.
        </p>

        <button style={styles.cta} onClick={() => navigate("/signup")}>
          Get Started
        </button>
      </div>
    </div>
  );
};

const styles = {
  hero: {
    marginTop: "120px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  title: {
    fontSize: "48px",
    fontWeight: "800",
    textAlign: "center",
    maxWidth: "900px"
  },
  subtitle: {
    marginTop: "16px",
    fontSize: "18px",
    color: "#6b7280"
  },
  cta: {
    marginTop: "30px",
    padding: "12px 30px",
    background: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer"
  }
};

export default Landing;
