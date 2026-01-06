import { useState } from "react";

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleUpload = () => {
    if (!file) {
      setStatus("Please select a PDF file");
      return;
    }
    setStatus("Uploading...");
    setTimeout(() => {
      setStatus("Resume uploaded successfully");
    }, 1500);
  };

  return (
    <div>
      <h2>Upload Resume</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />
      <button onClick={handleUpload}>Upload</button>

      <p>{status}</p>
    </div>
  );
};

export default ResumeUpload;
