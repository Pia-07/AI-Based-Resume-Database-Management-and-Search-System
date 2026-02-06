# SmartHire - Setup & Login Guide

## ✅ Backend Status

**Backend Server**: Running on `http://127.0.0.1:8000`

**Test Account Created**:

- **Email**: `demo@smarthire.com`
- **Password**: `Demo1234`

---

## 🚀 Quick Start

### 1. **Ensure Backend is Running**

The backend must be running on port 8000 for login/signup to work.

Check if it's running:

```bash
lsof -i :8000
```

If not running, start it:

```bash
cd Backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

### 2. **Start Frontend Dev Server**

```bash
npm run dev
```

The app will open on `http://localhost:5173` (or next available port)

### 3. **Login or Sign Up**

**Option A: Login with Test Account**

1. Go to http://localhost:5173/login
2. Enter:
   - **Email**: `demo@smarthire.com`
   - **Password**: `Demo1234`
3. Click "Sign In"

**Option B: Create New Account**

1. Go to http://localhost:5173/signup
2. Fill in form with:
   - **Email**: Any valid email (e.g., `your.name@example.com`)
   - **Password**: At least 8 characters with uppercase, lowercase, and number
   - **Confirm Password**: Must match
3. Click "Create Account"

### 4. **Access Chatbot**

After login, you'll be redirected to `/chatbot` where you can:

- Start new conversations
- View chat history in sidebar
- Delete previous chats
- Ask questions about resumes (if any are uploaded)

---

## 🔍 Troubleshooting

### **Issue: "Login Failed" or Can't Connect**

**Solution**:

1. Check backend is running: `lsof -i :8000`
2. Verify it's on correct port (8000)
3. Check frontend is calling correct URL: `http://127.0.0.1:8000`
4. Check browser console (F12) for detailed error messages

### **Issue: "LLM/Gemini not available"**

**Symptoms**: Server raises `ModuleNotFoundError: No module named 'google.generativeai'` or chat endpoints return "LLM service unavailable" messages.

**Solution**:

- Install the Gemini client in the backend virtual environment:
  ```bash
  # Activate your venv, then
  pip install google-generative-ai
  ```
- Add `google-generative-ai` to `Backend/requirements.txt` (already added) and/or the top-level `requirements.txt`, then run:
  ```bash
  pip install -r Backend/requirements.txt
  # or
  pip install -r requirements.txt
  ```
- Create or update a `.env` in `Backend/` with your key:
  ```ini
  GEMINI_API_KEY=your_api_key_here
  ```
- Restart the backend server after installing and setting the env var.

If you still see errors, check the server logs for messages like "⚠️ 'google-generative-ai' package not installed" or "❌ Gemini API error" which indicate missing package or invalid API key.

### **Issue: "Invalid Credentials"**

**Solutions**:

- Make sure email/password are correct
- Try the test account: `demo@smarthire.com` / `Demo1234`
- Create a new account if you forgot password

### **Issue: Port 8000 Already in Use**

**Solution**:

```bash
# Kill the process using port 8000
lsof -ti:8000 | xargs kill -9

# Or start backend on different port
python -m uvicorn app.main:app --reload --port 8001
# Then update src/services/api.js BASE_URL to http://127.0.0.1:8001
```

---

## 📋 API Endpoints

### Authentication

- **POST** `/auth/signup` - Create new account

  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }
  ```

  Response: `{ "message": "Signup successful" }`

- **POST** `/auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }
  ```
  Response: `{ "message": "Login successful", "user_id": "uuid" }`

### Chat

- **POST** `/chat` - Send message to AI
  ```json
  {
    "query": "Show me all candidates"
  }
  ```

---

## 🎨 UI Features

- ✅ Modern, clean design
- ✅ Dark mode support (system preference)
- ✅ Chat sidebar with history
- ✅ Real-time message loading animations
- ✅ Markdown support in messages
- ✅ Responsive mobile design
- ✅ Loading spinners and feedback

---

## 📁 Project Structure

```
├── Backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── auth_routes.py ⭐ Login/Signup
│   │   │   ├── chat_routes.py
│   │   │   └── resume_routes.py
│   │   ├── services/
│   │   ├── utils/
│   │   └── models/
│   └── requirements.txt
│
├── src/
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx ⭐ Improved error handling
│   │   ├── Signup.jsx ⭐ Improved error handling
│   │   ├── Chatbot.jsx
│   │   └── ...
│   ├── components/
│   │   ├── ChatSidebar.jsx ⭐ NEW
│   │   ├── ChatMessage.jsx ⭐ Redesigned
│   │   ├── ChatInputBar.jsx ⭐ NEW
│   │   ├── Navbar.jsx
│   │   └── ...
│   ├── services/
│   │   └── api.js
│   ├── index.css ⭐ Complete redesign
│   └── App.jsx
```

---

## ✨ Recent Improvements

### UI/UX Enhancements

- ✅ Premium design system with color tokens
- ✅ Smooth animations and transitions
- ✅ Dark mode support
- ✅ Responsive mobile layout
- ✅ Better error messages
- ✅ Loading states with spinners
- ✅ Markdown support in chat

### Login/Signup Improvements

- ✅ Split-panel design (branding + form)
- ✅ Icon-prefixed input fields
- ✅ Real-time validation feedback
- ✅ Password strength indicator (signup)
- ✅ Show/hide password toggle
- ✅ Remember me checkbox
- ✅ Better error handling and messages

### Chat Improvements

- ✅ ChatGPT-like sidebar with history
- ✅ Auto-generated chat titles
- ✅ Delete chat functionality
- ✅ Message persistence
- ✅ Premium bubble styling
- ✅ Auto-expanding textarea
- ✅ Keyboard shortcuts (Enter to send, Shift+Enter for new line)

---

## 🔐 Security Notes

- Passwords are hashed before storage
- Use HTTPS in production (not HTTP)
- Consider adding JWT tokens for session management
- Implement CORS policies for production

---

## 📞 Support

For issues or questions:

1. Check browser console (F12) for error details
2. Check backend logs for server errors
3. Verify backend is running on correct port
4. Create a test account and try login

---

**Last Updated**: February 2026
**Version**: 1.0.0 ✅
