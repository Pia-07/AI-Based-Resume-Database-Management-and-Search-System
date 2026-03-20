import Navbar from "../components/Navbar";

const About = () => {
  return (
    <div style={styles.page}>
      <Navbar />
      <header style={styles.header}>
        <h1 style={styles.title}>About SmartHire</h1>
        <p style={styles.subtitle}>
          SmartHire uses modern AI to help you find qualified candidates faster, without the guesswork.
          We bring together resumes, intelligent search, and analytics into a single dashboard.
        </p>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Our Mission</h2>
          <p style={styles.sectionText}>
            We believe hiring should be fast, fair, and data-driven. Our mission is to provide teams
            with the tools to identify top talent, understand hiring trends, and make confident decisions.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <ul style={styles.list}>
            <li style={styles.listItem}><strong>Upload Resumes:</strong> Add candidate documents in seconds.</li>
            <li style={styles.listItem}><strong>Search with AI:</strong> Use conversational search to find matches.
            </li>
            <li style={styles.listItem}><strong>Analyze Trends:</strong> See skill and location distribution at a glance.
            </li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Why Choose Us</h2>
          <div style={styles.featuresGrid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Smart Matching</h3>
              <p style={styles.cardText}>We use semantic understanding so you find the right candidates, not just keyword matches.</p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Fast Setup</h3>
              <p style={styles.cardText}>Start uploading resumes immediately—no training required.</p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Secure & Private</h3>
              <p style={styles.cardText}>Your candidate data stays safe with secure storage and strict access controls.</p>
            </div>
          </div>
        </section>
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
    margin: "0 0 14px",
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
  section: {
    marginBottom: "48px",
  },
  sectionTitle: {
    fontSize: "26px",
    fontWeight: "700",
    marginBottom: "18px",
  },
  sectionText: {
    fontSize: "15px",
    color: "var(--text-secondary)",
    lineHeight: "1.7",
    maxWidth: "820px",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
  },
  listItem: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: "16px",
    padding: "18px 20px",
    color: "var(--text-secondary)",
    boxShadow: "var(--shadow-sm)",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "var(--shadow-sm)",
    backdropFilter: "blur(16px)",
    minHeight: "180px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 10px",
  },
  cardText: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
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

export default About;
