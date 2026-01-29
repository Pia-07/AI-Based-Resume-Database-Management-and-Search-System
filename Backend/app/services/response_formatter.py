def chatgpt_style_reply(title: str, content: str):
    return f"""
🤖 **Here’s what I found based on the resumes:**

### {title}
{content}

---

### 📌 Key Notes
- Data is extracted from uploaded resumes
- Information is normalized & deduplicated
- Response is context‑aware
- Analytics are computed dynamically
- Results scale with more resumes

❓ **Would you like a chart 📊, table 📋, or deeper analysis?**
"""
def list_to_bullets(answer: str):
    items = answer.split(",")
    return "\n".join(f"- {i.strip()}" for i in items if i.strip())
