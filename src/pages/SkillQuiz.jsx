import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getQuiz, submitQuiz } from "../services/api";

/**
 * SkillQuiz — Candidate-facing quiz page with countdown timer.
 * 
 * Features:
 * - Fetches quiz by ID from URL params
 * - Renders MCQ questions with radio selections
 * - Countdown timer with visual progress bar
 * - Auto-submit on timer expiry
 * - Score display after submission
 * - Prevents edits after submission/expiry
 */
const SkillQuiz = () => {
  const { quizId } = useParams();

  // Quiz state
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const timerRef = useRef(null);
  const autoSubmitRef = useRef(false);

  // Fetch quiz on mount
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const data = await getQuiz(quizId);
        if (!data.success) {
          setError(data.error || "Quiz not found");
          return;
        }
        if (data.status === "completed") {
          setError("This quiz has already been submitted.");
          return;
        }
        setQuiz(data);
        setTimeLeft(data.time_limit_minutes * 60); // Convert minutes to seconds
      } catch (err) {
        setError(err.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [quizId]);

  // Handle timer countdown
  useEffect(() => {
    if (!timerStarted || submitted || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-submit
          if (!autoSubmitRef.current) {
            autoSubmitRef.current = true;
            handleSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timerStarted, submitted]);

  // Start timer when candidate begins
  const startQuiz = () => {
    setTimerStarted(true);
  };

  // Select an answer
  const handleAnswer = (questionId, optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [String(questionId)]: optionIndex }));
  };

  // Submit quiz
  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (submitted || submitting) return;
    
    if (!isAutoSubmit) {
      const unanswered = quiz.questions.length - Object.keys(answers).length;
      if (unanswered > 0) {
        if (!window.confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`)) {
          return;
        }
      }
    }

    setSubmitting(true);
    clearInterval(timerRef.current);

    try {
      const data = await submitQuiz(quizId, answers);
      if (data.success) {
        setResult(data);
        setSubmitted(true);
      } else {
        setError(data.error || "Submission failed");
      }
    } catch (err) {
      setError(err.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }, [submitted, submitting, quiz, answers, quizId]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Timer progress percentage
  const timerProgress = quiz ? (timeLeft / (quiz.time_limit_minutes * 60)) * 100 : 100;
  const isUrgent = timeLeft <= 120; // Last 2 minutes

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading your quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <span style={styles.errorIcon}>⚠️</span>
          <h2 style={styles.errorTitle}>Quiz Unavailable</h2>
          <p style={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  // Result state
  if (submitted && result) {
    return (
      <div style={styles.container}>
        <div style={styles.resultCard}>
          <div style={styles.resultIcon}>{result.passed ? "🎉" : "📊"}</div>
          <h2 style={styles.resultTitle}>
            {result.passed ? "Congratulations!" : "Quiz Completed"}
          </h2>
          <div style={styles.scoreCircle}>
            <span style={{
              ...styles.scoreValue,
              color: result.percentage >= 70 ? "#10b981" : result.percentage >= 40 ? "#f59e0b" : "#ef4444",
            }}>
              {result.percentage}%
            </span>
          </div>
          <p style={styles.scoreDetail}>
            {result.score} out of {result.total} correct
          </p>
          <div style={{
            ...styles.statusBadge,
            background: result.passed ? "#dcfce7" : "#fee2e2",
            color: result.passed ? "#166534" : "#991b1b",
          }}>
            {result.passed ? "✓ PASSED" : "✗ NOT PASSED"}
          </div>
          <p style={styles.resultFooter}>
            Your results have been sent to the HR team. Thank you!
          </p>
        </div>
      </div>
    );
  }

  // Pre-quiz start screen
  if (!timerStarted) {
    return (
      <div style={styles.container}>
        <div style={styles.startCard}>
          <div style={styles.startIcon}>📝</div>
          <h1 style={styles.startTitle}>Skill Verification Quiz</h1>
          <p style={styles.startName}>Hello, {quiz.candidate_name}!</p>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Questions</span>
              <span style={styles.infoValue}>{quiz.total_questions}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Time Limit</span>
              <span style={styles.infoValue}>{quiz.time_limit_minutes} min</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Skills Tested</span>
              <span style={styles.infoValue}>{quiz.skills.length}</span>
            </div>
          </div>
          <div style={styles.skillTags}>
            {quiz.skills.map((skill, i) => (
              <span key={i} style={styles.skillTag}>{skill}</span>
            ))}
          </div>
          <div style={styles.instructions}>
            <h3 style={styles.instructTitle}>📋 Instructions</h3>
            <ul style={styles.instructList}>
              <li>The timer starts as soon as you click "Begin Quiz"</li>
              <li>Each question has only one correct answer</li>
              <li>You can navigate between questions freely</li>
              <li>The quiz auto-submits when time runs out</li>
              <li>You cannot retake the quiz once submitted</li>
            </ul>
          </div>
          <button style={styles.startBtn} onClick={startQuiz}>
            🚀 Begin Quiz
          </button>
        </div>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div style={styles.container}>
      {/* Timer Bar */}
      <div style={styles.timerBar}>
        <div style={styles.timerInfo}>
          <span style={styles.timerLabel}>⏱ Time Remaining</span>
          <span style={{
            ...styles.timerValue,
            color: isUrgent ? "#ef4444" : "#1e293b",
            animation: isUrgent ? "pulse 1s infinite" : "none",
          }}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <div style={styles.progressBarBg}>
          <div style={{
            ...styles.progressBarFill,
            width: `${timerProgress}%`,
            background: isUrgent
              ? "linear-gradient(90deg, #ef4444, #f87171)"
              : "linear-gradient(90deg, #6366f1, #818cf8)",
          }} />
        </div>
        <div style={styles.timerMeta}>
          <span>{Object.keys(answers).length}/{quiz.total_questions} answered</span>
          <span>{quiz.candidate_name}</span>
        </div>
      </div>

      {/* Questions */}
      <div style={styles.questionsContainer}>
        {quiz.questions.map((q, index) => (
          <div key={q.id} style={{
            ...styles.questionCard,
            borderLeft: answers[String(q.id)] !== undefined
              ? "4px solid #6366f1"
              : "4px solid transparent",
          }}>
            <div style={styles.questionHeader}>
              <span style={styles.questionNum}>Q{index + 1}</span>
              <span style={{
                ...styles.diffBadge,
                background: q.difficulty === "hard" ? "#fee2e2" : q.difficulty === "medium" ? "#fef3c7" : "#dcfce7",
                color: q.difficulty === "hard" ? "#991b1b" : q.difficulty === "medium" ? "#92400e" : "#166534",
              }}>
                {q.difficulty}
              </span>
              <span style={styles.skillBadge}>{q.skill}</span>
            </div>
            <p style={styles.questionText}>{q.question}</p>
            <div style={styles.optionsGrid}>
              {q.options.map((opt, optIdx) => (
                <label
                  key={optIdx}
                  style={{
                    ...styles.optionLabel,
                    background: answers[String(q.id)] === optIdx ? "#e0e7ff" : "#f8fafc",
                    borderColor: answers[String(q.id)] === optIdx ? "#6366f1" : "#e2e8f0",
                  }}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[String(q.id)] === optIdx}
                    onChange={() => handleAnswer(q.id, optIdx)}
                    disabled={submitted}
                    style={styles.radioInput}
                  />
                  <span style={styles.optionIndex}>
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span style={styles.optionText}>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div style={styles.submitBar}>
        <button
          style={{
            ...styles.submitBtn,
            opacity: submitting ? 0.7 : 1,
          }}
          onClick={() => handleSubmit(false)}
          disabled={submitting || submitted}
        >
          {submitting ? "Submitting..." : `Submit Quiz (${Object.keys(answers).length}/${quiz.total_questions} answered)`}
        </button>
      </div>
    </div>
  );
};

// ── Styles ──
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #faf5ff 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  // Loading
  loadingCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
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
  loadingText: {
    fontSize: "16px",
    color: "#64748b",
  },
  // Error
  errorCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "12px",
    textAlign: "center",
    padding: "20px",
  },
  errorIcon: { fontSize: "48px" },
  errorTitle: { fontSize: "24px", color: "#1e293b", fontWeight: "700" },
  errorText: { fontSize: "16px", color: "#64748b", maxWidth: "400px" },
  // Result
  resultCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "16px",
    textAlign: "center",
    padding: "40px 20px",
  },
  resultIcon: { fontSize: "64px" },
  resultTitle: { fontSize: "28px", fontWeight: "800", color: "#1e293b" },
  scoreCircle: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "white",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "16px 0",
  },
  scoreValue: {
    fontSize: "32px",
    fontWeight: "800",
  },
  scoreDetail: { fontSize: "16px", color: "#475569" },
  statusBadge: {
    padding: "8px 24px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
  resultFooter: {
    fontSize: "14px",
    color: "#94a3b8",
    marginTop: "24px",
  },
  // Start screen
  startCard: {
    maxWidth: "600px",
    width: "100%",
    margin: "40px 20px",
    padding: "40px",
    background: "white",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  startIcon: { fontSize: "56px" },
  startTitle: { fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: 0 },
  startName: { fontSize: "18px", color: "#6366f1", fontWeight: "600" },
  infoGrid: {
    display: "flex",
    gap: "20px",
    margin: "12px 0",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "12px 20px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  infoLabel: { fontSize: "12px", color: "#94a3b8", fontWeight: "500", textTransform: "uppercase" },
  infoValue: { fontSize: "20px", fontWeight: "700", color: "#1e293b" },
  skillTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
  },
  skillTag: {
    padding: "6px 14px",
    background: "#e0e7ff",
    color: "#4338ca",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },
  instructions: {
    width: "100%",
    textAlign: "left",
    padding: "20px",
    background: "#fefce8",
    borderRadius: "12px",
    border: "1px solid #fef08a",
    margin: "8px 0",
  },
  instructTitle: { fontSize: "15px", color: "#854d0e", marginBottom: "10px" },
  instructList: {
    margin: 0,
    paddingLeft: "20px",
    fontSize: "14px",
    color: "#713f12",
    lineHeight: "1.8",
  },
  startBtn: {
    padding: "14px 48px",
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
    transition: "all 200ms ease",
    marginTop: "8px",
  },
  // Timer
  timerBar: {
    width: "100%",
    padding: "12px 24px",
    background: "white",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  timerInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  timerLabel: { fontSize: "13px", color: "#64748b", fontWeight: "500" },
  timerValue: { fontSize: "22px", fontWeight: "800" },
  progressBarBg: {
    width: "100%",
    height: "6px",
    background: "#e2e8f0",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 1s linear",
  },
  timerMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "6px",
  },
  // Questions
  questionsContainer: {
    maxWidth: "800px",
    width: "100%",
    padding: "24px 20px 120px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  questionCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    transition: "all 200ms ease",
  },
  questionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  questionNum: {
    padding: "4px 10px",
    background: "#6366f1",
    color: "white",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
  },
  diffBadge: {
    padding: "3px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  skillBadge: {
    padding: "3px 10px",
    background: "#f0f9ff",
    color: "#0369a1",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
  },
  questionText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    lineHeight: "1.5",
    marginBottom: "16px",
  },
  optionsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  optionLabel: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    cursor: "pointer",
    transition: "all 150ms ease",
    fontSize: "14px",
  },
  radioInput: {
    display: "none",
  },
  optionIndex: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
    flexShrink: 0,
  },
  optionText: {
    color: "#334155",
    lineHeight: "1.4",
  },
  // Submit bar
  submitBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "16px 24px",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
    display: "flex",
    justifyContent: "center",
    zIndex: 50,
  },
  submitBtn: {
    padding: "14px 48px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
    transition: "all 200ms ease",
    maxWidth: "600px",
    width: "100%",
  },
};

export default SkillQuiz;
