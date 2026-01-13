// This file defines the shape of data expected from backend APIs

export const ResumeUploadResponse = {
  message: "",
  resume_id: ""
};

export const Candidate = {
  name: "",
  score: 0,
  justification: ""
};

export const JDSubmitResponse = {
  job_id: "",
  top_candidates: [] // array of Candidate objects
};
