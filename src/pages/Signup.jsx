import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { signupUser, loginWithGoogle, warmUpBackend } from "../services/api";
import Logo from "../components/Logo";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Pre-warm backend on page load (Render free tier cold start)
  useEffect(() => {
    warmUpBackend();
  }, []);

  // Google OAuth signup handler using implicit flow
  const googleSignup = useGoogleLogin({
    flow: "implicit",
    ux_mode: "redirect",
    onSuccess: async (tokenResponse) => {
      try {
        console.log("🔐 Google OAuth Signup - Token received");
        setGoogleLoading(true);
        setError("");

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

        console.log("✅ Google signup successful for:", response.email);

        // Store user session
        localStorage.setItem("userId", response.user_id);
        localStorage.setItem("userEmail", response.email || "");
        localStorage.setItem("userName", response.name || response.email?.split("@")[0] || "");

        // Clear chat session to show empty state on signup
        localStorage.removeItem("chatSessionStarted");

        console.log("🚀 Redirecting to chatbot...");
        navigate("/chatbot");
      } catch (err) {
        console.error("❌ Google signup error:", err);
        setError(`Google signup failed: ${err.message || "Unknown error"}`);
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error("❌ Google OAuth popup failed:", error);
      setError("Google authentication failed. Please try again.");
    },
  });

  // Password validation rules
  const passwordRules = {
    length: password.length >= 8,
    number: /\d/.test(password),
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const isPasswordMatch = password === confirmPassword && password.length > 0;

  const handleSignup = async () => {
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!isPasswordValid) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and a number");
      return;
    }

    if (!isPasswordMatch) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await signupUser(email, password);

      if (response.error) {
        setError(response.error);
      } else if (response.message) {
        // Store user session
        localStorage.setItem("userEmail", email);

        // Clear chat session to show empty state on first login
        localStorage.removeItem("chatSessionStarted");

        navigate("/chatbot");
      } else {
        setError("Unexpected response from server");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Failed to connect to server. Make sure backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSignup();
    }
  };

  return (
    <div style={styles.container}>
      {/* Left Side - Branding */}
      <div style={styles.brandingSide}>
        <div style={styles.brandContent}>
          <div style={styles.logo}>
            <div style={styles.logoContainer}>
              <Logo size="64px" />
            </div>
          </div>
          <h1 style={styles.brandTitle}>Join SmartHire</h1>
          <p style={styles.brandDesc}>
            Start improving your hiring process with AI today
          </p>
          <div style={styles.brandFeatures}>
            {["Instant setup", "No credit card needed", "Free trial included"].map((feature, idx) => (
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
            <h2 style={styles.formTitle}>Create Account</h2>
            <p style={styles.formSubtitle}>
              Join hundreds of companies using AI-powered hiring
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.errorMessage} className="animate-slideInRight">
              <span style={styles.errorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📧</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔐</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* Password Strength Indicator */}
            {password && (
              <div style={styles.passwordStrength}>
                <div style={styles.strengthRule(passwordRules.length)}>
                  <span>{passwordRules.length ? "✓" : "○"}</span> At least 8 characters
                </div>
                <div style={styles.strengthRule(passwordRules.uppercase)}>
                  <span>{passwordRules.uppercase ? "✓" : "○"}</span> One uppercase letter
                </div>
                <div style={styles.strengthRule(passwordRules.lowercase)}>
                  <span>{passwordRules.lowercase ? "✓" : "○"}</span> One lowercase letter
                </div>
                <div style={styles.strengthRule(passwordRules.number)}>
                  <span>{passwordRules.number ? "✓" : "○"}</span> One number
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>✓</span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                style={styles.input}
                disabled={loading}
              />
              <button
                style={styles.togglePassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                type="button"
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {confirmPassword && (
              <div style={{
                ...styles.matchIndicator,
                color: isPasswordMatch ? "#10b981" : "#ef4444",
              }}>
                {isPasswordMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
              </div>
            )}
          </div>

          {/* Terms & Privacy */}
          <label style={styles.termsCheckbox}>
            <input type="checkbox" style={styles.checkbox} />
            I agree to the Terms of Service and Privacy Policy
          </label>

          {/* Signup Button */}
          <button
            onClick={handleSignup}
            disabled={loading || !isPasswordValid || !isPasswordMatch}
            style={{
              ...styles.signupButton,
              opacity: (loading || !isPasswordValid || !isPasswordMatch) ? 0.7 : 1,
              cursor: (loading || !isPasswordValid || !isPasswordMatch) ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span style={styles.spinner} />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>

          {/* Divider */}
          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>

          {/* Social Signup */}
          <button
            onClick={() => googleSignup()}
            disabled={loading || googleLoading}
            style={{
              ...styles.socialButton,
              opacity: loading || googleLoading ? 0.7 : 1,
              cursor: loading || googleLoading ? "not-allowed" : "pointer",
            }}
          >
            <span style={styles.socialIcon}>
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            </span>
            {googleLoading ? "Signing up..." : "Sign up with Google"}
          </button>

          {/* Login Link */}
          <p style={styles.loginLink}>
            Already have an account?{" "}
            <a href="#" onClick={() => navigate("/login")} style={styles.loginLinkText}>
              Sign in here
            </a>
          </p>

          {/* Footer Note */}
          <p style={styles.footerNote}>
            We'll never share your information. Read our privacy policy.
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
    // Richer background gradient
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)",
  },
  brandingSide: {
    flex: 1,
    // Deeper green gradient for consistency with signup theme
    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
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
    marginBottom: "32px",
    display: "flex",
    justifyContent: "center",
  },
  logoContainer: {
    padding: "16px",
    background: "white",
    borderRadius: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
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
    color: "rgba(255, 255, 255, 0.9)",
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
    color: "rgba(255, 255, 255, 0.95)",
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
    color: "#64748b",
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
  passwordStrength: {
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  strengthRule: (isValid) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: isValid ? "#10b981" : "var(--text-tertiary)",
    transition: "color 150ms ease",
  }),
  matchIndicator: {
    marginTop: "8px",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  termsCheckbox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "13px",
    color: "#475569",
    marginBottom: "20px",
    cursor: "pointer",
    lineHeight: "1.4",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    borderRadius: "4px",
    marginTop: "2px",
    flexShrink: 0,
  },
  signupButton: {
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
  loginLink: {
    textAlign: "center",
    fontSize: "13px",
    color: "var(--text-secondary)",
    marginTop: "16px",
  },
  loginLinkText: {
    color: "var(--primary)",
    textDecoration: "none",
    fontWeight: "600",
  },
  footerNote: {
    fontSize: "11px",
    color: "#64748b",
    textAlign: "center",
    marginTop: "12px",
    lineHeight: "1.4",
  },
};

export default Signup;
