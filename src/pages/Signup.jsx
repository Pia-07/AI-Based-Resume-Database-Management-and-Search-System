import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { signupUser, loginWithGoogle } from "../services/api";

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

  // Google login handler
  const handleGoogleSignupSuccess = async (credentialResponse) => {
  try {
    setError("");
    setGoogleLoading(true);
    
    console.log("Credential Response:", credentialResponse);
    console.log("Token:", credentialResponse.credential);
    
    if (!credentialResponse.credential) {
      setError("Failed to get Google token");
      return;
    }
    
      
      const response = await loginWithGoogle(credentialResponse.credential);
      
      console.log("Backend response:", response);
      console.log("Response keys:", Object.keys(response));
      
      if (response.error) {
        setError(response.error);
      } else if (response.message) {
        // Store user session
        localStorage.setItem("userId", response.user_id || "");
        localStorage.setItem("userEmail", response.email || "");
        
        // Clear chat session to show empty state on signup
        localStorage.removeItem("chatSessionStarted");
        
        navigate("/chatbot");
      } else {
        console.error("Unexpected response structure:", response);
        setError(`Unexpected response from Google signup: ${JSON.stringify(response)}`);
      }
    } catch (err) {
      console.error("Google signup error:", err);
      setError("Failed to sign up with Google. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignupError = () => {
    setError("Failed to sign up with Google. Please try again.");
  };

  const googleSignup = useGoogleLogin({
    onSuccess: handleGoogleSignupSuccess,
    onError: handleGoogleSignupError,
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
            <span style={styles.logoText}>🚀</span>
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
            <span style={styles.socialIcon}>🔐</span>
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
    background: "var(--bg-secondary)",
  },
  brandingSide: {
    flex: 1,
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
    color: "var(--text-secondary)",
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
    color: "var(--text-tertiary)",
    textAlign: "center",
    marginTop: "12px",
    lineHeight: "1.4",
  },
};

export default Signup;
