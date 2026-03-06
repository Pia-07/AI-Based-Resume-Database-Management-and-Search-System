// Use VITE_API_BASE_URL from environment (set in Vercel/production).
// In development/fallback, it uses the permanent Render backend.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://smarthire-backend-usmd.onrender.com";

// ===========================
// HELPER: Get user ID from localStorage
// ===========================
const getUserId = () => {
  // First check for userId key (set by Login.jsx)
  const userId = localStorage.getItem("userId");
  if (userId) {
    return userId;
  }

  // Fallback: check for user object (alternative format)
  const user = localStorage.getItem("user");
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.user_id || parsed.email || null;
    } catch {
      return null;
    }
  }

  // Fallback to email if available
  const email = localStorage.getItem("userEmail");
  if (email) {
    return email;
  }

  return null;
};

// ===========================
// RESUME UPLOAD API
// ===========================
export const uploadResume = async (files) => {
  const formData = new FormData();
  const userId = getUserId();

  files.forEach((file) => {
    formData.append("files", file);
  });

  // Add user_id to form data if available
  if (userId) {
    formData.append("user_id", userId);
  }

  const response = await fetch(`${BASE_URL}/upload_resume`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  return await response.json();
};

// ===========================
// CHATBOT - Send Message
// ===========================
export const sendChatMessage = async (message, chatId = null, chatHistory = []) => {
  const userId = getUserId();

  console.log("📤 Sending chat request:", {
    query: message,
    user_id: userId,
    chat_id: chatId,
    history_length: chatHistory.length
  });

  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: message,
      user_id: userId,
      chat_id: chatId,
      chat_history: chatHistory.slice(-10).map(msg => ({
        sender: msg.sender,
        text: msg.text
      }))
    }),
  });

  if (!response.ok) {
    throw new Error("Chat request failed");
  }

  return await response.json();
};

// ===========================
// CHAT HISTORY APIs
// ===========================

/**
 * Get all chats for the current user
 */
export const getChatHistory = async () => {
  const userId = getUserId();
  console.log("🔄 Attempting to fetch chat history for userId:", userId);

  if (!userId) {
    console.log("⚠️ No user ID found in localStorage, cannot fetch chat history");
    return { chats: [] };
  }

  try {
    const url = `${BASE_URL}/chat/history/${encodeURIComponent(userId)}`;
    console.log("📡 Fetching from URL:", url);

    const response = await fetch(url);
    if (!response.ok) {
      console.error("❌ Failed to fetch chat history. Status:", response.status);
      throw new Error("Failed to fetch chat history");
    }
    const data = await response.json();
    console.log("✅ Chat History Response:", data);
    console.log("📂 Loaded", data.chats?.length || 0, "chats from backend for user", userId);
    return data;
  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
    return { chats: [] };
  }
};

/**
 * Save a chat to the backend
 */
export const saveChatToBackend = async (chatId, title, messages) => {
  const userId = getUserId();
  if (!userId) {
    console.log("⚠️ No user ID, skipping backend save");
    return { success: false };
  }

  try {
    const response = await fetch(`${BASE_URL}/chat/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        chat_id: chatId,
        title: title,
        messages: messages.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.text,
          chart: msg.chart || null, // Persist chart data
          timestamp: msg.timestamp
        }))
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save chat");
    }

    const data = await response.json();
    console.log("✅ Chat saved to backend:", chatId);
    return data;
  } catch (error) {
    console.error("❌ Error saving chat:", error);
    return { success: false };
  }
};

/**
 * Delete a chat from the backend
 */
export const deleteChatFromBackend = async (chatId) => {
  const userId = getUserId();
  if (!userId) {
    return { success: false };
  }

  try {
    const response = await fetch(
      `${BASE_URL}/chat/${encodeURIComponent(chatId)}?user_id=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      throw new Error("Failed to delete chat");
    }

    const data = await response.json();
    console.log("🗑️ Chat deleted from backend:", chatId);
    return data;
  } catch (error) {
    console.error("❌ Error deleting chat:", error);
    return { success: false };
  }
};

// ===========================
// AUTH APIs
// ===========================
export const signupUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return await response.json();
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return await response.json();
};

export const loginWithGoogle = async (credential) => {
  const response = await fetch(`${BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: credential }),
  });

  return await response.json();
};
