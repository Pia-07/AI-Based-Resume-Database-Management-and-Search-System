import { useRef, useEffect } from "react";

/**
 * ChatInputBar - Premium sticky input area for chat messages
 * Features:
 * - Auto-expanding textarea for multi-line input
 * - Send button with loading state
 * - Shift+Enter for new line, Enter to send
 * - Disabled state while AI is responding
 * - Character counter (optional)
 * - Smooth animations
 */
const ChatInputBar = ({
  input,
  onInputChange,
  onSend,
  isLoading,
  placeholder = "Ask hiring requirements...",
}) => {
  const textareaRef = useRef(null);

  // Auto-expand textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === "Enter" && !e.shiftKey && input.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  const handleChange = (e) => {
    onInputChange(e.target.value);
  };

  return (
    <div style={styles.container}>
      {/* Input Area */}
      <div style={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          style={styles.textarea}
          rows={1}
        />

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          style={{
            ...styles.sendButton,
            opacity: !input.trim() || isLoading ? 0.5 : 1,
            cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
          }}
          title="Send message (Enter)"
        >
          {isLoading ? (
            <span style={styles.spinner} />
          ) : (
            <span style={styles.sendIcon}>➤</span>
          )}
        </button>
      </div>

      {/* Helper Text */}
      <div style={styles.helperText}>
        <span style={styles.helperTextItem}>
          Enter to send • Shift+Enter for new line
        </span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "16px",
    background: "var(--bg-primary)",
    borderTop: "1px solid #e2e8f0",
    position: "sticky",
    bottom: 0,
    zIndex: 10,
  },
  inputWrapper: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1.5px solid #e2e8f0",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "none",
    maxHeight: "120px",
    transition: "all 150ms ease",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    fontWeight: "500",
  },
  sendButton: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "var(--primary)",
    border: "none",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    transition: "all 150ms ease",
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.2)",
    flexShrink: 0,
  },
  sendIcon: {
    display: "inline-block",
    fontSize: "18px",
    fontWeight: "bold",
  },
  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    animation: "spin 0.8s linear infinite",
  },
  helperText: {
    marginTop: "8px",
    fontSize: "12px",
    color: "var(--text-tertiary)",
    display: "flex",
    gap: "12px",
  },
  helperTextItem: {
    display: "flex",
    alignItems: "center",
  },
};

export default ChatInputBar;
