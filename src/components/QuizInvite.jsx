import { useState } from "react";
import { generateQuiz, sendQuizEmail } from "../services/api";

/**
 * QuizInvite — Modal dialog for HR to generate and send skill quizzes.
 *
 * Features:
 * - Input fields for candidate name, email, skills
 * - Pre-filled target emails
 * - Generates quiz via API
 * - Sends (simulated) email invitation
 * - Shows generated quiz link + confirmation
 * - Premium modal UI with glassmorphism
 */
const QuizInvite = ({ onClose, prefillSkills = [], prefillName = "", prefillEmail = "" }) => {
  // Form state
  const [candidateName, setCandidateName] = useState(prefillName);
  const [candidateEmail, setCandidateEmail] = useState(prefillEmail);
  const [skillsInput, setSkillsInput] = useState(prefillSkills.join(", "));
  const [timeLimit, setTimeLimit] = useState(20);

  // Status state
  const [step, setStep] = useState("form"); // form | generating | done
  const [error, setError] = useState("");
  const [quizLink, setQuizLink] = useState("");
  const [quizId, setQuizId] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Predefined email suggestions
  const emailSuggestions = [
    "piapatel9983@gmail.com",
    "hetvihradadiya@gmail.com",
  ];

  // Parse skills from comma-separated input
  const parseSkills = (input) => {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  // Generate quiz
  const handleGenerate = async () => {
    setError("");
    const skills = parseSkills(skillsInput);

    if (!candidateName.trim()) {
      setError("Please enter the candidate's name");
      return;
    }
    if (!candidateEmail.trim()) {
      setError("Please enter the candidate's email");
      return;
    }
    if (skills.length === 0) {
      setError("Please enter at least one skill");
      return;
    }

    setStep("generating");

    try {
      const data = await generateQuiz(candidateName, candidateEmail, skills, timeLimit);
      if (data.success) {
        const link = `${window.location.origin}/quiz/${data.quiz_id}`;
        setQuizLink(link);
        setQuizId(data.quiz_id);
        setStep("done");
      } else {
        setError(data.error || "Failed to generate quiz");
        setStep("form");
      }
    } catch (err) {
      setError(err.message || "Quiz generation failed");
      setStep("form");
    }
  };

  // Send email
  const handleSendEmail = async () => {
    try {
      const result = await sendQuizEmail(
        quizId,
        candidateName,
        candidateEmail,
        quizLink,
        timeLimit
      );
      if (result.success) {
        setEmailSent(true);
      }
    } catch (err) {
      console.error("Email send failed:", err);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(quizLink);
    alert("Quiz link copied!");
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {step === "done" ? "✅ Quiz Created!" : "📝 Generate Skill Quiz"}
          </h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBanner}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form Step */}
        {step === "form" && (
          <div style={styles.formBody}>
            {/* Candidate Name */}
            <div style={styles.field}>
              <label style={styles.label}>Candidate Name</label>
              <input
                style={styles.input}
                placeholder="e.g. John Doe"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
            </div>

            {/* Candidate Email */}
            <div style={styles.field}>
              <label style={styles.label}>Candidate Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="e.g. candidate@email.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
              />
              <div style={styles.emailSuggestions}>
                {emailSuggestions.map((email) => (
                  <button
                    key={email}
                    style={styles.suggestionChip}
                    onClick={() => setCandidateEmail(email)}
                    type="button"
                  >
                    {email}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div style={styles.field}>
              <label style={styles.label}>Skills (comma-separated)</label>
              <textarea
                style={styles.textarea}
                placeholder="e.g. Python, React, SQL, Machine Learning"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                rows={3}
              />
              <p style={styles.hint}>
                {parseSkills(skillsInput).length} skill(s) detected
              </p>
            </div>

            {/* Time Limit */}
            <div style={styles.field}>
              <label style={styles.label}>Time Limit (minutes)</label>
              <div style={styles.timeBtns}>
                {[15, 20, 25, 30].map((min) => (
                  <button
                    key={min}
                    style={{
                      ...styles.timeBtn,
                      background: timeLimit === min ? "#6366f1" : "#f1f5f9",
                      color: timeLimit === min ? "white" : "#475569",
                    }}
                    onClick={() => setTimeLimit(min)}
                    type="button"
                  >
                    {min} min
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button style={styles.generateBtn} onClick={handleGenerate}>
              🚀 Generate Quiz
            </button>
          </div>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <div style={styles.generatingState}>
            <div style={styles.spinner} />
            <p style={styles.generatingText}>
              Generating {parseSkills(skillsInput).length}-skill quiz with Gemini AI...
            </p>
            <p style={styles.generatingHint}>This may take 10-15 seconds</p>
          </div>
        )}

        {/* Done Step */}
        {step === "done" && (
          <div style={styles.doneBody}>
            <div style={styles.successBanner}>
              <span style={styles.successIcon}>🎉</span>
              <div>
                <p style={styles.successTitle}>Quiz generated for {candidateName}</p>
                <p style={styles.successDetail}>
                  {parseSkills(skillsInput).length} skills • {timeLimit} minute limit
                </p>
              </div>
            </div>

            {/* Quiz Link */}
            <div style={styles.linkBox}>
              <span style={styles.linkLabel}>Quiz Link:</span>
              <div style={styles.linkRow}>
                <code style={styles.linkCode}>{quizLink}</code>
                <button style={styles.copyBtn} onClick={handleCopyLink}>📋 Copy</button>
              </div>
            </div>

            {/* Send Email */}
            <div style={styles.emailSection}>
              <p style={styles.emailLabel}>
                📧 Send to: <strong>{candidateEmail}</strong>
              </p>
              {!emailSent ? (
                <button style={styles.sendEmailBtn} onClick={handleSendEmail}>
                  📧 Send Quiz Email
                </button>
              ) : (
                <div style={styles.emailSentBadge}>
                  ✅ Email sent successfully (simulated)
                </div>
              )}
            </div>

            <button style={styles.closeModalBtn} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Styles ──
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 200ms ease",
  },
  modal: {
    width: "100%",
    maxWidth: "520px",
    background: "white",
    borderRadius: "20px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
    overflow: "hidden",
    animation: "fadeIn 300ms ease",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #f1f5f9",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  closeBtn: {
    background: "#f1f5f9",
    border: "none",
    color: "#64748b",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "none",
  },
  errorBanner: {
    margin: "0 24px",
    marginTop: "16px",
    padding: "12px 16px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    color: "#991b1b",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  // Form
  formBody: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1.5px solid #e2e8f0",
    fontSize: "14px",
    background: "#fafbfc",
  },
  textarea: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1.5px solid #e2e8f0",
    fontSize: "14px",
    resize: "vertical",
    minHeight: "70px",
    background: "#fafbfc",
    fontFamily: "inherit",
  },
  hint: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0,
  },
  emailSuggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "4px",
  },
  suggestionChip: {
    padding: "4px 10px",
    background: "#f0f9ff",
    color: "#0369a1",
    border: "1px solid #bae6fd",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "none",
  },
  timeBtns: {
    display: "flex",
    gap: "8px",
  },
  timeBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 150ms ease",
    boxShadow: "none",
  },
  generateBtn: {
    padding: "14px",
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(99,102,241,0.25)",
    marginTop: "6px",
  },
  // Generating state
  generatingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  generatingText: {
    fontSize: "16px",
    color: "#1e293b",
    fontWeight: "600",
  },
  generatingHint: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  // Done state
  doneBody: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    background: "#f0fdf4",
    borderRadius: "12px",
    border: "1px solid #bbf7d0",
  },
  successIcon: { fontSize: "28px" },
  successTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#166534",
    margin: 0,
  },
  successDetail: {
    fontSize: "13px",
    color: "#4ade80",
    margin: "2px 0 0",
  },
  linkBox: {
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  linkLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "8px",
  },
  linkRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  linkCode: {
    flex: 1,
    padding: "8px 12px",
    background: "#f1f5f9",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#334155",
    wordBreak: "break-all",
  },
  copyBtn: {
    padding: "8px 14px",
    background: "#e0e7ff",
    color: "#4338ca",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "none",
  },
  emailSection: {
    padding: "16px",
    background: "#eff6ff",
    borderRadius: "12px",
    border: "1px solid #bfdbfe",
  },
  emailLabel: {
    fontSize: "14px",
    color: "#1e40af",
    margin: "0 0 12px",
  },
  sendEmailBtn: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
  },
  emailSentBadge: {
    padding: "10px 16px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "center",
  },
  closeModalBtn: {
    padding: "12px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "none",
  },
};

export default QuizInvite;
