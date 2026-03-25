import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        maxWidth: "950px",
        margin: "4rem auto",
        padding: "3rem",
        background: "var(--surface)",
        borderRadius: "16px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
        lineHeight: "1.8",
        color: "var(--text-main)",
        border: "1px solid var(--border)"
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h1 style={{ fontWeight: "800", marginBottom: "0.5rem" }}>
          📄 Terms of Service
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Last Updated: 2026
        </p>
      </div>

      <p>
        These Terms of Service govern your access to and use of the
        JobLithic platform. By using JobLithic, you agree to comply
        with these terms. If you do not agree, please discontinue use.
      </p>

      <SectionTitle number="1" title="Eligibility" />
      <p>
        You must be at least 18 years old to use JobLithic. By registering,
        you confirm that all information provided is accurate and complete.
      </p>

      <SectionTitle number="2" title="Account Responsibility" />
      <p>
        You are responsible for maintaining the confidentiality of your
        account credentials and for all activities conducted under your account.
      </p>

      <SectionTitle number="3" title="Platform Usage" />
      <ul style={{ paddingLeft: "1.2rem" }}>
        <li>Use JobLithic only for lawful job-related purposes</li>
        <li>No false information, spam, or misleading content</li>
        <li>Employers must post genuine job opportunities</li>
        <li>Applicants must provide accurate profile details</li>
      </ul>

      <SectionTitle number="4" title="Job Applications" />
      <p>
        JobLithic does not guarantee job placement. We serve as a
        connecting platform between job seekers and employers and
        are not responsible for hiring decisions.
      </p>

      <SectionTitle number="5" title="Content Ownership" />
      <p>
        Users retain ownership of their submitted content but grant
        JobLithic permission to display and use such content for
        platform functionality.
      </p>

      <SectionTitle number="6" title="Account Suspension" />
      <p>
        JobLithic reserves the right to suspend or terminate accounts
        that violate these terms or engage in harmful behavior.
      </p>

      <SectionTitle number="7" title="Limitation of Liability" />
      <p>
        JobLithic shall not be liable for any direct or indirect damages
        resulting from the use or inability to use the platform.
      </p>

      <SectionTitle number="8" title="Changes to Terms" />
      <p>
        We may update these Terms of Service periodically. Continued use
        of JobLithic after changes indicates acceptance of the revised terms.
      </p>

      <SectionTitle number="9" title="Governing Law" />
      <p>
        These terms are governed by and interpreted in accordance with
        applicable laws.
      </p>

      <p
        style={{
          marginTop: "3rem",
          fontWeight: "600",
          textAlign: "center",
          color: "var(--primary)"
        }}
      >
        By using JobLithic, you agree to these Terms of Service.
      </p>

      {/* Back Button */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "0.7rem 1.8rem",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
            transition: "0.3s ease"
          }}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
};

/* Reusable Section Title */
const SectionTitle = ({ number, title }) => (
  <h4
    style={{
      marginTop: "2.2rem",
      marginBottom: "0.8rem",
      fontWeight: "700",
      display: "flex",
      alignItems: "center",
      gap: "0.6rem"
    }}
  >
    <span
      style={{
        backgroundColor: "var(--primary)",
        color: "white",
        borderRadius: "50%",
        width: "28px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.8rem",
        fontWeight: "bold"
      }}
    >
      {number}
    </span>
    {title}
  </h4>
);

export default Terms;
