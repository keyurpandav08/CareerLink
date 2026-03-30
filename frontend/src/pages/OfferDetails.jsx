import { useLocation, useNavigate } from "react-router-dom";
import "./OfferDetails.css";

const OfferDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.application;

  if (!data) return <p>No offer found</p>;

  return (
    <div className="offer-wrapper">
      <div className="offer-card">

        {/* 🎉 Title */}
        <h1 className="offer-title animate-pop">
          🎉 You Are Selected!
        </h1>

        {/* Candidate */}
        <p className="offer-text">
          Dear <strong>{data.candidateName}</strong>,
        </p>

        {/* Message */}
        <p className="offer-text">
          We are pleased to inform you that you have been selected for the position of{" "}
          <strong>{data.jobTitle}</strong>.
        </p>

        {/* Center Highlight Box */}
        <div className="offer-highlight animate-fade">
          <h2>Welcome to the Team 🚀</h2>
          <p>We’re excited to have you onboard.</p>
        </div>

        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

      </div>
    </div>
  );
};

export default OfferDetails;