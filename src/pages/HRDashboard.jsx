import { useState, useEffect } from "react";
import { getQuizResults, sendAllQuizEmails } from "../services/api";

/**
 * HRDashboard — Pre-generated quiz results for hardcoded candidates.
 * 
 * Key design decisions:
 * - NO manual quiz creation — quizzes auto-generated on server startup
 * - Single "Send Quiz Links" button sends to BOTH candidates simultaneously
 * - Sidebar handled by AppLayout (not rendered here)
 * - Email addresses fetched from resume data (hardcoded)
 */
const HRDashboard = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(""); // "" | "sent" | "error"

  // Load results on mount
  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await getQuizResults();
      if (data.success) {
        setResults(data.results || []);
      }
    } catch (err) {
      console.error("Failed to load quiz results:", err);
    } finally {
      setLoading(false);
    }
  };

  // Send quiz links to ALL candidates simultaneously
  const handleSendAllEmails = async () => {
    setSending(true);
    setSendStatus("");
    try {
      const data = await sendAllQuizEmails();
      if (data.success) {
        setSendStatus("sent");
        loadResults(); // Refresh to show updated status
      } else {
        setSendStatus("error");
      }
    } catch (err) {
      console.error("Failed to send quiz emails:", err);
      setSendStatus("error");
    } finally {
      setSending(false);
    }
  };

  // Score color helper
  const getScoreStyle = (percentage) => {
    if (percentage === null || percentage === undefined) {
      return { bg: "#f1f5f9", color: "#64748b", text: "—" };
    }
    if (percentage >= 70) return { bg: "#dcfce7", color: "#166534", text: `${percentage}%` };
    if (percentage >= 40) return { bg: "#fef3c7", color: "#92400e", text: `${percentage}%` };
    return { bg: "#fee2e2", color: "#991b1b", text: `${percentage}%` };
  };

  // Status badge helper
  const getStatusStyle = (status) => {
    switch (status) {
      case "completed":
        return { bg: "#dbeafe", color: "#1e40af", icon: "✓", label: "Completed" };
      case "expired":
        return { bg: "#fee2e2", color: "#991b1b", icon: "⏰", label: "Expired" };
      case "email_sent":
        return { bg: "#e0e7ff", color: "#4338ca", icon: "📧", label: "Email Sent" };
      default:
        return { bg: "#fef3c7", color: "#92400e", icon: "⏳", label: "Pending" };
    }
  };

  // Counts
  const totalQuizzes = results.length;
  const completed = results.filter(r => r.status === "completed").length;
  const passed = results.filter(r => r.passed === true).length;
  const pending = results.filter(r => r.status === "pending" || r.status === "email_sent").length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📊 HR Dashboard</h1>
          <p style={styles.subtitle}>
            Skill verification results — quizzes auto-generated from resume skills
          </p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.refreshBtn} onClick={loadResults} title="Refresh results">
            🔄 Refresh
          </button>
          <button
            style={{
              ...styles.sendAllBtn,
              opacity: sending ? 0.7 : 1,
            }}
            onClick={handleSendAllEmails}
            disabled={sending || pending === 0}
            title="Send quiz links to all pending candidates"
          >
            {sending ? "⏳ Sending..." : "📧 Send Quiz Links"}
          </button>
        </div>
      </div>

      {/* Send Status Banner */}
      {sendStatus === "sent" && (
        <div style={styles.successBanner}>
          ✅ Quiz links sent successfully to all candidates! (Check server console for email details)
        </div>
      )}
      {sendStatus === "error" && (
        <div style={styles.errorBanner}>
          ⚠️ Failed to send quiz links. Please try again.
        </div>
      )}

      {/* Stats Cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📝</span>
          <div>
            <span style={styles.statValue}>{totalQuizzes}</span>
            <span style={styles.statLabel}>Total Quizzes</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>✅</span>
          <div>
            <span style={styles.statValue}>{completed}</span>
            <span style={styles.statLabel}>Completed</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🏆</span>
          <div>
            <span style={styles.statValue}>{passed}</span>
            <span style={styles.statLabel}>Passed</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>⏳</span>
          <div>
            <span style={styles.statValue}>{pending}</span>
            <span style={styles.statLabel}>Pending</span>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <p>Loading quiz data...</p>
          </div>
        ) : results.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>⏳</span>
            <h3 style={styles.emptyTitle}>Generating Quizzes...</h3>
            <p style={styles.emptyText}>
              Quizzes are being auto-generated for candidates. Please refresh in a moment.
            </p>
            <button style={styles.emptyBtn} onClick={loadResults}>
              🔄 Refresh
            </button>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Candidate</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Skills</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Quiz Link</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => {
                const scoreStyle = getScoreStyle(r.percentage);
                const statusStyle = getStatusStyle(r.status);

                return (
                  <tr key={r.quiz_id || idx} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.candidateName}>{r.candidate_name}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.emailText}>{r.candidate_email}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.skillsCell}>
                        {(r.skills || []).slice(0, 4).map((s, i) => (
                          <span key={i} style={styles.skillChip}>{s}</span>
                        ))}
                        {(r.skills || []).length > 4 && (
                          <span style={styles.moreSkills}>+{r.skills.length - 4}</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.scoreBadge,
                        background: scoreStyle.bg,
                        color: scoreStyle.color,
                      }}>
                        {scoreStyle.text}
                        {r.score !== null && r.score !== undefined && (
                          <span style={styles.scoreDetail}>
                            ({r.score}/{r.total_questions})
                          </span>
                        )}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                      }}>
                        {statusStyle.icon} {statusStyle.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.copyLinkBtn}
                        onClick={() => {
                          const link = `${window.location.origin}/quiz/${r.quiz_id}`;
                          navigator.clipboard.writeText(link);
                          alert(`Quiz link for ${r.candidate_name} copied!`);
                        }}
                        title="Copy quiz link"
                      >
                        🔗 Copy
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ── Styles ──
const styles = {
  container: {
    padding: "32px 40px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#1e293b",
    margin: "0 0 4px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  headerActions: {
    display: "flex",
    gap: "10px",
  },
  refreshBtn: {
    padding: "10px 18px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "none",
  },
  sendAllBtn: {
    padding: "10px 24px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
    transition: "all 200ms ease",
  },
  // Banners
  successBanner: {
    padding: "14px 20px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    color: "#166534",
    fontSize: "14px",
    fontWeight: "600",
  },
  errorBanner: {
    padding: "14px 20px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    color: "#991b1b",
    fontSize: "14px",
    fontWeight: "600",
  },
  // Stats
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "20px",
    background: "white",
    borderRadius: "14px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    border: "1px solid #f1f5f9",
  },
  statIcon: { fontSize: "28px" },
  statValue: {
    display: "block",
    fontSize: "24px",
    fontWeight: "800",
    color: "#1e293b",
  },
  statLabel: {
    display: "block",
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  // Table
  tableContainer: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    border: "1px solid #f1f5f9",
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: "600",
    color: "#64748b",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #f1f5f9",
    background: "#fafbfc",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "14px 16px",
    verticalAlign: "middle",
  },
  candidateName: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: "15px",
  },
  emailText: {
    color: "#64748b",
    fontSize: "13px",
  },
  skillsCell: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  },
  skillChip: {
    padding: "3px 10px",
    background: "#e0e7ff",
    color: "#4338ca",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
  },
  moreSkills: {
    padding: "3px 8px",
    color: "#94a3b8",
    fontSize: "11px",
  },
  scoreBadge: {
    padding: "5px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  scoreDetail: {
    fontSize: "11px",
    fontWeight: "500",
    opacity: 0.8,
  },
  statusBadge: {
    padding: "5px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  copyLinkBtn: {
    padding: "6px 14px",
    background: "#f0f9ff",
    color: "#0369a1",
    border: "1px solid #bae6fd",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "none",
  },
  // States
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    textAlign: "center",
  },
  emptyIcon: { fontSize: "48px", marginBottom: "12px" },
  emptyTitle: { fontSize: "20px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" },
  emptyText: { color: "#64748b", marginBottom: "20px", maxWidth: "350px" },
  emptyBtn: {
    padding: "12px 28px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    gap: "12px",
    color: "#64748b",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

export default HRDashboard;
