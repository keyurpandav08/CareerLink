import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Clock3, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import { getPublicConfig } from '../services/publicConfig';
import { submitPublicContact } from '../services/publicInteractions';
import './Contact.css';

const defaultForm = {
  name: '',
  email: '',
  subject: '',
  message: ''
};

const Contact = () => {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('CareerLink');
  const [officialEmail, setOfficialEmail] = useState('support@careerlink.com');
  const [formData, setFormData] = useState(defaultForm);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

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

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setStatus('');
    setError('');

    try {
      await submitPublicContact(formData);
      setStatus(`Your message was sent to ${officialEmail}. We’ll get back soon.`);
      setFormData(defaultForm);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to send your message right now.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="contact-page">
      <div className="contact-shell">
        <div className="contact-hero">
          <span className="contact-kicker">Support and Partnerships</span>
          <h1>Contact {companyName}</h1>
          <p>
            Need help with applications, account recovery, or employer verification? Send us a message and we
            will route it to the official support inbox.
          </p>

          <div className="contact-meta-grid">
            <div className="contact-meta-card">
              <Mail size={16} />
              <div>
                <strong>Email</strong>
                <a href={`mailto:${officialEmail}`}>{officialEmail}</a>
              </div>
            </div>
            <div className="contact-meta-card">
              <Phone size={16} />
              <div>
                <strong>Phone</strong>
                <span>+91 00000 00000</span>
              </div>
            </div>
            <div className="contact-meta-card">
              <MapPin size={16} />
              <div>
                <strong>Location</strong>
                <span>Bangalore, India</span>
              </div>
            </div>
            <div className="contact-meta-card">
              <Clock3 size={16} />
              <div>
                <strong>Response Time</strong>
                <span>Within 1 business day</span>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-grid">
          <aside className="contact-sidebar">
            <div className="contact-side-card">
              <Building2 size={22} />
              <h2>What we can help with</h2>
              <ul>
                <li>Login, resume, and profile support</li>
                <li>Employer account and verification help</li>
                <li>Application status questions</li>
                <li>Product feedback and feature requests</li>
              </ul>
            </div>

            <div className="contact-side-card contact-side-muted">
              <MessageSquare size={22} />
              <h2>Quick tip</h2>
              <p>Include your registered email and a clear subject line so we can resolve the issue faster.</p>
              <Link to="/privacy-policy">Read our privacy policy</Link>
            </div>
          </aside>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-head">
              <span className="contact-form-kicker">Send a message</span>
              <h2>We’re listening.</h2>
              <p>Everything is sent directly to the company inbox. No fake popup, no dead end.</p>
            </div>

            <div className="contact-form-grid">
              <label>
                <span>Your Name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Your Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="contact-form-full">
                <span>Subject</span>
                <select name="subject" value={formData.subject} onChange={handleChange} required>
                  <option value="" disabled>Select a subject</option>
                  <option value="Job Application Issue">Job Application Issue</option>
                  <option value="Employer Verification">Employer Verification</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="General Feedback">General Feedback</option>
                </select>
              </label>

              <label className="contact-form-full">
                <span>Your Message</span>
                <textarea
                  name="message"
                  rows="6"
                  placeholder="Tell us what happened and how we can help."
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            {error && <div className="contact-alert contact-alert-error">{error}</div>}
            {status && <div className="contact-alert contact-alert-success">{status}</div>}

            <div className="contact-actions">
              <button type="submit" disabled={sending || loadingConfig}>
                <Send size={16} />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
              <button type="button" className="contact-secondary" onClick={() => navigate(-1)}>
                Go Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
