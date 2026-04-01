import { useLocation, useNavigate } from "react-router-dom";
import "./OfferDetails.css";
import html2pdf from "html2pdf.js";
const OfferDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.application;

    const downloadPDF = () => {
      const element = document.querySelector(".pdf-content");

      // 👇 ADD TEMP CLASS
      element.classList.add("pdf-mode");

      const opt = {
        margin: 10,
        filename: "Offer_Letter.pdf",

        image: { type: "jpeg", quality: 1 },

        html2canvas: {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff"
        },

        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait"
        }
      };

      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          // 👇 REMOVE AFTER DOWNLOAD
          element.classList.remove("pdf-mode");
        });
    };
  if (!data) return <p>No offer found</p>;

  return (
    <div className="offer-wrapper">
      <div className="offer-card">
     <div className="pdf-content">
        {/* Header */}
        <div className="header">
             <div className="header-left">


          <div>
            <h2>Offer Letter</h2>
            <p className="company">{data.companyName}</p>
          </div>
          </div>
          <span className="date">{new Date().toLocaleDateString()}</span>
        </div>

        {/* Body */}
        <div className="content">
          <p>Dear <strong>{data.candidateName}</strong>,</p>

          <p>
            We are pleased to offer you the position of{" "}
            <span className="highlight">{data.jobTitle}</span>.
          </p>

          <p>
            Your skills and experience will be an asset to our organization, and we
            are confident in your ability to contribute effectively to our team.
          </p>

          <p>
            Please confirm your acceptance of this offer. We look forward to working
            with you.
          </p>

          <div className="signature">
            <p>Sincerely,</p>
            <strong>HR Department</strong>
          </div>
        </div>
        </div>
        {/* Footer */}
        <div className="footer">
          <button onClick={downloadPDF} className="btn primary">
            ⬇ Download PDF
          </button>

          <button onClick={() => navigate(-1)} className="btn secondary">
            ← Back
          </button>
        </div>


      </div>
    </div>
  );
};

export default OfferDetails;