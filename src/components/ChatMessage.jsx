<<<<<<< HEAD
const ChatMessage = ({ sender, text }) => {
  const align = sender === "hr" ? "flex-end" : "flex-start";
  const bg = sender === "hr" ? "#2563EB" : "#E5E7EB";
  const color = sender === "hr" ? "white" : "black";

  return (
    <div style={{ display: "flex", justifyContent: align, margin: "10px 0" }}>
      <div style={{
        background: bg,
        color,
        padding: "10px 14px",
        borderRadius: "10px",
        maxWidth: "70%"
      }}>
        {text}
      </div>
    </div>
  );
};

export default ChatMessage;
=======
const ChatMessage = ({ sender, text }) => {
  const align = sender === "hr" ? "flex-end" : "flex-start";
  const bg = sender === "hr" ? "#2563EB" : "#E5E7EB";
  const color = sender === "hr" ? "white" : "black";

  return (
    <div style={{ display: "flex", justifyContent: align, margin: "10px 0" }}>
      <div style={{
        background: bg,
        color,
        padding: "10px 14px",
        borderRadius: "10px",
        maxWidth: "70%"
      }}>
        {text}
      </div>
    </div>
  );
};

export default ChatMessage;
>>>>>>> cffba6ef64ed296d8c4df653b6d3296f72cfa3da
