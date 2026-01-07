const ResumeCard = ({ name, score, location, distance }) => {
  return (
    <div className="card" style={{ marginBottom: "12px" }}>
      <h3>{name}</h3>
      <p>Match Score: <b>{score}%</b></p>
      <p>Location: {location} ({distance} km)</p>
      <button>View Resume</button>
    </div>
  );
};

export default ResumeCard;
