export default function StatusToast({ status, onClose }) {
  if (!status) return null;

  return (
    <div className={`site-toast ${status.type}`} role="status">
      <span>{status.message}</span>
      <button type="button" onClick={onClose} aria-label="Close notification">
        <i className="ri-close-line" />
      </button>
    </div>
  );
}
