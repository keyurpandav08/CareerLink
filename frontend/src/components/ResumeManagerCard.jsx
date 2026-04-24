import { FileText, RefreshCcw, Trash2, Upload } from 'lucide-react';
import { hasResume } from '../utils/candidatePortal';
import './ResumeManagerCard.css';

const ResumeManagerCard = ({
  title = 'Resume Manager',
  description = 'Upload one resume once and reuse it across your profile, applications, and AI analysis.',
  resumeUrl,
  resumeFileName,
  busy = false,
  error = '',
  success = '',
  fileInputRef,
  onUpload,
  onDelete
}) => {
  const savedResumeAvailable = hasResume(resumeUrl);

  return (
    <section className="resume-manager-card">
      <div className="resume-manager-head">
        <div className="resume-manager-title">
          <div className={`resume-manager-icon ${savedResumeAvailable ? 'is-ready' : 'is-empty'}`}>
            <FileText size={18} />
          </div>
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        {savedResumeAvailable && (
          <span className="resume-manager-badge">Saved in profile</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".pdf,.doc,.docx"
        onChange={onUpload}
      />

      <div className={`resume-manager-panel ${savedResumeAvailable ? 'is-ready' : 'is-empty'}`}>
        <div className="resume-manager-copy">
          <strong>{savedResumeAvailable ? (resumeFileName || 'Uploaded resume') : 'No resume uploaded yet'}</strong>
          <span>
            {savedResumeAvailable
              ? 'This exact saved resume will be reused for job applications and AI analysis.'
              : 'Upload your latest resume here once. You can then analyze it and apply with the same saved file everywhere.'}
          </span>
          {savedResumeAvailable && <small>{resumeFileName || 'Resume file'} ready for reuse</small>}
        </div>

        <div className="resume-manager-actions">
          {savedResumeAvailable ? (
            <>
              <a href={resumeUrl} target="_blank" rel="noreferrer" className="resume-manager-btn secondary">
                View
              </a>
              <a href={`${resumeUrl}?download=1`} target="_blank" rel="noreferrer" className="resume-manager-btn secondary">
                Download
              </a>
              <button
                type="button"
                className="resume-manager-btn primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                <RefreshCcw size={15} />
                {busy ? 'Updating...' : 'Replace Resume'}
              </button>
              <button
                type="button"
                className="resume-manager-btn danger"
                onClick={onDelete}
                disabled={busy}
              >
                <Trash2 size={15} />
                {busy ? 'Removing...' : 'Remove'}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="resume-manager-btn primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              <Upload size={15} />
              {busy ? 'Uploading...' : 'Upload Resume'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="resume-manager-message is-error">{error}</div>}
      {success && <div className="resume-manager-message is-success">{success}</div>}
    </section>
  );
};

export default ResumeManagerCard;
