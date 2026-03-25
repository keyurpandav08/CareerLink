import { CheckCircle } from "lucide-react";
import "./Pricing.css";

const Pricing = () => {
  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h1>Pricing Plans</h1>
        <p>Flexible hiring solutions designed for businesses of all sizes.</p>
      </div>

      <div className="pricing-grid">

        {/* BASIC */}
        <div className="pricing-card">
          <h3>Basic</h3>
          <h2>₹0</h2>
          <span className="pricing-duration">7 Days</span>

          <ul>
            <li><CheckCircle size={16}/> 1 Job Post</li>
            <li><CheckCircle size={16}/> Limited Candidate View</li>
            <li><CheckCircle size={16}/> Basic Support</li>
          </ul>

          <button className="pricing-btn">Get Started</button>
        </div>

        {/* STANDARD */}
        <div className="pricing-card popular">
          <div className="badge">Most Popular</div>
          <h3>Standard</h3>
          <h2>₹2,999</h2>
          <span className="pricing-duration">30 Days</span>

          <ul>
            <li><CheckCircle size={16}/> 5 Job Posts</li>
            <li><CheckCircle size={16}/> Talent Search Access</li>
            <li><CheckCircle size={16}/> Candidate Shortlisting</li>
            <li><CheckCircle size={16}/> Priority Support</li>
          </ul>

          <button className="pricing-btn">Choose Plan</button>
        </div>

        {/* PREMIUM */}
        <div className="pricing-card">
          <h3>Premium</h3>
          <h2>₹7,999</h2>
          <span className="pricing-duration">90 Days</span>

          <ul>
            <li><CheckCircle size={16}/> Unlimited Job Posts</li>
            <li><CheckCircle size={16}/> Full Database Access</li>
            <li><CheckCircle size={16}/> Featured Listings</li>
            <li><CheckCircle size={16}/> Dedicated Account Manager</li>
          </ul>

          <button className="pricing-btn">Go Premium</button>
        </div>
        <div className="postjob-bottom">
                  <div className="postjob-divider"></div>

                  <p className="postjob-note">
                    Choose a plan that fits your hiring needs and scale confidently.
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

export default Pricing;