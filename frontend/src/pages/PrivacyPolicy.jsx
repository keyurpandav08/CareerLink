const PrivacyPolicy = () => {
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
          🔐 Privacy Policy
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Last Updated: 2026
        </p>
      </div>

      {/* Intro */}
      <p>
        JobLithic respects your privacy and is committed to protecting your
        personal information. This Privacy Policy explains how we collect,
        use, and safeguard your data when you use our platform.
      </p>

      <SectionTitle number="1" title="Information We Collect" />
      <p>
        We may collect personal information such as your name, email address,
        phone number, resume details, skills, and employment history when you
        register or apply for jobs on JobLithic.
      </p>
      <p>
        We may also collect usage information such as login activity,
        job searches, and application history to enhance our services.
      </p>

      <SectionTitle number="2" title="How We Use Your Information" />
      <ul style={{ paddingLeft: "1.2rem" }}>
        <li>Create and manage your JobLithic account</li>
        <li>Connect job seekers with verified employers</li>
        <li>Enable job applications and recruitment processes</li>
        <li>Improve platform functionality and experience</li>
        <li>Send important updates and notifications</li>
      </ul>

      <p style={{ fontWeight: "600", marginTop: "1rem" }}>
        We do not sell or rent your personal information.
      </p>

      <SectionTitle number="3" title="Data Security" />
      <p>
        We implement modern security measures to protect your data.
        Passwords are encrypted, and access to sensitive information
        is strictly controlled.
      </p>
      <p>
        However, no online platform is completely secure, and users
        acknowledge this inherent risk.
      </p>

      <SectionTitle number="4" title="Profile & Resume Visibility" />
      <p>
        Your profile and resume are visible only to authorized employers
        for recruitment purposes. You can update or delete your data
        anytime from your account settings.
      </p>

      <SectionTitle number="5" title="Cookies" />
      <p>
        JobLithic uses cookies to maintain sessions, enhance functionality,
        and analyze usage trends. You can manage cookies via browser settings.
      </p>

      <SectionTitle number="6" title="Third-Party Services" />
      <p>
        We may use trusted third-party providers for hosting, analytics,
        and communication. These partners are obligated to protect
        your information.
      </p>

      <SectionTitle number="7" title="User Rights" />
      <p>
        You have the right to access, update, or request deletion of
        your personal data. Contact our support team for assistance.
      </p>

      <SectionTitle number="8" title="Policy Updates" />
      <p>
        JobLithic may update this policy periodically. Changes will be
        reflected on this page.
      </p>

      <SectionTitle number="9" title="Contact Us" />
      <p>
        If you have questions about this Privacy Policy:
      </p>

      <div
        style={{
          background: "var(--background)",
          padding: "1.2rem",
          borderRadius: "10px",
          marginTop: "1rem",
          border: "1px solid var(--border)"
        }}
      >
        <strong>Email:</strong> support@JobLithic.com
      </div>

      {/* Bottom Agreement */}
      <p
        style={{
          marginTop: "3rem",
          fontWeight: "600",
          textAlign: "center",
          color: "var(--primary)"
        }}
      >
        By using JobLithic, you agree to this Privacy Policy.
      </p>

      {/* Back Button */}
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
            transition: "0.3s ease"
          }}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
};

/* Reusable Section Title Component */
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

export default PrivacyPolicy;
