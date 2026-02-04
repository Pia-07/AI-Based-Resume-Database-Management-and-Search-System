import { useState, useRef } from "react";
import { uploadResume } from "../services/api";

/**
 * ResumeUpload Component
 * Can be used in two modes:
 * 1. Standalone page (full UI)
 * 2. Via modal trigger from sidebar/navbar
 */
const ResumeUpload = ({ isModal = false, onClose = null, onSuccess = null }) => {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    setFiles([...e.target.files]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setStatus("❌ Please select at least one PDF");
      return;
    }

    try {
      setIsUploading(true);
      setStatus("⏳ Uploading...");
      const res = await uploadResume(files);
      setStatus(`✅ ${res.resumes.length} resumes uploaded successfully`);
      setFiles([]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(res);
      }
      
      // Close modal after 2 seconds if in modal mode
      if (isModal && onClose) {
        setTimeout(() => onClose(), 2000);
      }
    } catch (err) {
      setStatus("❌ Upload failed: " + err.message);
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isUploading && files.length > 0) {
      handleUpload();
    }
  };

  if (isModal) {
    // Modal version for sidebar
    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>Upload Resumes</h3>
            <button
              style={styles.closeBtn}
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>

          <div style={styles.modalBody}>
            <div style={styles.uploadArea}>
              <span style={styles.uploadAreaIcon}>📄</span>
              <p style={styles.uploadAreaText}>Select PDF files to upload</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
                style={styles.fileInput}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={styles.selectFilesBtn}
              >
                Choose Files
              </button>
            </div>

            {files.length > 0 && (
              <div style={styles.filesList}>
                <p style={styles.filesLabel}>{files.length} file(s) selected:</p>
                {Array.from(files).map((file, idx) => (
                  <div key={idx} style={styles.fileItem}>
                    <span>📑</span>
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}

            {status && (
              <div style={styles.status}>
                {status}
              </div>
            )}

            <div style={styles.modalFooter}>
              <button
                onClick={onClose}
                style={styles.cancelBtn}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
                style={{
                  ...styles.uploadBtn,
                  opacity: files.length === 0 || isUploading ? 0.6 : 1,
                }}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standalone page version
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Upload Resumes</h2>

      <div style={styles.uploadArea}>
        <span style={styles.uploadAreaIcon}>📄</span>
        <p style={styles.uploadAreaText}>Select PDF files to upload</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileSelect}
          style={styles.fileInput}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={styles.selectFilesBtn}
        >
          Choose Files
        </button>
      </div>

      {files.length > 0 && (
        <div style={styles.filesList}>
          <p style={styles.filesLabel}>{files.length} file(s) selected:</p>
          {Array.from(files).map((file, idx) => (
            <div key={idx} style={styles.fileItem}>
              <span>📑</span>
              <span>{file.name}</span>
            </div>
          ))}
        </div>
      )}

      {status && (
        <div style={styles.status}>
          {status}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={files.length === 0 || isUploading}
        style={{
          ...styles.uploadBtn,
          opacity: files.length === 0 || isUploading ? 0.6 : 1,
        }}
        onKeyDown={handleKeyDown}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "600px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "20px",
    color: "var(--text-primary)",
  },
  uploadArea: {
    border: "2px dashed var(--primary)",
    borderRadius: "12px",
    padding: "40px 20px",
    textAlign: "center",
    background: "rgba(99, 102, 241, 0.05)",
    marginBottom: "20px",
  },
  uploadAreaIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "12px",
  },
  uploadAreaText: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "16px",
  },
  fileInput: {
    display: "none",
  },
  selectFilesBtn: {
    padding: "10px 24px",
    background: "var(--primary)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 150ms ease",
  },
  filesList: {
    marginBottom: "20px",
  },
  filesLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    marginBottom: "8px",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "var(--bg-secondary)",
    borderRadius: "8px",
    marginBottom: "4px",
    fontSize: "13px",
  },
  uploadBtn: {
    width: "100%",
    padding: "12px",
    background: "var(--primary)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 150ms ease",
  },
  status: {
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "13px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "var(--bg-primary)",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    maxHeight: "90vh",
    overflow: "auto",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
    color: "var(--text-primary)",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "var(--text-secondary)",
    padding: "0",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: "24px",
  },
  modalFooter: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  cancelBtn: {
    padding: "10px 20px",
    background: "var(--bg-secondary)",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 150ms ease",
  },
};

export default ResumeUpload;
