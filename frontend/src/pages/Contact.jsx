import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message Sent Successfully!");
    setFormData({ name:"", email:"", subject:"", message:"" });
  };
const navigate = useNavigate();

  return (
    <div className="contact-page">

      <div className="contact-container">

        <div className="contact-left">
          <h1>Contact JobLithic</h1>
          <p>
            Have questions? Need support? Our team is here to help you with
            job applications, employer verification, or technical issues.
          </p>

          <div className="contact-methods">
            <div>📧 support@joblithic.com</div>
            <div>📞 +91 0000000000</div>
            <div>📍 Banglore, India</div>
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

          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
          >
            <option value="">Select Subject</option>
            <option value="Job Issue">Job Application Issue</option>
            <option value="Employer Issue">Employer Verification</option>
            <option value="Technical">Technical Support</option>
            <option value="Other">Other</option>
          </select>

          <textarea
            name="message"
            placeholder="Your Message"
            rows="5"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>

          <button type="submit">Send Message</button>
        </form>
       <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
               <button
                 onClick={() => window.history.back()}
                 style={{
                   padding: "0.7rem 1.8rem",
                   borderRadius: "8px",
                   border: "none",
                   background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                   color: "white",
                   fontWeight: "600",
                   cursor: "pointer",
                   boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                   transition: "0.3s ease",
                   marginTop: "-50px"
                 }}
               >
                 ← Go Back
               </button>
             </div>
      </div>

    </div>
  );
};

export default Contact;