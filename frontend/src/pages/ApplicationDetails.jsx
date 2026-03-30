import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "./ApplicationDetails.css";

const ApplicationDetails = () => {
  const location = useLocation();
  const data = location.state?.application;
const navigate = useNavigate();
  if (!data) return <p>No data found</p>;

  // progress logic
  const getProgress = () => {
    if (data.status === "PENDING") return 30;
    if (data.status === "REVIEWED") return 60;
    if (data.status === "ACCEPTED") return 100;
    if (data.status === "REJECTED") return 100;
  };

  return (
    <div className="details-container">
      <div className="details-card">
        <h2>{data.jobTitle}</h2>

        <div className={`status-badge ${data.status.toLowerCase()}`}>
          {data.status}
        </div>

        <p>Applied: {data.appliedAt}</p>

        {/* Progress bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${getProgress()}%` }}
          ></div>
        </div>

        {/* Timeline */}
        <div className="timeline">
          <h3>Progress</h3>

          <div className="timeline-item done">
            <span className="icon">✔</span>
            <span>Applied</span>
          </div>

          {data.status === "REVIEWED" && (
            <div className="timeline-item active">
              <span className="icon">⏳</span>
              <span>Under Review</span>
            </div>
          )}

          {data.status === "ACCEPTED" && (
            <div className="timeline-item done">
              <span className="icon">🎉</span>
              <span>Accepted</span>
            </div>
          )}

          {data.status === "REJECTED" && (
            <div className="timeline-item rejected">
              <span className="icon">✖</span>
              <span>Rejected</span>
            </div>
          )}
        </div>
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Go Back
        </button>
      </div>
    </div>
  );
};

export default ApplicationDetails;