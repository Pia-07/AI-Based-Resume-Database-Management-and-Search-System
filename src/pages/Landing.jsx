import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { warmUpBackend } from "../services/api";

const Landing = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Pre-warm backend on page load (Render free tier cold start)
  useEffect(() => {
    warmUpBackend();
  }, []);

  // Track mouse for gradient effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div style={styles.container}>
      <Navbar />

      {/* Animated gradient background */}
      <div
        style={{
          ...styles.gradientBg,
          background: `radial-gradient(
            600px at ${mousePosition.x}px ${mousePosition.y}px,
            rgba(99, 102, 241, 0.15),
            transparent 80%
          )`
        }}
      />

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent} className="animate-fadeIn">
          {/* Badge */}
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            AI-Powered Resume Analysis
          </div>

          {/* Main Headline */}
          <h1 style={styles.title}>
            Find Your Perfect Candidate
            <span style={styles.gradient}> in Seconds</span>
          </h1>

          {/* Subtitle */}
          <p style={styles.subtitle}>
            Upload resumes, leverage AI-powered search, and chat with intelligent insights.
            SmartHire makes hiring faster and smarter than ever before.
          </p>

          {/* CTA Buttons */}
          <div style={styles.ctaContainer}>
            <button
              style={styles.primaryCta}
              onClick={() => navigate("/signup")}
            >
              Get Started Free
              <span style={styles.ctaArrow}>→</span>
            </button>
            <button
              style={styles.secondaryCta}
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>

          {/* Trust Indicators */}
          <p style={styles.trustText}>
            ✨ Join 500+ companies improving hiring with AI
          </p>
        </div>

        {/* Illustration Area */}
        <div style={styles.illustrationArea}>
          <div style={styles.illustrationCard} />
          <div style={styles.illustrationCardSmall} />
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Powerful Features</h2>
        <div style={styles.featuresGrid}>
          {[
            { icon: "📄", title: "Smart Resume Parsing", desc: "Extract & analyze candidate data instantly" },
            { icon: "🔍", title: "AI-Powered Search", desc: "Find top matches using semantic search" },
            { icon: "💬", title: "Intelligent Chat", desc: "Ask questions, get insights powered by AI" },
            { icon: "📊", title: "Analytics Dashboard", desc: "Track trends and metrics across candidates" },
          ].map((feature, idx) => (
            <div key={idx} style={styles.featureCard}>
              <div style={styles.featureIcon}>{feature.icon}</div>
              <h4 style={styles.featureTitle}>{feature.title}</h4>
              <p style={styles.featureDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © 2026 SmartHire. Intelligent Hiring for Modern Teams.
        </p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    position: "relative",
    overflow: "hidden",
  },
  gradientBg: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 0,
    transition: "background 150ms ease-out",
  },
  hero: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "calc(100vh - 80px)",
    paddingTop: "80px",
    paddingBottom: "60px",
    maxWidth: "1400px",
    margin: "0 auto",
    paddingLeft: "40px",
    paddingRight: "40px",
    gap: "60px",
  },
  heroContent: {
    flex: 1,
    maxWidth: "600px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "20px",
    background: "rgba(99, 102, 241, 0.1)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    color: "var(--primary)",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "20px",
  },
  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--primary)",
    display: "inline-block",
    animation: "pulse 2s ease-in-out infinite",
  },
  title: {
    fontSize: "56px",
    fontWeight: "800",
    lineHeight: "1.15",
    letterSpacing: "-0.02em",
    marginBottom: "20px",
    color: "var(--text-primary)",
  },
  gradient: {
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: {
    fontSize: "18px",
    lineHeight: "1.7",
    color: "var(--text-secondary)",
    marginBottom: "30px",
  },
  ctaContainer: {
    display: "flex",
    gap: "16px",
    marginBottom: "30px",
    alignItems: "center",
  },
  primaryCta: {
    padding: "14px 28px",
    fontSize: "15px",
    fontWeight: "600",
    borderRadius: "10px",
    background: "var(--primary)",
    color: "white",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 24px rgba(99, 102, 241, 0.3)",
  },
  ctaArrow: {
    display: "inline-block",
    transition: "transform 0.3s ease",
  },
  secondaryCta: {
    padding: "14px 28px",
    fontSize: "15px",
    fontWeight: "600",
    borderRadius: "10px",
    background: "transparent",
    color: "var(--primary)",
    border: "1.5px solid var(--primary)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  trustText: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  illustrationArea: {
    flex: 1,
    position: "relative",
    height: "500px",
  },
  illustrationCard: {
    position: "absolute",
    right: "0",
    top: "0",
    width: "300px",
    height: "320px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.05))",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    boxShadow: "0 20px 48px rgba(15, 23, 42, 0.12)",
    animation: "float 6s ease-in-out infinite",
    backdropFilter: "blur(10px)",
  },
  illustrationCardSmall: {
    position: "absolute",
    right: "80px",
    top: "220px",
    width: "200px",
    height: "200px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.05))",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
    animation: "float 5s ease-in-out infinite 0.2s",
    backdropFilter: "blur(8px)",
  },
  featuresSection: {
    position: "relative",
    zIndex: 1,
    paddingTop: "80px",
    paddingBottom: "80px",
    paddingLeft: "40px",
    paddingRight: "40px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  sectionTitle: {
    fontSize: "36px",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: "50px",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
  },
  featureCard: {
    padding: "24px",
    borderRadius: "16px",
    background: "var(--bg-primary)",
    border: "1px solid var(--card-border)",
    transition: "all 0.3s ease",
    textAlign: "center",
  },
  featureIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },
  featureTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  featureDesc: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  footer: {
    position: "relative",
    zIndex: 1,
    padding: "30px 40px",
    borderTop: "1px solid var(--card-border)",
    textAlign: "center",
    background: "var(--bg-primary)",
  },
  footerText: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
};

// Add animation for floating effect
const style = document.createElement("style");
style.innerHTML = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
`;
document.head.appendChild(style);

export default Landing;
