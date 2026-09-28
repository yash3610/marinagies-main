import { useEffect } from "react";

export default function StatusToast({ status, onClose }) {
  useEffect(() => {
    if (!status || status.type === "info") return undefined;
    const timer = window.setTimeout(
      onClose,
      status.type === "error" ? 7000 : 5000
    );
    return () => window.clearTimeout(timer);
  }, [status, onClose]);

  if (!status) return null;

  const iconClass = {
    success: "ri-checkbox-circle-line",
    error: "ri-error-warning-line",
    info: "ri-loader-4-line"
  }[status.type];

  return (
    <div className={`site-toast ${status.type}`} role="status" aria-live="polite">
      <i className={["site-toast-icon", iconClass].join(" ")} aria-hidden="true" />
      <span>{status.message}</span>
      <button type="button" onClick={onClose} aria-label="Close notification">
        <i className="ri-close-line" />
      </button>
    </div>
  );
}
