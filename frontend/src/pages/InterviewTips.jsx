import { MessageSquare, Clock, Brain, Briefcase, ShieldCheck } from "lucide-react";
import "./InterviewTips.css";

const InterviewTips = () => {
  return (
    <div className="interview-container">
      <div className="interview-card">

        <div className="interview-header">
          <MessageSquare size={32} />
          <h1>Interview Preparation Guide</h1>
          <p>Master your interviews with practical and professional strategies.</p>
        </div>

        <div className="interview-list">

          <div className="interview-item">
            <Brain size={22} />
            <div>
              <h3>1. Research the Company Thoroughly</h3>
              <p>Understand the company’s mission, products, competitors, and recent news. Interviewers expect preparation.</p>
            </div>
          </div>

          <div className="interview-item">
            <Briefcase size={22} />
            <div>
              <h3>2. Prepare for Role-Specific Questions</h3>
              <p>Study common technical and behavioral questions related to the job position.</p>
            </div>
          </div>

          <div className="interview-item">
            <Clock size={22} />
            <div>
              <h3>3. Practice Time Management</h3>
              <p>Arrive early. Keep answers structured and concise using the STAR method.</p>
            </div>
          </div>

          <div className="interview-item">
            <ShieldCheck size={22} />
            <div>
              <h3>4. Demonstrate Confidence & Professionalism</h3>
              <p>Maintain eye contact, clear communication, and positive body language.</p>
            </div>
          </div>

          <div className="interview-item">
            <MessageSquare size={22} />
            <div>
              <h3>5. Ask Smart Questions</h3>
              <p>Ask about team structure, growth opportunities, and performance expectations.</p>
            </div>
          </div>

        </div>

        <div className="interview-bottom">
          <div className="interview-divider"></div>

          <p className="interview-note">
            Proper preparation increases your hiring chances significantly.
          </p>

          <button
            className="interview-back-btn"
            onClick={() => window.history.back()}
          >
            ← Go Back
          </button>
        </div>

      </div>
    </div>
  );
};

export default InterviewTips;