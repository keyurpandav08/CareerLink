import { FileText, ClipboardList, Users, Send, CheckCircle } from "lucide-react";
import "./PostJob.css";

const PostJob = () => {
  return (
    <div className="postjob-container">
      <div className="postjob-card">

        <div className="postjob-header">
          <FileText size={34} />
          <h1>How to Post a Job</h1>
          <p>Follow these steps to publish job openings and attract the right talent.</p>
        </div>

        <div className="postjob-steps">

          <div className="postjob-item">
            <ClipboardList size={22} />
            <div>
              <h3>1. Create Employer Account</h3>
              <p>Register your company profile with accurate business details and verification documents.</p>
            </div>
          </div>

          <div className="postjob-item">
            <FileText size={22} />
            <div>
              <h3>2. Fill Job Details</h3>
              <p>Provide job title, description, required skills, experience level, salary range, and location.</p>
            </div>
          </div>

          <div className="postjob-item">
            <Users size={22} />
            <div>
              <h3>3. Set Hiring Preferences</h3>
              <p>Select candidate criteria like education, availability, and specific technical requirements.</p>
            </div>
          </div>

          <div className="postjob-item">
            <Send size={22} />
            <div>
              <h3>4. Publish the Job</h3>
              <p>Review the listing and publish it. Your job will appear in candidate search results.</p>
            </div>
          </div>

          <div className="postjob-item">
            <CheckCircle size={22} />
            <div>
              <h3>5. Manage Applications</h3>
              <p>Track applicants, shortlist profiles, and contact candidates directly from dashboard.</p>
            </div>
          </div>

        </div>

        <div className="postjob-bottom">
          <div className="postjob-divider"></div>

          <p className="postjob-note">
            A detailed and clear job description increases quality applications.
          </p>

          <button
            className="postjob-back-btn"
            onClick={() => window.history.back()}
          >
            ← Go Back
          </button>
        </div>

      </div>
    </div>
  );
};

export default PostJob;