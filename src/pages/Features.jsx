import Navbar from "../components/Navbar";

const Features = () => {
  const features = [
    {
      icon: "🚀",
      title: "AI Resume Parsing",
      description: "Automatically extract key skills, experience, and education from uploads."
    },
    {
      icon: "🔍",
      title: "Semantic Search",
      description: "Find the best matches with AI-powered understanding of resumes and job requirements."
    },
    {
      icon: "💬",
      title: "Smart Chat Assistant",
      description: "Ask questions about candidates and get instant insights powered by AI." 
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      description: "Track application trends and hiring metrics with easy-to-read charts." 
    }
  ];

  return (
    <div style={styles.page}>
      <Navbar />
      <header style={styles.header}>
        <h1 style={styles.title}>Features</h1>
        <p style={styles.subtitle}>Everything SmartHire offers to make hiring faster and smarter.</p>
      </header>

      <main style={styles.main}>
        <div style={styles.grid}>
          {features.map((feature) => (
            <div key={feature.title} style={styles.card}>
              <div style={styles.icon}>{feature.icon}</div>
              <h3 style={styles.cardTitle}>{feature.title}</h3>
              <p style={styles.cardText}>{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © {new Date().getFullYear()} SmartHire. Built for modern teams.
        </p>
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
    maxWidth: "940px",
    padding: "60px 24px 24px",
    margin: "0 auto",
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
    fontSize: "18px",
    color: "var(--text-secondary)",
    margin: 0,
    maxWidth: "720px",
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: "1.6",
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 24px 80px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: "18px",
    padding: "26px",
    boxShadow: "var(--shadow-sm)",
    backdropFilter: "blur(16px)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    minHeight: "220px",
  },
  icon: {
    fontSize: "32px",
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "rgba(99, 102, 241, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
  },
  cardText: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: 0,
    lineHeight: "1.6",
    flex: 1,
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

export default Features;
