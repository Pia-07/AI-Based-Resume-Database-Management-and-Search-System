import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import Logo from "../components/Logo";
import ChatMessage from "../components/ChatMessage";
import ChatInputBar from "../components/ChatInputBar";
import ChartRenderer from "../components/ChartRenderer";
import {
  sendChatMessage,
  warmUpBackend
} from "../services/api";


/**
 * Chatbot Page - Premium ChatGPT-like interface
 * 
 * Chat state (chats, activeChat, messages) is managed by AppLayout
 * and passed via Outlet context. This page only handles message sending.
 */
const Chatbot = () => {
  // Get shared state from AppLayout
  const {
    chats, setChats,
    activeChat, setActiveChat,
    messages, setMessages,
    isInitialized,
    saveToBackend,
  } = useOutletContext();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Generate chat title from first message
  const generateChatTitle = (firstMessage) => {
    const title = firstMessage.substring(0, 50);
    return title.length < firstMessage.length ? title + "..." : title;
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
      const data = await sendChatMessage(
        userMessage.text,
        currentChatId,
        updatedMessages
      );

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
      console.error("Chat error:", err);
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
    const failedIndex = messages.findIndex(m => m.id === failedMessageId);
    if (failedIndex > 0) {
      const userMessage = messages[failedIndex - 1];
      if (userMessage && userMessage.sender === "user") {
        const updatedMessages = messages.slice(0, failedIndex - 1);
        setMessages(updatedMessages);
        setInput(userMessage.text);
        setTimeout(() => {
          const sendBtn = document.getElementById("chat-send-btn");
          if (sendBtn) sendBtn.click();
        }, 100);
      }
    }
  };

  return (
    <div style={styles.container}>
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
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
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
