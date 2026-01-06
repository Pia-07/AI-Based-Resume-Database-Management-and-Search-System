import { useState } from "react";

const JDInput = () => {
  const [jd, setJd] = useState("");

  const handleSubmit = () => {
    console.log("JD Submitted:", jd);
    alert("JD submitted (dummy)");
  };

  return (
    <div>
      <h2>Job Description</h2>

      <textarea
        rows="6"
        cols="50"
        placeholder="Paste Job Description here"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
      />

      <br /><br />
      <button onClick={handleSubmit}>Search Candidates</button>
    </div>
  );
};

export default JDInput;
