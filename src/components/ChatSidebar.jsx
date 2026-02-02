import { useState, useEffect } from "react";

/**
 * ChatSidebar - Premium ChatGPT-like sidebar for chat history and navigation
 * Features:
 * - New chat button
 * - Previous chat history with auto-generated titles
 * - Delete chat functionality
 * - Hover actions
 * - Smooth animations
 * - Collapsible on mobile
 */
const ChatSidebar = ({
  chats,
  activeChat,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [hoveredChat, setHoveredChat] = useState(null);

  // Auto-save chats to localStorage
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(chats));
    }
  }, [chats]);

  return (
    <>
      {/* Sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          transform: isCollapsed ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🧠</span>
            <span style={styles.logoText}>SmartHire</span>
          </div>
          <button
            style={styles.collapseBtn}
            onClick={onToggleCollapse}
            title="Collapse sidebar"
          >
            ✕
          </button>
        </div>

        {/* New Chat Button */}
        <button style={styles.newChatBtn} onClick={onNewChat}>
          <span style={styles.newChatIcon}>+</span>
          New Chat
        </button>

        {/* Chat History */}
        <div style={styles.chatList}>
          {chats.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No chats yet</p>
              <p style={styles.emptyStateHint}>
                Start a new conversation to get insights from your resumes
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                style={{
                  ...styles.chatItem,
                  background: activeChat === chat.id ? "#e0e7ff" : "transparent",
                }}
                onMouseEnter={() => setHoveredChat(chat.id)}
                onMouseLeave={() => setHoveredChat(null)}
                onClick={() => onSelectChat(chat.id)}
              >
                <div style={styles.chatItemContent}>
                  <div style={styles.chatIcon}>💬</div>
                  <div style={styles.chatInfo}>
                    <h4 style={styles.chatTitle}>{chat.title}</h4>
                    <p style={styles.chatDate}>
                      {new Date(chat.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Delete Button - Appears on Hover */}
                {hoveredChat === chat.id && (
                  <button
                    style={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    title="Delete chat"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerItem}>
            <span style={styles.footerIcon}>📧</span>
            <span style={styles.footerText}>support@smarthire.ai</span>
          </div>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      {isCollapsed && (
        <button
          style={styles.mobileToggleBtn}
          onClick={onToggleCollapse}
          title="Open sidebar"
        >
          ☰
        </button>
      )}

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          style={styles.overlay}
          onClick={onToggleCollapse}
        />
      )}
    </>
  );
};

const styles = {
  sidebar: {
    width: "260px",
    height: "100vh",
    background: "var(--bg-primary)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 100,
    transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "2px 0 12px rgba(15, 23, 42, 0.08)",
    paddingTop: "70px", // Account for navbar
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    borderBottom: "1px solid #e2e8f0",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "800",
    color: "var(--text-primary)",
  },
  logoIcon: {
    fontSize: "20px",
  },
  logoText: {
    fontSize: "16px",
  },
  collapseBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px",
    transition: "color 150ms ease",
  },
  newChatBtn: {
    margin: "12px",
    padding: "12px 16px",
    background: "var(--primary)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 150ms ease",
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.2)",
  },
  newChatIcon: {
    fontSize: "18px",
    fontWeight: "bold",
  },
  chatList: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    paddingRight: "4px",
    scrollBehavior: "smooth",
  },
  emptyState: {
    padding: "24px 16px",
    textAlign: "center",
    color: "var(--text-tertiary)",
  },
  emptyStateHint: {
    fontSize: "12px",
    marginTop: "8px",
    color: "var(--text-tertiary)",
    lineHeight: "1.5",
  },
  chatItem: {
    padding: "12px 12px",
    margin: "4px 8px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "all 150ms ease",
  },
  chatItemContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    minWidth: 0,
  },
  chatIcon: {
    fontSize: "18px",
    flexShrink: 0,
  },
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  chatTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  chatDate: {
    fontSize: "11px",
    color: "var(--text-tertiary)",
    margin: "2px 0 0 0",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "#ef4444",
    fontSize: "14px",
    cursor: "pointer",
    padding: "4px 8px",
    transition: "all 150ms ease",
    flexShrink: 0,
  },
  footer: {
    padding: "16px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  footerItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "var(--text-secondary)",
  },
  footerIcon: {
    fontSize: "14px",
  },
  footerText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.3)",
    display: "none",
    zIndex: 99,
  },
  mobileToggleBtn: {
    position: "fixed",
    left: "12px",
    top: "80px",
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "var(--primary)",
    color: "white",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    zIndex: 101,
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.2)",
    display: "none",
  },

  // Media queries will be handled inline or in index.css
};

export default ChatSidebar;
