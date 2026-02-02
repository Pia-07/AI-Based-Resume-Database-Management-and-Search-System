import { useState, useEffect, useRef } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatMessage from "../components/ChatMessage";
import ChatInputBar from "../components/ChatInputBar";
import ChartRenderer from "../components/ChartRenderer";

/**
 * Chatbot Page - Premium ChatGPT-like interface
 * Features:
 * - Full-screen chat with sidebar navigation
 * - Chat history persistence
 * - Real-time streaming animations
 * - Responsive design
 * - Professional UI/UX
 */
const Chatbot = () => {
  // State Management
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-scroll
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("chatHistory");
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChats(parsed);
        if (parsed.length > 0) {
          setActiveChat(parsed[0].id);
          setMessages(parsed[0].messages || []);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    }
  }, []);

  // Save current chat when messages change
  useEffect(() => {
    if (activeChat && messages.length > 0) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat
            ? { ...chat, messages, updatedAt: new Date().toISOString() }
            : chat
        )
      );
    }
  }, [messages, activeChat]);

  // Generate chat title from first message
  const generateChatTitle = (firstMessage) => {
    const title = firstMessage.substring(0, 50);
    return title.length < firstMessage.length ? title + "..." : title;
  };

  // Create new chat
  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newChat.id);
    setMessages([]);
    setInput("");
  };

  // Select existing chat
  const handleSelectChat = (chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setActiveChat(chatId);
      setMessages(chat.messages || []);
      setInput("");
    }
  };

  // Delete chat
  const handleDeleteChat = (chatId) => {
    if (window.confirm("Delete this chat? This cannot be undone.")) {
      const updatedChats = chats.filter((c) => c.id !== chatId);
      setChats(updatedChats);

      if (activeChat === chatId) {
        if (updatedChats.length > 0) {
          handleSelectChat(updatedChats[0].id);
        } else {
          setActiveChat(null);
          setMessages([]);
        }
      }
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Update chat title if first message
    if (messages.length === 0) {
      const title = generateChatTitle(input);
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat ? { ...chat, title } : chat
        )
      );
    }

    setInput("");
    setIsLoading(true);

    // Add loading state
    const loadingMessage = {
      id: (Date.now() + 1).toString(),
      sender: "assistant",
      text: null,
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      console.log("📤 Sending message:", userMessage.text);
      
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.text }),
      });

      console.log("📥 Response status:", res.status, res.statusText);
      console.log("📥 Response headers:", Object.fromEntries(res.headers));

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Backend error:", errorText);
        throw new Error(`Backend error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      console.log("✅ Received data:", data);
      console.log("📊 Chart data:", data.chart);

      // Replace loading message with actual response
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: loadingMessage.id,
          sender: "assistant",
          text: data.reply || "I couldn't generate a response. Please try again.",
          chart: data.chart || null,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("❌ Chat error:", err);
      // Replace loading message with error
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: loadingMessage.id,
          sender: "assistant",
          text: `❌ Error: ${err.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <ChatSidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Chat Area */}
      <div
        style={{
          ...styles.main,
          marginLeft: sidebarCollapsed ? "0" : "260px",
        }}
      >
        {/* Messages Area */}
        <div style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💬</div>
              <h2 style={styles.emptyTitle}>Start a New Conversation</h2>
              <p style={styles.emptyDesc}>
                Ask me anything about your resumes, candidates, or hiring insights.
              </p>
              <div style={styles.quickActions}>
                {[
                  "Show me skills distribution",
                  "List all candidates",
                  "Tell me about experience levels",
                ].map((action, idx) => (
                  <button
                    key={idx}
                    style={styles.quickActionBtn}
                    onClick={() => setInput(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.messagesList}>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  sender={msg.sender}
                  text={msg.text}
                  chart={msg.chart}
                  isLoading={msg.isLoading}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInputBar
          input={input}
          onInputChange={setInput}
          onSend={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "var(--bg-secondary)",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    transition: "margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  messagesList: {
    padding: "24px 40px",
    display: "flex",
    flexDirection: "column",
    maxWidth: "900px",
    margin: "0 auto",
    width: "100%",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    textAlign: "center",
    paddingBottom: "60px",
  },
  emptyIcon: {
    fontSize: "56px",
    marginBottom: "16px",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "var(--text-primary)",
    marginBottom: "8px",
  },
  emptyDesc: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "32px",
    maxWidth: "300px",
  },
  quickActions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
  },
  quickActionBtn: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1.5px solid #e2e8f0",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 150ms ease",
  },
};

export default Chatbot;
