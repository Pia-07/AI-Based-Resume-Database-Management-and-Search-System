import ReactMarkdown from "react-markdown";
import ChartRenderer from "./ChartRenderer";

/**
 * ChatMessage - Premium message bubble component for AI and user messages
 * Features:
 * - Different styling for user vs assistant
 * - Markdown support (code, bold, lists, etc)
 * - Typing animation
 * - Smooth entry animations
 * - Chart support
 */
const ChatMessage = ({ sender, text, chart, isLoading, isTiming }) => {
  const isUser = sender === "user" || sender === "hr";

  return (
    <div
      style={{
        ...styles.messageWrapper,
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
      className="animate-slideInRight"
    >
      {/* Avatar */}
      {/* Brain emoji removed */}

      <div
        style={{
          ...styles.messageBubble,
          ...(isUser ? styles.userBubble : styles.assistantBubble),
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
            <p style={styles.thinkingText}>AI is analyzing...</p>
          </div>
        )}

        {/* Timing Animation */}
        {isTiming && !isLoading && (
          <div style={styles.timingContainer}>
            <div style={styles.typingIndicator}>
              <span style={styles.typingDot} />
              <span style={styles.typingDot} />
              <span style={styles.typingDot} />
            </div>
          </div>
        )}

        {/* Message Content */}
        {text && !isLoading && !isTiming && (
          <div style={styles.messageContent}>
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p style={styles.paragraph} {...props} />,
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code style={styles.inlineCode} {...props} />
                  ) : (
                    <code style={styles.codeBlock} {...props} />
                  ),
                pre: ({ node, ...props }) => (
                  <pre style={styles.preBlock} {...props} />
                ),
                ul: ({ node, ...props }) => <ul style={styles.list} {...props} />,
                ol: ({ node, ...props }) => <ol style={styles.list} {...props} />,
                li: ({ node, ...props }) => <li style={styles.listItem} {...props} />,
                strong: ({ node, ...props }) => (
                  <strong style={styles.strong} {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em style={styles.italic} {...props} />
                ),
                h1: ({ node, ...props }) => <h1 style={styles.heading1} {...props} />,
                h2: ({ node, ...props }) => <h2 style={styles.heading2} {...props} />,
                h3: ({ node, ...props }) => <h3 style={styles.heading3} {...props} />,
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}

        {/* Chart */}
        {chart && (
          <div style={styles.chartContainer}>
            <ChartRenderer data={chart} />
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && <div style={styles.avatar}>👤</div>}
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
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "var(--primary-lighter)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  messageBubble: {
    maxWidth: "70%",
    borderRadius: "16px",
    padding: "12px 16px",
    wordWrap: "break-word",
    overflow: "hidden",
    lineHeight: "1.5",
    animation: "fadeIn 300ms ease-out",
  },
  userBubble: {
    background: "var(--primary)",
    color: "#FFFFFF",
    borderBottomRightRadius: "4px",
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.2)",
  },
  assistantBubble: {
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
    borderBottomLeftRadius: "4px",
    border: "1px solid #e2e8f0",
  },
  messageContent: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "inherit",
  },
  paragraph: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    color: "inherit",
  },
  inlineCode: {
    background: "rgba(99, 102, 241, 0.1)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "'Fira Code', monospace",
    fontSize: "13px",
    color: "var(--primary)",
  },
  codeBlock: {
    background: "rgba(15, 23, 42, 0.08)",
    borderRadius: "8px",
    padding: "12px",
    fontFamily: "'Fira Code', monospace",
    fontSize: "13px",
    overflowX: "auto",
    margin: "8px 0",
    display: "block",
  },
  preBlock: {
    background: "rgba(15, 23, 42, 0.08)",
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
    marginBottom: "4px",
    fontSize: "14px",
  },
  strong: {
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
    opacity: 0.8,
  },
  heading1: {
    fontSize: "18px",
    fontWeight: "700",
    margin: "12px 0 8px 0",
  },
  heading2: {
    fontSize: "16px",
    fontWeight: "700",
    margin: "10px 0 6px 0",
  },
  heading3: {
    fontSize: "14px",
    fontWeight: "700",
    margin: "8px 0 4px 0",
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
    background: "var(--primary)",
    animation: "pulse 1.4s ease-in-out infinite",
  },
  thinkingText: {
    fontSize: "13px",
    color: "var(--text-secondary)",
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
    background: "currentColor",
    opacity: 0.6,
    animation: "typingBounce 1.4s infinite",
  },
  chartContainer: {
    marginTop: "12px",
    borderRadius: "8px",
    overflow: "auto",
    overflowX: "auto",
    overflowY: "auto",
    padding: "10px",
    maxHeight: "600px",
    backgroundColor: "#f8fafc",
  },
};

export default ChatMessage;
