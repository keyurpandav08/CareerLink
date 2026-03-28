import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, BookOpen, Briefcase, Send, Shield, Star, X } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
const [showSuccess, setShowSuccess] = useState(false);
  const currentYear = new Date().getFullYear();

  const submitFeedback = () => {
    if (!rating) return;

    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      setComment('');
      setRating(0);
      setShowFeedback(false);
    }, 2000);
  };

  return (
    <footer className="footer-shell">
      <div className="container footer-grid">
        <section>
          <div className="footer-brand">
            <span className="footer-brand-icon"><Globe size={15} /></span>
            <h3>JobLithic</h3>
          </div>
          <p className="footer-brand-copy">
            Role-based job platform with practical hiring workflows for students and growing teams.
          </p>
        </section>

        <section className="footer-col">
          <h4>Platform</h4>
          <Link to="/jobs"><Briefcase size={14} />Browse Jobs</Link>
          <Link to="/post-job"><Briefcase size={14} />Post Job</Link>
          <Link to="/pricing"><Briefcase size={14} />Pricing</Link>
        </section>

        <section className="footer-col">
          <h4>Resources</h4>
          <Link to="/resume-builder"><BookOpen size={14} />Resume AI</Link>
          <Link to="/career-advice"><BookOpen size={14} />Career Advice</Link>
          <Link to="/interview-tips"><BookOpen size={14} />Interview Tips</Link>
        </section>

        <section className="footer-col">
          <h4>Legal</h4>
          <Link to="/privacy-policy"><Shield size={14} />Privacy Policy</Link>
          <Link to="/terms"><Shield size={14} />Terms of Use</Link>
          <button type="button" className="feedback-trigger" onClick={() => setShowFeedback(true)}>
            Share Feedback
          </button>
        </section>
      </div>

      <div className="footer-bottom">© {currentYear} JobLithic. All rights reserved.</div>

      {showFeedback && (
        <div className="feedback-backdrop">
          <div className="feedback-dialog">
            <button className="close-feedback" type="button" onClick={() => setShowFeedback(false)}>
              <X size={16} />
            </button>

            <h3>Rate your experience</h3>
            <p>Quick feedback helps us improve the next release.</p>

            <div className="rating-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={25}
                  className="rate-star"
                  onClick={() => setRating(star)}
                  fill={star <= rating ? '#f59e0b' : 'none'}
                  color={star <= rating ? '#f59e0b' : '#cbd5e1'}
                />
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="What should we improve?"
            />

            <button type="button" className="feedback-send" onClick={submitFeedback}>
              <Send size={14} />
              Send Feedback
            </button>
            {showSuccess && (
              <div className="success-overlay">
                <div className="success-box">
                  <div className="tick">✔</div>
                  <h3>Feedback Submitted Successfully!</h3>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
