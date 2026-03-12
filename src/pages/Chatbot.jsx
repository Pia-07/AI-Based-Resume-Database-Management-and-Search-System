import { useState, useEffect, useRef, useCallback } from "react";
import Logo from "../components/Logo";
import ChatSidebar from "../components/ChatSidebar";
import ChatMessage from "../components/ChatMessage";
import ChatInputBar from "../components/ChatInputBar";
import ChartRenderer from "../components/ChartRenderer";
import ResumeUpload from "../components/ResumeUpload";
import {
  sendChatMessage,
  getChatHistory,
  saveChatToBackend,
  deleteChatFromBackend,
  warmUpBackend
} from "../services/api";


/**
 * Chatbot Page - Premium ChatGPT-like interface
 * Features:
 * - Full-screen chat with sidebar navigation
 * - Chat history persistence to MongoDB backend
 * - Conversational context (previous messages sent to LLM)
 * - Real-time streaming animations
 * - Responsive design
 */
const Chatbot = () => {
  // State Management
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-scroll
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chats from backend on mount
  useEffect(() => {
    // Ensure backend is awake (Render free tier cold start)
    warmUpBackend();

    const loadChats = async () => {
      console.log("🔄 Loading chat history from backend...");

      try {
        const response = await getChatHistory();
        const backendChats = response.chats || [];

        if (backendChats.length > 0) {
          // Transform backend format to frontend format
          const transformedChats = backendChats.map(chat => ({
            id: chat.chat_id,
            title: chat.title || "New Conversation",
            messages: chat.messages ? chat.messages.map(m => ({
              ...m,
              chart: m.chart || null // Ensure chart data is carried over
            })) : [],
            createdAt: chat.created_at,
            updatedAt: chat.updated_at,
          }));

          setChats(transformedChats);
          console.log("✅ Loaded", transformedChats.length, "chats from backend");
        } else {
          // No backend chats, check localStorage as fallback
          const savedChats = localStorage.getItem("chatHistory");
          if (savedChats) {
            try {
              const parsed = JSON.parse(savedChats);
              setChats(parsed);
              console.log("📂 Loaded", parsed.length, "chats from localStorage");
            } catch (err) {
              console.error("Failed to load chat history from localStorage:", err);
              setChats([]);
            }
          }
        }
      } catch (error) {
        console.error("❌ Failed to load chats from backend:", error);
        // Fallback to localStorage
        const savedChats = localStorage.getItem("chatHistory");
        if (savedChats) {
          try {
            setChats(JSON.parse(savedChats));
          } catch {
            setChats([]);
          }
        }
      }

      setIsInitialized(true);
    };

    loadChats();
  }, []);

  // Save to backend when chat changes (debounced)
  const saveToBackend = useCallback(async (chatId, title, msgs) => {
    if (!chatId || msgs.length === 0) return;

    try {
      await saveChatToBackend(chatId, title, msgs);
    } catch (error) {
      console.error("Failed to save to backend:", error);
    }
  }, []);

  // Save current chat when messages change
  useEffect(() => {
    if (activeChat && messages.length > 0 && isInitialized) {
      const currentChat = chats.find(c => c.id === activeChat);
      const title = currentChat?.title || "New Conversation";

      // Update local state
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat
            ? { ...chat, messages, updatedAt: new Date().toISOString() }
            : chat
        )
      );

      // Debounce backend save
      const timeoutId = setTimeout(() => {
        saveToBackend(activeChat, title, messages);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, activeChat, isInitialized, saveToBackend]);

  // Also save to localStorage as backup
  useEffect(() => {
    if (isInitialized && chats.length > 0) {
      try {
        localStorage.setItem("chatHistory", JSON.stringify(chats));
      } catch (err) {
        console.error("Failed to save to localStorage:", err);
      }
    }
  }, [chats, isInitialized]);

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
  const handleDeleteChat = async (chatId) => {
    if (window.confirm("Delete this chat? This cannot be undone.")) {
      // Delete from backend
      await deleteChatFromBackend(chatId);

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

  // Send message with chat history context
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Create new chat if none active
    let currentChatId = activeChat;
    if (!currentChatId) {
      const newChat = {
        id: Date.now().toString(),
        title: "New Conversation",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat.id);
      currentChatId = newChat.id;
    }

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Update chat title if first message
    if (messages.length === 0) {
      const title = generateChatTitle(input);
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId ? { ...chat, title } : chat
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
      console.log("📤 Sending message with", updatedMessages.length, "history items");

      // Send message with chat history for context
      const data = await sendChatMessage(
        userMessage.text,
        currentChatId,
        updatedMessages  // Pass all previous messages for context
      );

      console.log("✅ Received response");

      const assistantMessage = {
        id: loadingMessage.id,
        sender: "assistant",
        text: data.reply || "I couldn't generate a response.",
        chart: data.chart || null,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [
        ...prev.slice(0, -1),
        assistantMessage,
      ]);
    } catch (err) {
      console.error("❌ Chat error:", err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: loadingMessage.id,
          sender: "assistant",
          text: `❌ Error: ${err.message}. Please try again.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryMessage = (failedMessageId) => {
    // Find the index of the failed assistant message
    const failedIndex = messages.findIndex(m => m.id === failedMessageId);
    if (failedIndex > 0) {
      // The user message is the one immediately preceding the failed assistant message
      const userMessage = messages[failedIndex - 1];
      if (userMessage && userMessage.sender === "user") {
        // Remove the failed message and the user message from state
        const updatedMessages = messages.slice(0, failedIndex - 1);
        setMessages(updatedMessages);
        
        // Populate the input with the user's message and automatically send
        setInput(userMessage.text);
        
        // We use setTimeout to ensure state updates before sending
        setTimeout(() => {
          // A bit hacky, but the simplest way without rewriting handleSendMessage
          // to take an explicit string argument instead of reading from state
          const sendBtn = document.getElementById("chat-send-btn");
          if (sendBtn) sendBtn.click();
        }, 100);
      }
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
        onUploadClick={() => setShowUploadModal(true)}
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
              <div style={styles.emptyIcon}>
                <Logo size="64px" color="var(--primary)" />
              </div>
              <h2 style={styles.emptyTitle}>Start a New Conversation</h2>
              <p style={styles.emptyDesc}>
                Ask me anything about your resumes, candidates, or hiring insights.
              </p>
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
                  onRetry={msg.text && msg.text.includes("❌ Error:") ? () => handleRetryMessage(msg.id) : undefined}
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
        {showUploadModal && (
          <ResumeUpload isModal={true} onClose={() => setShowUploadModal(false)} />
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)", // Smooth blue -> white gradient
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
};

export default Chatbot;
