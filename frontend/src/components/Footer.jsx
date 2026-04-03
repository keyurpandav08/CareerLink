import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Briefcase,
  Globe,
  Send,
  Shield,
  Star,
  X
} from 'lucide-react';
import { useAuthModal } from '../context/AuthModalContext';
import './Footer.css';

const Footer = () => {
  const { openAuthModal } = useAuthModal();
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
      <div className="container">
        <div className="footer-hero">
          <div className="footer-hero-copy">
            <span className="footer-kicker">CareerLink</span>
            <h2>Build your next move with a calmer hiring flow.</h2>
            <p>Explore verified roles, polish your profile, and keep your job search inside one elegant workspace.</p>
          </div>

          <div className="footer-hero-actions">
            <button type="button" className="footer-hero-primary" onClick={() => openAuthModal('register')}>
              Join Now
            </button>
            <Link to="/jobs" className="footer-hero-secondary">Browse Jobs</Link>
          </div>
        </div>

        <div className="footer-grid">
          <section>
            <div className="footer-brand">
              <span className="footer-brand-icon"><Globe size={16} /></span>
              <div>
                <h3>CareerLink</h3>
                <p>Soft visuals, sharper workflows, and a hiring journey that feels easier to trust.</p>
              </div>
            </div>
          </section>

          <section className="footer-col">
            <h4>Explore</h4>
            <Link to="/jobs"><Briefcase size={14} />Browse Jobs</Link>
            <Link to="/pricing"><Briefcase size={14} />Pricing</Link>
            <Link to="/contact"><Briefcase size={14} />Contact</Link>
          </section>

          <section className="footer-col">
            <h4>Candidate Tools</h4>
            <Link to="/resume-builder"><BookOpen size={14} />Resume AI</Link>
            <Link to="/career-advice"><BookOpen size={14} />Career Advice</Link>
            <Link to="/interview-tips"><BookOpen size={14} />Interview Tips</Link>
          </section>

          <section className="footer-col">
            <h4>Trust</h4>
            <Link to="/privacy-policy"><Shield size={14} />Privacy Policy</Link>
            <Link to="/terms"><Shield size={14} />Terms of Use</Link>
            <button type="button" className="feedback-trigger" onClick={() => setShowFeedback(true)}>
              Leave a Review
            </button>
          </section>
        </div>

        <div className="footer-bottom">
          <span>{`Copyright ${currentYear} CareerLink`}</span>
          <div className="footer-bottom-links">
            <Link to="/privacy-policy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Support</Link>
            <button type="button" className="footer-bottom-auth" onClick={() => openAuthModal('login')}>
              Log in
            </button>
          </div>
        </div>
      </div>

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
                  <div className="tick">OK</div>
                  <h3>Feedback submitted successfully.</h3>
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
