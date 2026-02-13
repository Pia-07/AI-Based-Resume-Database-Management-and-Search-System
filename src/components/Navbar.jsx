import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        {/* Logo & Brand */}
        <Link to="/" style={styles.brandLink}>
          <div style={styles.logo}>
            <Logo size="28px" />
            <span style={styles.logoText}>SmartHire</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#about" style={styles.navLink}>About</a>
          <a href="#contact" style={styles.navLink}>Contact</a>
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          {/* Theme Toggle */}
          <ThemeToggle />

          <Link to="/login" style={styles.loginBtn}>
            Login
          </Link>
          <Link to="/signup" style={styles.signupBtn}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "70px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    backdropFilter: "blur(10px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    boxShadow: "var(--shadow-sm)",
    transition: "background-color 0.25s ease, border-color 0.25s ease",
  },
  container: {
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    paddingLeft: "40px",
    paddingRight: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLink: {
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    fontSize: "24px",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "800",
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  navLinks: {
    display: "flex",
    gap: "32px",
    flex: 1,
    marginLeft: "60px",
  },
  navLink: {
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--text-secondary)",
    textDecoration: "none",
    transition: "color 150ms ease",
  },
  actions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  loginBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "1.5px solid var(--border-color)",
    textDecoration: "none",
    color: "var(--text-primary)",
    fontWeight: "600",
    fontSize: "14px",
    background: "transparent",
    cursor: "pointer",
    transition: "all 150ms ease",
  },
  signupBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    background: "var(--primary)",
    color: "white",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
    transition: "all 150ms ease",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
  },
};

export default Navbar;
