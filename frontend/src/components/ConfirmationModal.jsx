import PropTypes from 'prop-types';
import './ConfirmationModal.css';

const ConfirmationModal = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone,
  busy,
  onCancel,
  onConfirm
}) => {
  if (!open) return null;

  return (
    <div className="confirmation-modal-overlay" onClick={busy ? undefined : onCancel}>
      <div
        className="confirmation-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="confirmation-modal-title">{title}</h3>
        <p>{message}</p>
        <div className="confirmation-modal-actions">
          <button type="button" className="confirmation-btn ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirmation-btn ${tone}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  tone: PropTypes.oneOf(['primary', 'danger']),
  busy: PropTypes.bool,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func
};

ConfirmationModal.defaultProps = {
  open: false,
  title: 'Please confirm',
  message: 'Are you sure you want to continue?',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  tone: 'primary',
  busy: false,
  onCancel: undefined,
  onConfirm: undefined
};

export default ConfirmationModal;
