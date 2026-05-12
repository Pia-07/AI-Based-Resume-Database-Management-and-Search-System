// Use VITE_API_URL from environment (set in .env or Vercel/production).
// In development/fallback, it uses the local backend.
const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ===========================
// BACKEND WARM-UP (Render free tier cold start)
// ===========================
let _warmUpStarted = false;
export const warmUpBackend = () => {
  if (_warmUpStarted) return;
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
  const userId = localStorage.getItem("userId");
  if (userId) return userId;

  const user = localStorage.getItem("user");
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.user_id || parsed.email || null;
    } catch {
      return null;
    }
  }

  const email = localStorage.getItem("userEmail");
  if (email) return email;

  return null;
};

// ===========================
// AUTHENTICATION APIs
// ===========================

export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Login failed");
  }

  const data = await response.json();
  if (data.user_id) {
    localStorage.setItem("userId", data.user_id);
    localStorage.setItem("userEmail", data.email);
  }
  return data;
};

export const signupUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Signup failed");
  }

  const data = await response.json();
  if (data.user_id) {
    localStorage.setItem("userId", data.user_id);
    localStorage.setItem("userEmail", data.email);
  }
  return data;
};

export const googleLogin = async (token) => {
  const response = await fetch(`${BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Google login failed");
  }

  const data = await response.json();
  if (data.user_id) {
    localStorage.setItem("userId", data.user_id);
    localStorage.setItem("userEmail", data.email);
  }
  return data;
};

// Alias used by Login.jsx and Signup.jsx
export const loginWithGoogle = googleLogin;

// ===========================
// RESUME UPLOAD API
// ===========================
export const uploadResume = async (files) => {
  const formData = new FormData();
  const userId = getUserId();

  files.forEach((file) => {
    formData.append("files", file);
  });

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
const CHAT_TIMEOUT_MS = 60000;
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
        throw new Error("The request timed out. The backend may still be starting up — please wait a moment and try again.");
      }

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

  const response = await fetchWithRetry(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export const getChatHistory = async () => {
  const userId = getUserId();
  if (!userId) return { chats: [] };

  try {
    const url = `${BASE_URL}/chat/history/${encodeURIComponent(userId)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch chat history");
    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
    return { chats: [] };
  }
};

export const saveChatToBackend = async (chatId, title, messages) => {
  const userId = getUserId();
  if (!userId) return { success: false };

  try {
    const response = await fetch(`${BASE_URL}/chat/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        chat_id: chatId,
        title: title,
        messages: messages.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.text,
          chart: msg.chart || null,
          timestamp: msg.timestamp
        }))
      }),
    });

    if (!response.ok) throw new Error("Failed to save chat");
    const data = await response.json();
    console.log("✅ Chat saved to backend:", chatId);
    return data;
  } catch (error) {
    console.error("❌ Error saving chat:", error);
    return { success: false };
  }
};

export const deleteChatFromBackend = async (chatId) => {
  const userId = getUserId();
  if (!userId) return { success: false };

  try {
    const response = await fetch(
      `${BASE_URL}/chat/${encodeURIComponent(chatId)}?user_id=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    );

    if (!response.ok) throw new Error("Failed to delete chat");
    const data = await response.json();
    console.log("🗑️ Chat deleted from backend:", chatId);
    return data;
  } catch (error) {
    console.error("❌ Error deleting chat:", error);
    return { success: false };
  }
};

// ===========================
// QUIZ APIs — Skill Verification System
// ===========================

export const generateQuiz = async (candidateName, candidateEmail, skills, timeLimitMinutes = 20) => {
  const userId = getUserId();
  const response = await fetchWithRetry(`${BASE_URL}/quiz/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      skills: skills,
      user_id: userId || "anonymous",
      time_limit_minutes: timeLimitMinutes,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    throw new Error(`Quiz generation failed (${response.status}): ${errText}`);
  }

  return await response.json();
};

export const sendQuizEmail = async (quizId, candidateName, candidateEmail, quizLink, timeLimitMinutes = 20) => {
  const response = await fetch(`${BASE_URL}/quiz/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quiz_id: quizId,
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      quiz_link: quizLink,
      time_limit_minutes: timeLimitMinutes,
    }),
  });

  return await response.json();
};

export const getQuiz = async (quizId) => {
  const response = await fetch(`${BASE_URL}/quiz/${encodeURIComponent(quizId)}`);
  if (!response.ok) throw new Error("Failed to fetch quiz");
  return await response.json();
};

export const submitQuiz = async (quizId, answers) => {
  const response = await fetch(`${BASE_URL}/quiz/${encodeURIComponent(quizId)}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    throw new Error(`Quiz submission failed (${response.status}): ${errText}`);
  }

  return await response.json();
};

export const getQuizResults = async () => {
  const response = await fetch(`${BASE_URL}/quiz/results`);
  if (!response.ok) throw new Error("Failed to fetch quiz results");
  return await response.json();
};

export const sendAllQuizEmails = async () => {
  const response = await fetch(`${BASE_URL}/quiz/send-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to send quiz emails");
  return await response.json();
};

// ===========================
// STUDENTS DASHBOARD API
// ===========================
export const fetchStudents = async (params = {}) => {
  const queryParts = [];
  if (params.location) queryParts.push(`location=${encodeURIComponent(params.location)}`);
  if (params.experience_min !== undefined) queryParts.push(`experience_min=${params.experience_min}`);
  if (params.experience_max !== undefined) queryParts.push(`experience_max=${params.experience_max}`);
  if (params.certifications && params.certifications.length > 0) {
    queryParts.push(`certification=${encodeURIComponent(params.certifications.join(","))}`);
  }
  if (params.sort) queryParts.push(`sort=${encodeURIComponent(params.sort)}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const response = await fetch(`${BASE_URL}/students${queryString}`);
  if (!response.ok) throw new Error("Failed to fetch students");
  return await response.json();
};
