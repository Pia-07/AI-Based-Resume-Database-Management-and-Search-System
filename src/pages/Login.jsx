import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Navbar from "../components/Navbar";
import { loginUser, googleLogin } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);
      
      if (data.error) {
        setError(data.error);
      } else {
        // Store user data and redirect
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("userEmail", data.email);
        navigate("/chatbot");
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      const data = await googleLogin(credentialResponse.credential);
      
      if (data.error) {
        setError(data.error);
      } else {
        // Store user data and redirect
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("userEmail", data.email);
        navigate("/chatbot");
      }
    } catch (err) {
      setError(err.message || "Google login failed. Please try again.");
      console.error("Google login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        input::placeholder {
          color: rgba(226, 232, 240, 0.4);
        }
        input:focus {
          border-color: #6366f1 !important;
          background: rgba(15, 23, 42, 0.8) !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15), inset 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
          outline: none !important;
        }
        button:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px -5px rgba(99, 102, 241, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.3) !important;
        }
        button:active {
          transform: translateY(-1px);
        }
        a:hover {
          color: #c4b5fd;
        }
      `}</style>
      <div style={styles.decorativeElements} />
      <Navbar />
      <div style={styles.formContainer}>
        <div style={styles.formCard}>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Sign in to access SmartHire</p>

          {error && <div style={styles.errorMessage}>{error}</div>}

          {/* Google OAuth */}
          <div style={styles.googleButtonContainer}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google login failed")}
              theme="outline"
              size="large"
            />
          </div>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span>OR</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={styles.input}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={styles.signupLink}>
            Don't have an account?{" "}
            <Link to="/signup" style={styles.link}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3460 100%)",
    color: "var(--text-primary, #ffffff)",
    position: "relative",
    overflow: "hidden"
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
    `,
    pointerEvents: "none",
  },
  formContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "40px 20px",
    position: "relative",
    zIndex: 1,
  },
  formCard: {
    background: "rgba(30, 41, 59, 0.85)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "24px",
    padding: "56px 48px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(148, 163, 184, 0.1)",
    animation: "slideUpFade 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
    position: "relative",
  },
  formCardGradientBorder: {
    position: "absolute",
    inset: 0,
    borderRadius: "24px",
    padding: "1px",
    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)",
    pointerEvents: "none",
    zIndex: -1,
  },
  title: {
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "12px",
    textAlign: "center",
    color: "#ffffff",
    background: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-1px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: "36px",
    fontWeight: "500",
    letterSpacing: "0.3px",
  },
  errorMessage: {
    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)",
    color: "#fca5a5",
    padding: "16px 18px",
    borderRadius: "12px",
    marginBottom: "28px",
    fontSize: "15px",
    fontWeight: "600",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    animation: "shake 0.4s ease-in-out",
    backdropFilter: "blur(4px)",
  },
  googleButtonContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "28px",
    scale: "1.05",
    transformOrigin: "center",
  },
  divider: {
    textAlign: "center",
    color: "#94a3b8",
    margin: "32px 0",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "1px",
    textTransform: "uppercase",
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.3), transparent)",
  },
  formGroup: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "10px",
    color: "#e2e8f0",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "14px 18px",
    border: "2px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "12px",
    fontSize: "15px",
    background: "rgba(15, 23, 42, 0.5)",
    color: "#e2e8f0",
    boxSizing: "border-box",
    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    fontWeight: "500",
    backdropFilter: "blur(10px)",
  },
  inputPlaceholder: {
    opacity: 0.5,
  },
  button: {
    width: "100%",
    padding: "14px 24px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "800",
    marginTop: "32px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.2)",
    letterSpacing: "0.5px",
    position: "relative",
    overflow: "hidden",
  },
  buttonHover: {
    transform: "translateY(-3px)",
    boxShadow: "0 15px 40px -5px rgba(99, 102, 241, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.3)",
  },
  signupLink: {
    textAlign: "center",
    fontSize: "15px",
    marginTop: "28px",
    color: "#cbd5e1",
    fontWeight: "500",
    letterSpacing: "0.3px",
  },
  link: {
    color: "#a78bfa",
    textDecoration: "none",
    fontWeight: "700",
    cursor: "pointer",
    transition: "color 0.2s ease",
    marginLeft: "6px",
    position: "relative",
  },
  linkHover: {
    color: "#c4b5fd",
  }
};

export default Login;
