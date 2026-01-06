import { useState } from "react";
import ResumeUpload from "./components/ResumeUpload";
import JDInput from "./components/JDInput";
import Results from "./components/Results";
import Explanation from "./components/Explanation";
import "./App.css";


function App() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const mockCandidates = [
    {
      name: "Ankit Sharma",
      score: 87,
      justification: "Strong Python, ML projects, and fresher-friendly profile"
    },
    {
      name: "Riya Patel",
      score: 82,
      justification: "Good academic background with relevant internships"
    }
  ];

  return (
    <div>
      <h1>SmartHire</h1>

      {!selectedCandidate ? (
        <>
          <ResumeUpload />
          <hr />
          <JDInput />
          <hr />
          <Results
            candidates={mockCandidates}
            onSelect={setSelectedCandidate}
          />
        </>
      ) : (
        <Explanation
          candidate={selectedCandidate}
          onBack={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}

export default App;
