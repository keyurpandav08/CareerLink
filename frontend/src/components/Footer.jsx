import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Briefcase,
  Mail,
  Send,
  Shield,
  Star,
  Users,
  X
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { getPublicConfig } from '../services/publicConfig';
import { submitPublicReview } from '../services/publicInteractions';
import './Footer.css';

const Footer = () => {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [showFeedback, setShowFeedback] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [companyName, setCompanyName] = useState('CareerLink');
  const [officialEmail, setOfficialEmail] = useState('support@careerlink.com');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getPublicConfig();
        setCompanyName(config.companyName || 'CareerLink');
        setOfficialEmail(config.officialEmail || 'support@careerlink.com');
      } catch {
        setCompanyName('CareerLink');
        setOfficialEmail('support@careerlink.com');
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    if (showFeedback) {
      setReviewerName(user?.fullName || user?.username || '');
      setReviewerEmail(user?.email || '');
      setFeedbackMessage('');
      setFeedbackError('');
    }
  }, [showFeedback, user]);

  const footerLinks = useMemo(() => [
    {
      title: 'Explore',
      links: [
        { to: '/jobs', label: 'Browse Jobs', icon: Briefcase },
        { to: '/career-advice', label: 'Career Advice', icon: BookOpen },
        { to: '/interview-tips', label: 'Interview Tips', icon: BookOpen }
      ]
    },
    {
      title: 'Trust',
      links: [
        { to: '/privacy-policy', label: 'Privacy Policy', icon: Shield },
        { to: '/terms', label: 'Terms of Use', icon: Shield },
        { to: '/contact', label: 'Contact Support', icon: Mail }
      ]
    }
  ], []);

  const submitFeedback = async () => {
    setFeedbackError('');
    setFeedbackMessage('');

    if (!rating) {
      setFeedbackError('Please choose a rating before submitting.');
      return;
    }

    if (!comment.trim()) {
      setFeedbackError('Please add a short review comment.');
      return;
    }

    try {
      setSubmitting(true);
      await submitPublicReview({
        name: reviewerName.trim(),
        email: reviewerEmail.trim(),
        rating: String(rating),
        comment: comment.trim()
      });
      setFeedbackMessage(`${companyName} has received your review at ${officialEmail}.`);
      setTimeout(() => {
        setShowFeedback(false);
        setComment('');
        setRating(0);
        setFeedbackMessage('');
      }, 1800);
    } catch (error) {
      setFeedbackError(error.response?.data?.error || 'Unable to send your review right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="footer-shell">
      <div className="container">
        <section className="footer-hero">
          <div className="footer-hero-copy">
            <BrandLogo variant="full" className="footer-hero-logo" alt={companyName} />
            <span className="footer-kicker">Submission-ready job portal</span>
            <h2>A calmer hiring flow for candidates and employers.</h2>
            <p>
              Build a stronger profile, manage your resume once, and move between jobs, interviews, and support
              without leaving the platform.
            </p>
          </div>

          <div className="footer-hero-actions">
            <button type="button" className="footer-hero-primary" onClick={() => openAuthModal('register')}>
              Join Now
            </button>
            <Link to="/jobs" className="footer-hero-secondary">Browse Jobs</Link>
          </div>
        </section>

        <section className="footer-grid">
          <div className="footer-brand-card">
            <div className="footer-brand">
              <span className="footer-brand-icon">
                <BrandLogo variant="icon" className="footer-brand-icon-logo" alt={companyName} />
              </span>
              <div>
                <h3>{companyName}</h3>
                <p>Profile, resume, and recruiter tools designed to feel tidy, useful, and easy to trust.</p>
              </div>
            </div>

            <div className="footer-support-band">
              <strong>Official support</strong>
              <a href={`mailto:${officialEmail}`}>{officialEmail}</a>
            </div>
          </div>

          {footerLinks.map((group) => (
            <section key={group.title} className="footer-col">
              <h4>{group.title}</h4>
              {group.links.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link key={item.to} to={item.to}>
                    <ItemIcon size={14} />
                    {item.label}
                  </Link>
                );
              })}
            </section>
          ))}

          <section className="footer-col">
            <h4>Candidate Tools</h4>
            <Link to="/resume-builder"><BookOpen size={14} />Resume AI</Link>
            <Link to="/profile"><Users size={14} />Profile & Resume</Link>
            <Link to="/contact"><Mail size={14} />Support Contact</Link>
          </section>
        </section>

        <section className="footer-bottom">
          <span>{`Copyright ${currentYear} ${companyName}`}</span>
          <div className="footer-bottom-links">
            <Link to="/privacy-policy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Support</Link>
            <button type="button" className="footer-review-btn" onClick={() => setShowFeedback(true)}>
              Leave a Review
            </button>
          </div>
        </section>
      </div>

      {showFeedback && (
        <div className="feedback-backdrop" role="dialog" aria-modal="true" aria-label="Leave a review">
          <div className="feedback-dialog">
            <button className="close-feedback" type="button" onClick={() => setShowFeedback(false)}>
              <X size={16} />
            </button>

            <span className="feedback-kicker">Official feedback</span>
            <h3>Share your experience with {companyName}</h3>
            <p>Your review will be sent to {officialEmail}.</p>

            <div className="rating-row" aria-label="Rate your experience">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`rate-star ${star <= rating ? 'is-active' : ''}`}
                  onClick={() => setRating(star)}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star size={20} fill={star <= rating ? '#f59e0b' : 'none'} color={star <= rating ? '#f59e0b' : '#cbd5e1'} />
                </button>
              ))}
            </div>

            <div className="feedback-grid">
              <input
                value={reviewerName}
                onChange={(event) => setReviewerName(event.target.value)}
                placeholder="Your name"
              />
              <input
                type="email"
                value={reviewerEmail}
                onChange={(event) => setReviewerEmail(event.target.value)}
                placeholder="Your email"
              />
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="What should we improve?"
              rows={5}
            />

            {feedbackError && <div className="feedback-error">{feedbackError}</div>}
            {feedbackMessage && <div className="feedback-success">{feedbackMessage}</div>}

            <button type="button" className="feedback-send" onClick={submitFeedback} disabled={submitting || loadingConfig}>
              <Send size={14} />
              {submitting ? 'Sending...' : 'Send Review'}
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
