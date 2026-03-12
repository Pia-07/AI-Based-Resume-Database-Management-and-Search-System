import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChartRenderer from "./ChartRenderer";
import { useState, useEffect } from "react";

/**
 * ChatMessage - Premium message bubble component for AI and user messages
 * Features:
 * - Different styling for user vs assistant
 * - Markdown support (code, bold, lists, etc)
 * - Typing animation
 * - Smooth entry animations
 * - Chart support with dark mode
 * - Proper text visibility in both themes
 * - Retry capability for failed messages
 */
const ChatMessage = ({ sender, text, chart, isLoading, isTiming, onRetry }) => {
  const isUser = sender === "user" || sender === "hr";

  // Detect dark mode from document
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDarkMode(theme === "dark" ||
        (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    // Also listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkTheme);
    };
  }, []);

  // Dynamic styles based on theme
  const getAssistantBubbleStyle = () => ({
    background: isDarkMode ? "#1e293b" : "#f1f5f9",
    color: isDarkMode ? "#f1f5f9" : "#0f172a",
    borderBottomLeftRadius: "4px",
    border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
  });

  const getTextColor = () => isDarkMode ? "#f1f5f9" : "#0f172a";
  const getSecondaryTextColor = () => isDarkMode ? "#cbd5e1" : "#475569";

  return (
    <div
      style={{
        ...styles.messageWrapper,
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
      className="animate-slideInRight"
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div style={{
          ...styles.avatar,
          background: isDarkMode ? "#334155" : "#e0e7ff",
        }}>🤖</div>
      )}

      <div
        style={{
          ...styles.messageBubble,
          ...(isUser ? styles.userBubble : getAssistantBubbleStyle()),
        }}
      >
        {/* Loading State */}
        {isLoading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingDots}>
              <div style={styles.dot} />
              <div style={styles.dot} />
              <div style={styles.dot} />
            </div>
            <p style={{
              ...styles.thinkingText,
              color: getSecondaryTextColor(),
            }}>AI is analyzing...</p>
          </div>
        )}

        {/* Timing Animation */}
        {isTiming && !isLoading && (
          <div style={styles.timingContainer}>
            <div style={styles.typingIndicator}>
              <span style={{ ...styles.typingDot, background: getSecondaryTextColor() }} />
              <span style={{ ...styles.typingDot, background: getSecondaryTextColor() }} />
              <span style={{ ...styles.typingDot, background: getSecondaryTextColor() }} />
            </div>
          </div>
        )}

        {/* Message Content */}
        {text && !isLoading && !isTiming && (
          <div style={{
            ...styles.messageContent,
            color: isUser ? "#ffffff" : getTextColor(),
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => (
                  <p style={{
                    ...styles.paragraph,
                    color: isUser ? "#ffffff" : getTextColor(),
                  }} {...props} />
                ),
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code style={{
                      ...styles.inlineCode,
                      background: isDarkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                    }} {...props} />
                  ) : (
                    <code style={{
                      ...styles.codeBlock,
                      background: isDarkMode ? "#0f172a" : "rgba(15, 23, 42, 0.08)",
                      color: isDarkMode ? "#e2e8f0" : "#1e293b",
                    }} {...props} />
                  ),
                pre: ({ node, ...props }) => (
                  <pre style={{
                    ...styles.preBlock,
                    background: isDarkMode ? "#0f172a" : "rgba(15, 23, 42, 0.08)",
                    color: isDarkMode ? "#e2e8f0" : "#1e293b",
                  }} {...props} />
                ),
                ul: ({ node, ...props }) => <ul style={styles.list} {...props} />,
                ol: ({ node, ...props }) => <ol style={styles.list} {...props} />,
                li: ({ node, ...props }) => (
                  <li style={{
                    ...styles.listItem,
                    color: isUser ? "#ffffff" : getTextColor(),
                  }} {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong style={{
                    ...styles.strong,
                    color: isUser ? "#ffffff" : getTextColor(),
                  }} {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em style={styles.italic} {...props} />
                ),
                h1: ({ node, ...props }) => (
                  <h1 style={{
                    ...styles.heading1,
                    color: isUser ? "#ffffff" : getTextColor(),
                  }} {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 style={{
                    ...styles.heading2,
                    color: isUser ? "#ffffff" : getTextColor(),
                  }} {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 style={{
                    ...styles.heading3,
                    color: isUser ? "#ffffff" : getTextColor(),
                  }} {...props} />
                ),
              }}
            >
              {text}
            </ReactMarkdown>

            {/* Retry Button for Failed Messages */}
            {text && text.includes("❌ Error:") && onRetry && (
              <button
                onClick={onRetry}
                style={{
                  ...styles.retryButton,
                  background: isDarkMode ? "#334155" : "#fee2e2",
                  color: isDarkMode ? "#f87171" : "#b91c1c",
                  borderColor: isDarkMode ? "#475569" : "#fca5a5",
                }}
              >
                🔄 Retry Message
              </button>
            )}
          </div>
        )}

        {/* Chart */}
        {chart && (
          <div style={{
            ...styles.chartContainer,
            backgroundColor: isDarkMode ? "#1e293b" : "#f8fafc",
            border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
          }}>
            <ChartRenderer data={chart} isDarkMode={isDarkMode} />
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div style={{
          ...styles.avatar,
          background: "#6366f1",
        }}>👤</div>
      )}
    </div>
  );
};

const styles = {
  messageWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    marginBottom: "16px",
    animation: "slideInRight 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  messageBubble: {
    maxWidth: "70%",
    borderRadius: "16px",
    padding: "14px 18px",
    wordWrap: "break-word",
    overflow: "hidden",
    lineHeight: "1.5",
    animation: "fadeIn 300ms ease-out",
  },
  userBubble: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#FFFFFF",
    borderBottomRightRadius: "4px",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
  },
  messageContent: {
    fontSize: "14px",
    lineHeight: "1.7",
  },
  paragraph: {
    margin: "0 0 10px 0",
    fontSize: "14px",
  },
  inlineCode: {
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "'Fira Code', monospace",
    fontSize: "13px",
    color: "#6366f1",
  },
  codeBlock: {
    borderRadius: "8px",
    padding: "12px",
    fontFamily: "'Fira Code', monospace",
    fontSize: "13px",
    overflowX: "auto",
    margin: "8px 0",
    display: "block",
  },
  preBlock: {
    borderRadius: "8px",
    padding: "12px",
    fontFamily: "'Fira Code', monospace",
    fontSize: "13px",
    overflowX: "auto",
    margin: "8px 0",
  },
  list: {
    marginLeft: "20px",
    marginTop: "8px",
    marginBottom: "8px",
  },
  listItem: {
    marginBottom: "6px",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  strong: {
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
    opacity: 0.9,
  },
  heading1: {
    fontSize: "20px",
    fontWeight: "700",
    margin: "16px 0 10px 0",
  },
  heading2: {
    fontSize: "18px",
    fontWeight: "700",
    margin: "14px 0 8px 0",
  },
  heading3: {
    fontSize: "16px",
    fontWeight: "700",
    margin: "12px 0 6px 0",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  loadingDots: {
    display: "flex",
    gap: "6px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#6366f1",
    animation: "pulse 1.4s ease-in-out infinite",
  },
  thinkingText: {
    fontSize: "13px",
    margin: 0,
    fontStyle: "italic",
  },
  timingContainer: {
    display: "flex",
    alignItems: "center",
  },
  typingIndicator: {
    display: "flex",
    gap: "4px",
  },
  typingDot: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    opacity: 0.6,
    animation: "typingBounce 1.4s infinite",
  },
  chartContainer: {
    marginTop: "16px",
    borderRadius: "12px",
    overflow: "hidden",
    padding: "12px",
  },
  retryButton: {
    marginTop: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 150ms ease",
  },
};

export default ChatMessage;
