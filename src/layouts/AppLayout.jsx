import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import ChatSidebar from "../components/ChatSidebar";
import ResumeUpload from "../components/ResumeUpload";
import {
  getChatHistory,
  saveChatToBackend,
  deleteChatFromBackend,
  warmUpBackend,
} from "../services/api";

/**
 * AppLayout — Persistent layout wrapper for all authenticated pages.
 * 
 * The sidebar is rendered ONCE here and persists across route changes.
 * Chat history is loaded here so it stays in the sidebar at all times.
 * Only the main content area (<Outlet />) changes when navigating.
 */
const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const navigate = useNavigate();

  // Load chat history from backend on mount
  useEffect(() => {
    warmUpBackend();

    const loadChats = async () => {
      try {
        const response = await getChatHistory();
        const backendChats = response.chats || [];

        if (backendChats.length > 0) {
          const transformedChats = backendChats.map(chat => ({
            id: chat.chat_id,
            title: chat.title || "New Conversation",
            messages: chat.messages ? chat.messages.map(m => ({
              ...m,
              chart: m.chart || null,
            })) : [],
            createdAt: chat.created_at,
            updatedAt: chat.updated_at,
          }));
          setChats(transformedChats);
        } else {
          // Fallback to localStorage
          const savedChats = localStorage.getItem("chatHistory");
          if (savedChats) {
            try {
              setChats(JSON.parse(savedChats));
            } catch { setChats([]); }
          }
        }
      } catch (error) {
        console.error("Failed to load chats:", error);
        const savedChats = localStorage.getItem("chatHistory");
        if (savedChats) {
          try { setChats(JSON.parse(savedChats)); } catch { setChats([]); }
        }
      }
      setIsInitialized(true);
    };
    loadChats();
  }, []);

  // Save to localStorage as backup
  useEffect(() => {
    if (isInitialized && chats.length > 0) {
      try { localStorage.setItem("chatHistory", JSON.stringify(chats)); }
      catch (err) { console.error("localStorage save failed:", err); }
    }
  }, [chats, isInitialized]);

  // Save to backend (debounced)
  const saveToBackend = useCallback(async (chatId, title, msgs) => {
    if (!chatId || msgs.length === 0) return;
    try { await saveChatToBackend(chatId, title, msgs); }
    catch (err) { console.error("Backend save failed:", err); }
  }, []);

  // Chat handlers
  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
    setMessages([]);
    navigate("/chatbot");
  };

  const handleSelectChat = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setActiveChat(chatId);
      setMessages(chat.messages || []);
      navigate("/chatbot");
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (window.confirm("Delete this chat? This cannot be undone.")) {
      await deleteChatFromBackend(chatId);
      const updatedChats = chats.filter(c => c.id !== chatId);
      setChats(updatedChats);
      if (activeChat === chatId) {
        if (updatedChats.length > 0) {
          setActiveChat(updatedChats[0].id);
          setMessages(updatedChats[0].messages || []);
        } else {
          setActiveChat(null);
          setMessages([]);
        }
      }
    }
  };

  return (
    <div style={styles.layout}>
      {/* Persistent Sidebar — rendered once, chat history always visible */}
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

      {/* Main Content Area — changes based on route */}
      <main style={{
        ...styles.main,
        marginLeft: sidebarCollapsed ? "0" : "260px",
      }}>
        <Outlet context={{
          sidebarCollapsed,
          setSidebarCollapsed,
          chats,
          setChats,
          activeChat,
          setActiveChat,
          messages,
          setMessages,
          isInitialized,
          saveToBackend,
        }} />
      </main>

      {/* Global Upload Modal */}
      {showUploadModal && (
        <ResumeUpload isModal={true} onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
};

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    transition: "margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    minHeight: "100vh",
  },
};

export default AppLayout;
