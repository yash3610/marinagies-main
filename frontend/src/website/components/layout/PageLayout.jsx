import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import BackToTop from "../common/BackToTop.jsx";
import SiteWidgets from "../common/SiteWidgets.jsx";
import StatusToast from "../common/StatusToast.jsx";
import useSiteAnimations from "../../hooks/useSiteAnimations.js";
import { extractFormPayload } from "../../utils/forms.js";
import { postJson } from "../../services/api.js";

export default function PageLayout({ pageSlug, title, variant, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    document.title = title;
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 250);
    window.scrollTo(0, 0);
    return () => window.clearTimeout(timer);
  }, [pageSlug, title]);

  const handleLinkClick = useCallback((event) => {
    const anchor = event.target.closest?.("a");
    if (!anchor || event.defaultPrevented || event.button !== 0) return;
    if (anchor.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (href.startsWith("javascript:") || href === "#") {
      event.preventDefault();
      return;
    }

    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/")) return;
    event.preventDefault();
    navigate(`${url.pathname}${url.search}${url.hash}`);
  }, [navigate]);

  const handleFormSubmit = useCallback(async (event) => {
    event.preventDefault();
    const form = event.target;
    const request = extractFormPayload(form, pageSlug);

    if (!request) {
      setStatus({ type: "info", message: "This form is ready for its final data workflow." });
      return;
    }

    const button = form.querySelector('button[type="submit"], button:not([type])');
    if (button) button.disabled = true;
    try {
      const result = await postJson(request.endpoint, request.payload);
      if (result.token && result.user) {
        localStorage.setItem("marineaegis_token", result.token);
        localStorage.setItem("marineaegis_user", JSON.stringify(result.user));
        window.location.assign("/dashboard");
        return;
      }
      setStatus({ type: "success", message: result.message });
      if (!request.endpoint.includes("/login")) form.reset();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      if (button) button.disabled = false;
    }
  }, [pageSlug]);

  useSiteAnimations(pageSlug, location.pathname);

  return (
    <div onClickCapture={handleLinkClick} onSubmitCapture={handleFormSubmit}>
      <SiteWidgets loading={loading} />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Header variant={variant} />
          <main>{children}</main>
          <Footer variant={variant} />
        </div>
      </div>
      <BackToTop />
      <StatusToast status={status} onClose={() => setStatus(null)} />
    </div>
  );
}

