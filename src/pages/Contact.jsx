import Navbar from "../components/Navbar";

const Contact = () => {
  return (
    <div style={styles.page}>
      <Navbar />
      <header style={styles.header}>
        <h1 style={styles.title}>Contact Us</h1>
        <p style={styles.subtitle}>
          Have feedback or want to learn more? Reach out and we’ll respond as soon as possible.
        </p>
      </header>

      <main style={styles.main}>
        <div style={styles.grid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>General Inquiries</h3>
            <p style={styles.cardText}>Email us at <a href="mailto:support@smarthire.ai" style={styles.link}>support@smarthire.ai</a></p>
            <p style={styles.cardText}>Response time is typically within 24 hours.</p>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Sales & Partnerships</h3>
            <p style={styles.cardText}>Interested in enterprise features or integrations?</p>
            <p style={styles.cardText}>Email: <a href="mailto:sales@smarthire.ai" style={styles.link}>sales@smarthire.ai</a></p>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Report an Issue</h3>
            <p style={styles.cardText}>Found a bug or unexpected behavior? Let us know.</p>
            <p style={styles.cardText}><a href="mailto:bugs@smarthire.ai" style={styles.link}>bugs@smarthire.ai</a></p>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>© {new Date().getFullYear()} SmartHire. All rights reserved.</p>
      </footer>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
    color: "var(--text-primary)",
    paddingTop: "80px",
  },
  header: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "60px 24px 24px",
    textAlign: "center",
  },
  title: {
    fontSize: "42px",
    fontWeight: "800",
    margin: "0 0 12px",
    background: "linear-gradient(135deg, var(--primary), var(--accent))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: {
    fontSize: "17px",
    color: "var(--text-secondary)",
    margin: 0,
    maxWidth: "720px",
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: "1.7",
  },
  main: {
    maxWidth: "1040px",
    margin: "0 auto",
    padding: "40px 24px 80px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "22px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "var(--shadow-sm)",
    backdropFilter: "blur(16px)",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 10px",
    color: "var(--text-primary)",
  },
  cardText: {
    fontSize: "15px",
    color: "var(--text-secondary)",
    lineHeight: "1.7",
    margin: "0 0 12px",
  },
  link: {
    color: "var(--primary)",
    textDecoration: "none",
    fontWeight: "700",
  },
  footer: {
    padding: "40px 24px",
    textAlign: "center",
    borderTop: "1px solid rgba(148, 163, 184, 0.2)",
  },
  footerText: {
    color: "var(--text-secondary)",
    margin: 0,
    fontSize: "14px",
  },
};

export default Contact;
