export default function BackToTop() {
  return (
    <button id="progress-wrap" className="progress-wrap style-one border-0" aria-label="Back to top">
      <svg className="progress-circle svg-content" width="100%" height="100%" viewBox="-1 -1 102 102">
        <path id="progress-path" d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98" />
      </svg>
      <span className="back-to-top-core" aria-hidden="true">
        <i className="ri-arrow-up-line" />
      </span>
    </button>
  );
}
