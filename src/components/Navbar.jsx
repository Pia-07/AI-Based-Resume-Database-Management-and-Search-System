import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>SmartHire AI</div>

      <div style={styles.actions}>
        <Link to="/login" style={styles.loginBtn}>
          Login
        </Link>

        <Link to="/signup" style={styles.signupBtn}>
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    height: "60px",
    padding: "0 40px",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #e5e7eb",
  },

  logo: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
  },

  actions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  loginBtn: {
    padding: "8px 18px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    textDecoration: "none",
    color: "#111827",          // ✅ visible text
    fontWeight: "600",
    backgroundColor: "#ffffff",
  },

  signupBtn: {
    padding: "8px 18px",
    borderRadius: "8px",
    backgroundColor: "#22c55e",
    color: "#ffffff",         // ✅ visible text
    textDecoration: "none",
    fontWeight: "600",
  },
};

export default Navbar;
