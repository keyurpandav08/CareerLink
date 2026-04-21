import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Contact.css';

const Contact = () => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
      navigate('/');
    }, 2000);

    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-left">
          <h1>Contact CareerLink</h1>
          <p>
            Have questions? Need support? Our team is here to help you with job applications, employer
            verification, or technical issues.
          </p>

          <div className="contact-methods">
            <div>Email: support@careerlink.com</div>
            <div>Phone: +91 0000000000</div>
            <div>Location: Bangalore, India</div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <select name="subject" value={formData.subject} onChange={handleChange} required>
            <option value="" disabled>
              Select Subject
            </option>
            <option value="Job Issue">Job Application Issue</option>
            <option value="Employer Issue">Employer Verification</option>
            <option value="Technical">Technical Support</option>
            <option value="Other">Other</option>
          </select>

          <textarea
            name="message"
            rows="5"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
          />

          <button type="submit">Send Message</button>
        </form>

        <button onClick={() => navigate(-1)} className="back-btn" type="button">
          Back
        </button>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div className="checkmark">OK</div>
            <h3>Message Sent!</h3>
            <p>Redirecting to home...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
