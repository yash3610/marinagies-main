import { useLocation } from "react-router-dom";

/* MarineAegis shared navigation. */
export default function Header({ variant = "inner" }) {
  const { pathname } = useLocation();
  const activeLink = (path) => pathname === path ? "active" : undefined;
  const activeGroup = (paths) => paths.includes(pathname) ? "active" : undefined;
  const pagePaths = ["/about-us", "/services", "/careers", "/team", "/terms-conditions", "/privacy-policy"];
  const platformPaths = ["/faq", "/testimonials", "/login", "/register"];
  const insightPaths = ["/blog-left-sidebar", "/blog-right-sidebar", "/blog-grid", "/blog-single-right-sidebar"];

  if (variant === "homeSecurity") return (
    <div className="navbar-area style-two position-relative" id="navbar">
      <div className="container-fluid">
        <div className="navbar-wrapper d-flex justify-content-between align-items-center">
          <a href="/" className="navbar-brand">
            <img src="/assets/img/logo.png" alt="Logo" className="logo-light" />
            <img src="/assets/img/logo-white.png" alt="Logo" className="logo-dark" />
          </a>
          <div className="menu-area mx-auto">
            <div className="overlay" />
            <nav className="menu">
              <div className="menu-mobile-header">
                <button type="button" className="menu-mobile-arrow bg-transparent border-0"><i className="ri-arrow-left-s-line" /></button>
                <div className="menu-mobile-title" />
                <button type="button" className="menu-mobile-close bg-transparent border-0"><i className="ri-close-line" /></button>
              </div>
              <ul className="menu-section p-0 mb-0 lh-1">
                <li><a href="/" className="active">Home</a></li>
                <li className="menu-item-has-children">
                  <a href="javascript:void(0)">About<i className="ri-arrow-down-s-fill" /></a>
                  <ul className="menu-subs menu-column-1">
                    <li><a href="/about-us">About Us</a></li>
                    <li><a href="/services">Capabilities</a></li>
                    <li>
                      <a href="/careers">Careers</a>
                    </li>
                    <li><a href="/team">Team</a></li>
                    <li><a href="/terms-conditions">Terms &amp; Conditions</a></li>
                    <li><a href="/privacy-policy">Privacy Policy</a></li>
                  </ul>
                </li>
                <li><a href="/projects">Deployments</a></li>
                <li className="menu-item-has-children">
                  <a href="javascript:void(0)">Platform<i className="ri-arrow-down-s-fill" /></a>
                  <ul className="menu-subs menu-column-1">
                    <li><a href="/faq">Operator FAQ</a></li>
                    <li><a href="/testimonials">Fleet Trust</a></li>
                    <li><a href="/login">Login</a></li>
                    <li><a href="/register">Register</a></li>
                  </ul>
                </li>
                <li className="menu-item-has-children">
                  <a href="javascript:void(0)">Insights<i className="ri-arrow-down-s-fill" /></a>
                  <ul className="menu-subs menu-column-1">
                    <li className="menu-item-has-children"><a href="javascript:void(0)">Insights Library<i className="ri-arrow-right-s-fill" /></a>
                      <ul className="menu-subs menu-column-1">
                        <li><a href="/blog-right-sidebar">Threat Intelligence</a></li>
                        <li><a href="/blog-grid">All Insights</a></li>
                      </ul>
                    </li>
                    <li><a href="/blog-single-right-sidebar">Fleet Defense Insight</a></li>
                  </ul>
                </li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </nav>
          </div>
          <div className="other-options d-flex flex-wrap align-items-center justify-content-end">
            <div className="option-item d-lg-none">
              <div className="mobile-options position-relative me-3">
                <button className="dropdown-toggle text-center bg-transparent border-0 p-0 transition" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="ri-more-fill" />
                </button>
                <div className="dropdown-menu dropdown-menu-centered mobile-option-list top-1 border-0">
                  <a href="/login" className="btn style-three fw-semibold position-relative round-oval">Login<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></a>
                </div>
              </div>
            </div>
            <div className="option-item d-lg-block d-none">
              <a href="/login" className="btn style-three fw-semibold position-relative round-oval">Login<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></a>
            </div>
            <div className="option-item d-lg-none">
              <button type="button" className="menu-mobile-trigger">
                <span />
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
  if (variant === "homeAutonomous Vessels") return (
    <div className="navbar-area style-three position-relative" id="navbar">
      <div className="container-fluid">
        <div className="navbar-wrapper d-flex justify-content-between align-items-center">
          <a href="/" className="navbar-brand">
            <img src="/assets/img/logo.png" alt="Logo" className="logo-light" />
            <img src="/assets/img/logo-white.png" alt="Logo" className="logo-dark" />
          </a>
          <div className="menu-area mx-auto">
            <div className="overlay" />
            <nav className="menu">
              <div className="menu-mobile-header">
                <button type="button" className="menu-mobile-arrow bg-transparent border-0"><i className="ri-arrow-left-s-line" /></button>
                <div className="menu-mobile-title" />
                <button type="button" className="menu-mobile-close bg-transparent border-0"><i className="ri-close-line" /></button>
              </div>
              <ul className="menu-section p-0 mb-0 lh-1">
                <li><a href="/">Home</a></li>
                <li className="menu-item-has-children">
                  <a href="javascript:void(0)">About<i className="ri-arrow-down-s-fill" /></a>
                  <ul className="menu-subs menu-column-1">
                    <li><a href="/about-us">About Us</a></li>
                    <li>
                      <a href="/services">Capabilities</a>
                    </li>
                    <li><a href="/careers">Careers</a></li>
                    <li><a href="/team">Team</a></li>
                    <li><a href="/terms-conditions">Terms &amp; Conditions</a></li>
                    <li><a href="/privacy-policy">Privacy Policy</a></li>
                  </ul>
                </li>
                <li><a href="/projects">Deployments</a></li>
                <li className="menu-item-has-children">
                  <a href="javascript:void(0)">Platform<i className="ri-arrow-down-s-fill" /></a>
                  <ul className="menu-subs menu-column-1">
                    <li><a href="/faq">Operator FAQ</a></li>
                    <li><a href="/testimonials">Fleet Trust</a></li>
                    <li><a href="/login">Login</a></li>
                    <li><a href="/register">Register</a></li>
                  </ul>
                </li>
                <li className="menu-item-has-children">
                  <a href="javascript:void(0)">Insights<i className="ri-arrow-down-s-fill" /></a>
                  <ul className="menu-subs menu-column-1">
                    <li className="menu-item-has-children"><a href="javascript:void(0)">Insights Library<i className="ri-arrow-right-s-fill" /></a>
                      <ul className="menu-subs menu-column-1">
                        <li><a href="/blog-right-sidebar">Threat Intelligence</a></li>
                        <li><a href="/blog-grid">All Insights</a></li>
                      </ul>
                    </li>
                    <li><a href="/blog-single-right-sidebar">Fleet Defense Insight</a></li>
                  </ul>
                </li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </nav>
          </div>
          <div className="other-options d-flex flex-wrap align-items-center justify-content-end">
            <div className="option-item d-lg-none">
              <div className="mobile-options position-relative me-3">
                <button className="dropdown-toggle text-center bg-transparent border-0 p-0 transition" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="ri-more-fill" />
                </button>
                <div className="dropdown-menu dropdown-menu-centered mobile-option-list top-1 border-0">
                  <a href="/login" className="btn style-three fw-semibold position-relative round-oval">Login<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></a>
                </div>
              </div>
            </div>
            <div className="option-item d-lg-block d-none">
              <a href="/login" className="btn style-three fw-semibold position-relative round-oval">Login<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></a>
            </div>
            <div className="option-item d-lg-none">
              <button type="button" className="menu-mobile-trigger">
                <span />
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
  return (
    <div className="navbar-area style-two position-relative" id="navbar">
      <div className="container-fluid">
        <div className="navbar-wrapper d-flex justify-content-between align-items-center">
          <a href="/" className="navbar-brand">
            <img src="/assets/img/logo.png" alt="Logo" className="logo-light" />
            <img src="/assets/img/logo-white.png" alt="Logo" className="logo-dark" />
          </a>
          <div className="menu-area mx-auto">
            <div className="overlay" />
            <nav className="menu">
              <div className="menu-mobile-header">
                <button type="button" className="menu-mobile-arrow bg-transparent border-0"><i className="ri-arrow-left-s-line" /></button>
                <div className="menu-mobile-title" />
                <button type="button" className="menu-mobile-close bg-transparent border-0"><i className="ri-close-line" /></button>
              </div>
              <ul className="menu-section p-0 mb-0 lh-1">
                <li><a href="/" className={activeLink("/")}>Home</a></li>
                <li className="menu-item-has-children">
                  <a href="javascript:void(0)" className={activeGroup(pagePaths)}>About<i className="ri-arrow-down-s-fill" /></a>
                  <ul className="menu-subs menu-column-1">
                    <li><a href="/about-us" className={activeLink("/about-us")}>About Us</a></li>
                    <li>
                      <a href="/services" className={activeLink("/services")}>Capabilities</a>
                    </li>
                    <li><a href="/careers" className={activeLink("/careers")}>Careers</a></li>
                    <li><a href="/team" className={activeLink("/team")}>Team</a></li>
                    <li><a href="/terms-conditions" className={activeLink("/terms-conditions")}>Terms &amp; Conditions</a></li>
                    <li><a href="/privacy-policy" className={activeLink("/privacy-policy")}>Privacy Policy</a></li>
                  </ul>
                </li>
                <li><a href="/projects" className={activeLink("/projects")}>Deployments</a></li>
                <li className="menu-item-has-children">
                  <a href="javascript:void(0)" className={activeGroup(platformPaths)}>Platform<i className="ri-arrow-down-s-fill" /></a>
                  <ul className="menu-subs menu-column-1">
                    <li><a href="/faq" className={activeLink("/faq")}>Operator FAQ</a></li>
                    <li><a href="/testimonials" className={activeLink("/testimonials")}>Fleet Trust</a></li>
                    <li><a href="/login" className={activeLink("/login")}>Login</a></li>
                    <li><a href="/register" className={activeLink("/register")}>Register</a></li>
                  </ul>
                </li>
                <li className="menu-item-has-children">
                  <a href="javascript:void(0)" className={activeGroup(insightPaths)}>Insights<i className="ri-arrow-down-s-fill" /></a>
                  <ul className="menu-subs menu-column-1">
                    <li className="menu-item-has-children"><a href="javascript:void(0)">Insights Library<i className="ri-arrow-right-s-fill" /></a>
                      <ul className="menu-subs menu-column-1">
                        <li><a href="/blog-right-sidebar" className={activeLink("/blog-right-sidebar")}>Threat Intelligence</a></li>
                        <li><a href="/blog-grid" className={activeLink("/blog-grid")}>All Insights</a></li>
                      </ul>
                    </li>
                    <li><a href="/blog-single-right-sidebar" className={activeLink("/blog-single-right-sidebar")}>Fleet Defense Insight</a></li>
                  </ul>
                </li>
                <li><a href="/contact" className={activeLink("/contact")}>Contact</a></li>
              </ul>
            </nav>
          </div>
          <div className="other-options d-flex flex-wrap align-items-center justify-content-end">
            <div className="option-item d-lg-none">
              <div className="mobile-options position-relative me-3">
                <button className="dropdown-toggle text-center bg-transparent border-0 p-0 transition" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="ri-more-fill" />
                </button>
                <div className="dropdown-menu dropdown-menu-centered mobile-option-list top-1 border-0">
                  <a href="/login" className="btn style-three fw-semibold position-relative round-oval">Login<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></a>
                </div>
              </div>
            </div>
            <div className="option-item d-lg-block d-none">
              <a href="/login" className="btn style-three fw-semibold position-relative round-oval">Login<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></a>
            </div>
            <div className="option-item d-lg-none">
              <button type="button" className="menu-mobile-trigger">
                <span />
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
