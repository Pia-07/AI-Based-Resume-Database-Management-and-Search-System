import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { loginUser, loginWithGoogle } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google login handler - Send token to backend for processing
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      setError("");
      setGoogleLoading(true);

      const token = credentialResponse.credential;

      // Send token to backend for validation and user creation
      const response = await loginWithGoogle(token);

      console.log("Backend response:", response);

      if (response.error) {
        setError(response.error);
        console.error("Google login error:", response.error);
      } else if (response.user_id) {
        // Store user session
        localStorage.setItem("userId", response.user_id);
        localStorage.setItem("userEmail", response.email);
        localStorage.setItem("userName", response.name || response.email.split('@')[0]);

        // Clear chat session to show empty state on login
        localStorage.removeItem("chatSessionStarted");

        console.log("✅ Google login successful:", response.email);
        navigate("/chatbot");
      } else {
        console.error("Invalid response structure:", response);
        setError("Unexpected response from server. Check console for details.");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("Failed to process Google login. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    setError("Failed to login with Google. Please try again.");
  };

  const googleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (tokenResponse) => {
      try {
        console.log("🔐 Google OAuth Success - Token received");
        setGoogleLoading(true);
        setError("");

        // Access token from Google OAuth implicit flow
        const accessToken = tokenResponse.access_token;
        console.log("📤 Sending access token to backend (length:", accessToken?.length, ")");

        const response = await loginWithGoogle(accessToken);
        console.log("📥 Backend response:", response);

        if (response?.error) {
          console.error("❌ Backend returned error:", response.error);
          setError(response.error);
          return;
        }

        if (!response?.user_id) {
          console.error("❌ Invalid response structure:", response);
          setError("Unexpected response from server. Check console for details.");
          return;
        }

        console.log("✅ Google login successful for:", response.email);

        localStorage.setItem("userId", response.user_id);
        localStorage.setItem("userEmail", response.email);
        localStorage.setItem(
          "userName",
          response.name || response.email?.split("@")[0]
        );

        localStorage.removeItem("chatSessionStarted");
        console.log("🚀 Redirecting to chatbot...");
        navigate("/chatbot");
      } catch (err) {
        console.error("❌ Google login error:", err);
        setError(`Google login failed: ${err.message || "Unknown error"}`);
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error("❌ Google OAuth popup failed:", error);
      setError("Google authentication failed. Please try again.");
    },
  });


  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const response = await loginUser(email, password);

      if (response.error) {
        setError(response.error);
      } else if (response.message) {
        // Store user session
        localStorage.setItem("userId", response.user_id || "");
        localStorage.setItem("userEmail", email);

        // Clear chat session to show empty state on next login
        localStorage.removeItem("chatSessionStarted");

        navigate("/chatbot");
      } else {
        setError("Unexpected response from server");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to server. Make sure backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <div style={styles.container}>
      {/* Left Side - Branding */}
      <div style={styles.brandingSide}>
        <div style={styles.brandContent}>
          <div style={styles.logo}>
            <span style={styles.logoText}>🧠</span>
          </div>
          <h1 style={styles.brandTitle}>SmartHire</h1>
          <p style={styles.brandDesc}>
            AI-powered resume analysis and intelligent hiring
          </p>
          <div style={styles.brandFeatures}>
            {["Fast candidate matching", "AI-powered insights", "Smart search"].map((feature, idx) => (
              <div key={idx} style={styles.featureItem}>
                <span style={styles.featureCheck}>✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={styles.formSide}>
        <div style={styles.formCard}>
          {/* Header */}
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome Back</h2>
            <p style={styles.formSubtitle}>
              Sign in to access your AI hiring assistant
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.errorMessage} className="animate-slideInRight">
              <span style={styles.errorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📧</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔐</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                style={styles.input}
                disabled={loading}
              />
              <button
                style={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div style={styles.checkboxRow}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" style={styles.checkbox} />
              Remember me
            </label>
            <a href="#" style={styles.forgotLink}>Forgot password?</a>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              ...styles.loginButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span style={styles.spinner} />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Divider */}
          <div style={styles.divider}>
            <span style={styles.dividerText}>or continue with</span>
          </div>

          {/* Google OAuth Login */}
          <button
            onClick={() => googleLogin()}
            disabled={googleLoading || loading}
            style={{
              ...styles.socialButton,
              opacity: googleLoading || loading ? 0.7 : 1,
              cursor: googleLoading || loading ? "not-allowed" : "pointer",
            }}
          >
            <span style={styles.socialIcon}>🔐</span>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>

          {/* Sign Up Link */}
          <p style={styles.signupLink}>
            Don't have an account?{" "}
            <a href="#" onClick={() => navigate("/signup")} style={styles.signupLinkText}>
              Create one now
            </a>
          </p>

          {/* Footer Note */}
          <p style={styles.footerNote}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg-secondary)",
  },
  brandingSide: {
    flex: 1,
    background: "linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    color: "white",
    position: "relative",
    overflow: "hidden",
  },
  brandContent: {
    maxWidth: "400px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  logo: {
    fontSize: "64px",
    marginBottom: "24px",
  },
  logoText: {
    display: "inline-block",
  },
  brandTitle: {
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "12px",
    color: "white",
  },
  brandDesc: {
    fontSize: "16px",
    opacity: 0.9,
    marginBottom: "40px",
    lineHeight: "1.6",
  },
  brandFeatures: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    opacity: 0.95,
  },
  featureCheck: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    fontSize: "14px",
    flexShrink: 0,
  },
  formSide: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  formCard: {
    width: "100%",
    maxWidth: "420px",
    background: "var(--bg-primary)",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "var(--shadow-lg)",
    border: "1px solid #e2e8f0",
  },
  formHeader: {
    marginBottom: "28px",
  },
  formTitle: {
    fontSize: "28px",
    fontWeight: "800",
    marginBottom: "8px",
    color: "var(--text-primary)",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  errorMessage: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#7f1d1d",
    fontSize: "13px",
    marginBottom: "20px",
  },
  errorIcon: {
    fontSize: "16px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-primary)",
    marginBottom: "8px",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "12px",
    fontSize: "16px",
    pointerEvents: "none",
    opacity: 0.6,
  },
  input: {
    width: "100%",
    paddingLeft: "40px",
    paddingRight: "40px",
    height: "44px",
    borderRadius: "10px",
    border: "1.5px solid #e2e8f0",
    fontSize: "14px",
    transition: "all 150ms ease",
    background: "var(--bg-primary)",
  },
  togglePassword: {
    position: "absolute",
    right: "12px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 8px",
    opacity: 0.6,
    transition: "opacity 150ms ease",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    fontSize: "13px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    color: "var(--text-secondary)",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    borderRadius: "4px",
  },
  forgotLink: {
    color: "var(--primary)",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
  },
  loginButton: {
    width: "100%",
    height: "44px",
    background: "var(--primary)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 200ms ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  },
  spinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    animation: "spin 0.8s linear infinite",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "20px 0",
  },
  dividerText: {
    fontSize: "12px",
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: "500",
  },
  socialButton: {
    width: "100%",
    height: "44px",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 200ms ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  socialIcon: {
    fontSize: "16px",
  },
  signupLink: {
    textAlign: "center",
    fontSize: "13px",
    color: "var(--text-secondary)",
    marginTop: "16px",
  },
  signupLinkText: {
    color: "var(--primary)",
    textDecoration: "none",
    fontWeight: "600",
  },
  footerNote: {
    fontSize: "11px",
    color: "var(--text-tertiary)",
    textAlign: "center",
    marginTop: "12px",
    lineHeight: "1.4",
  },
};

export default Login;
