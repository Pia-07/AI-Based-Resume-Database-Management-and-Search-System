// Use VITE_API_BASE_URL from environment (set in Vercel/production).
// In development/fallback, it uses the permanent Render backend.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://smarthire-backend-kpe4.onrender.com";

// ===========================
// BACKEND WARM-UP (Render free tier cold start)
// ===========================
// Silently ping the backend to wake it from sleep.
// Call this early (on Landing/Login page load) so the server
// is ready by the time the user clicks Login or Sign Up.
// Retries up to 3 times with 5s intervals to cover the cold-start window.
let _warmUpStarted = false;
export const warmUpBackend = () => {
  if (_warmUpStarted) return; // Only ping once per session
  _warmUpStarted = true;
  console.log("🔥 Warming up backend...");

  const ping = (attempt) => {
    fetch(BASE_URL + "/", { method: "GET", mode: "cors" })
      .then((res) => {
        if (res.ok) {
          console.log("✅ Backend is awake");
        } else if (attempt < 3) {
          console.log(`⏳ Backend returned ${res.status}, retrying in 5s (attempt ${attempt}/3)...`);
          setTimeout(() => ping(attempt + 1), 5000);
        }
      })
      .catch(() => {
        if (attempt < 3) {
          console.log(`⏳ Backend still waking up, retrying in 5s (attempt ${attempt}/3)...`);
          setTimeout(() => ping(attempt + 1), 5000);
        } else {
          console.log("⚠️ Backend warm-up failed after 3 attempts");
        }
      });
  };
  ping(1);
};

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
// HELPER: Fetch with timeout + retry
// ===========================
const CHAT_TIMEOUT_MS = 60000; // 60 seconds (covers Render cold start + Gemini response)
const MAX_RETRIES = 2;

async function fetchWithRetry(url, options, { timeoutMs = CHAT_TIMEOUT_MS, retries = MAX_RETRIES } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Retry on 503 (service unavailable — Render cold start) or 502 (bad gateway)
      if ((response.status === 503 || response.status === 502) && attempt < retries) {
        console.log(`⏳ Backend returned ${response.status}, retrying in ${(attempt + 1) * 3}s...`);
        await new Promise((r) => setTimeout(r, (attempt + 1) * 3000));
        continue;
      }

      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;

      if (err.name === "AbortError") {
        if (attempt < retries) {
          console.log(`⏱️ Request timed out, retrying (attempt ${attempt + 2}/${retries + 1})...`);
          continue;
        }
        throw new Error(
          "The request timed out. The backend may still be starting up — please wait a moment and try again."
        );
      }

      // Network errors — retry with backoff
      if (attempt < retries) {
        console.log(`🔄 Network error, retrying in ${(attempt + 1) * 3}s...`);
        await new Promise((r) => setTimeout(r, (attempt + 1) * 3000));
        continue;
      }
    }
  }

  throw lastError || new Error("Request failed after retries");
}

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

  const response = await fetchWithRetry(`${BASE_URL}/chat`, {
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
    const errText = await response.text().catch(() => "Unknown error");
    throw new Error(`Chat request failed (${response.status}): ${errText}`);
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
