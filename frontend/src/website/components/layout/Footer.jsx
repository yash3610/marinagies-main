/* MarineAegis shared footer. */
const quickLinks = [
  { href: "/about-us", label: "About" },
  { href: "/projects", label: "Deployments" },
  { href: "/blog-grid", label: "Blogs" },
  { href: "/contact", label: "Contact" },
];

function QuickLinks() {
  return (
    <ul className="footer-menu list-unstyled mb-0">
      {quickLinks.map(({ href, label }) => (
        <li key={href}><a href={href}>{label}</a></li>
      ))}
    </ul>
  );
}

export default function Footer({ variant = "inner" }) {
  if (variant === "homeSecurity") return (
    <footer className="footer-area style-one bg-black position-relative z-1 pt-130">
      <div className="container style-one">
        <div className="row justify-content-center mb-40">
          <div className="footer-logo-column col-lg-2 col-md-6" data-cue="slideInUp">
            <div className="footer-widget mb-30">
              <a href="/" className="logo"><img src="/assets/img/footer-logo.png" alt="MarineAegis" className="footer-brand-logo" /></a>
            </div>
          </div>
          <div className="footer-links-column col-lg-3 col-md-6">
            <div className="footer-widget mb-30 ps-xxl-5 ms-xxl-1" data-cue="slideInUp">
              <h3 className="footer-widget-title text-white fs-18 fw-semibold">Quick Links</h3>
              <QuickLinks />
            </div>
          </div>
          <div className="col-lg-3 col-md-6 ps-xxl-0 pe-xxl-5 pe-lg-4" data-cue="slideInUp">
            <div className="footer-widget mb-30">
              <h3 className="footer-widget-title text-white fs-18 fw-semibold">Address</h3>
              <ul className="contact-info list-unstyled mb-0">
                <li className="position-relative">
                  <img src="/assets/img/icons/pin-small.svg" alt="Icon" />
                  <span className="text-white fw-medium">Address :</span> 952 Bad Hill St, Asheville, NC 28803, USA
                </li>
                <li className="position-relative">
                  <img src="/assets/img/icons/mail-small.svg" alt="Icon" />
                  <span className="text-white fw-medium d-block">Email :</span>
                  <a href="mailto:contact@marineaegis.com">contact@marineaegis.com</a>
                </li>
                <li className="position-relative">
                  <img src="/assets/img/icons/phone-small.svg" alt="Icon" />
                  <span className="text-white fw-medium d-block">Phone :</span>
                  <a href="mailto:operations@marineaegis.com">Operations Support</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="col-lg-4 col-md-6 ps-xxl-4 pe-xxl-1" data-cue="slideInUp">
            <div className="footer-widget mb-30">
              <h3 className="text-white fs-20 font-secondary fw-medium mb-12">Subscribe To Our Newsletter</h3>
              <form action="#" className="newsletter-form position-relative">
                <input type="email" className="fs-15 w-100 bg-transparent text-white outline-0" placeholder="Enter Your Email" />
                <button className="position-absolute bg-transparent border-0 end-0"><img src="/assets/img/icons/plane-small.svg" alt="Icon" /></button>
              </form>
              <div className="post-share d-flex flex-wrap align-items-center">
                <span className="text-white fw-medium me-2">Follow Us :</span>
                <ul className="social-profile style-one list-unstyled mb-0">
                  <li><a href="https://www.facebook.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-facebook-fill" /></a></li>
                  <li><a href="https://x.com/?lang=en" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-twitter-x-line" /></a></li>
                  <li><a href="https://www.instagram.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-instagram-line" /></a></li>
                  <li><a href="https://www.linkedin.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-linkedin-fill" /></a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom position-relative overflow-hidden z-1" data-cue="fadIn">
        <div className="container-fluid position-relative px-xxl-4">
          <p className="copyright-text position-absolute bg_primary round-oval d-inline-block text-white text-center mb-0"><i className="ri-copyright-line" /><span className="text_secondary fw-semibold">MarineAegis </span> protects connected and autonomous maritime operations.</p>
        </div>
      </div>
    </footer>

  );
  if (variant === "homeAutonomous Vessels") return (
    <footer className="footer-area style-two bg-black position-relative z-1 pt-130">
      <div className="container style-one">
        <div className="row justify-content-center mb-40">
          <div className="footer-logo-column col-lg-2 col-md-6" data-cue="slideInUp">
            <div className="footer-widget mb-30">
              <a href="/" className="logo"><img src="/assets/img/footer-logo.png" alt="MarineAegis" className="footer-brand-logo" /></a>
            </div>
          </div>
          <div className="footer-links-column col-lg-3 col-md-6">
            <div className="footer-widget mb-30 ps-xxl-5 ms-xxl-1" data-cue="slideInUp">
              <h3 className="footer-widget-title text-white fs-18 fw-semibold">Quick Links</h3>
              <QuickLinks />
            </div>
          </div>
          <div className="col-lg-3 col-md-6 ps-xxl-0 pe-xxl-5 pe-lg-4" data-cue="slideInUp">
            <div className="footer-widget mb-30">
              <h3 className="footer-widget-title text-white fs-18 fw-semibold">Address</h3>
              <ul className="contact-info list-unstyled mb-0">
                <li className="position-relative">
                  <img src="/assets/img/icons/pin-small.svg" alt="Icon" />
                  <span className="text-white fw-medium">Address :</span> 952 Bad Hill St, Asheville, NC 28803, USA
                </li>
                <li className="position-relative">
                  <img src="/assets/img/icons/mail-small.svg" alt="Icon" />
                  <span className="text-white fw-medium d-block">Email :</span>
                  <a href="mailto:contact@marineaegis.com">contact@marineaegis.com</a>
                </li>
                <li className="position-relative">
                  <img src="/assets/img/icons/phone-small.svg" alt="Icon" />
                  <span className="text-white fw-medium d-block">Phone :</span>
                  <a href="mailto:operations@marineaegis.com">Operations Support</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="col-lg-4 col-md-6 ps-xxl-4 pe-xxl-1" data-cue="slideInUp">
            <div className="footer-widget mb-30">
              <h3 className="text-white fs-20 font-secondary fw-medium mb-12">Subscribe To Our Newsletter</h3>
              <form action="#" className="newsletter-form position-relative">
                <input type="email" className="fs-15 w-100 bg-transparent text-white outline-0" placeholder="Enter Your Email" />
                <button className="position-absolute bg-transparent border-0 end-0"><img src="/assets/img/icons/plane-small.svg" alt="Icon" /></button>
              </form>
              <div className="post-share d-flex flex-wrap align-items-center">
                <span className="text-white fw-medium me-2">Follow Us :</span>
                <ul className="social-profile style-one list-unstyled mb-0">
                  <li><a href="https://www.facebook.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-facebook-fill" /></a></li>
                  <li><a href="https://x.com/?lang=en" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-twitter-x-line" /></a></li>
                  <li><a href="https://www.instagram.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-instagram-line" /></a></li>
                  <li><a href="https://www.linkedin.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-linkedin-fill" /></a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom position-relative overflow-hidden z-1" data-cue="fadIn">
        <div className="container-fluid position-relative px-xxl-4">
          <p className="copyright-text position-absolute bg_primary round-oval d-inline-block text-white text-center mb-0"><i className="ri-copyright-line" /><span className="text_secondary fw-semibold">MarineAegis </span> protects connected and autonomous maritime operations.</p>
        </div>
      </div>
    </footer>

  );
  return (
    <footer className="footer-area style-one bg-black position-relative z-1 pt-130">
      <div className="container style-one">
        <div className="row justify-content-center mb-40">
          <div className="footer-logo-column col-lg-2 col-md-6">
            <div className="footer-widget mb-30">
              <a href="/" className="logo"><img src="/assets/img/footer-logo.png" alt="MarineAegis" className="footer-brand-logo" /></a>
            </div>
          </div>
          <div className="footer-links-column col-lg-3 col-md-6">
            <div className="footer-widget mb-30 ps-xxl-5 ms-xxl-1">
              <h3 className="footer-widget-title text-white fs-18 fw-semibold">Quick Links</h3>
              <QuickLinks />
            </div>
          </div>
          <div className="col-lg-3 col-md-6 ps-xxl-0 pe-xxl-5 pe-lg-4">
            <div className="footer-widget mb-30">
              <h3 className="footer-widget-title text-white fs-18 fw-semibold">Address</h3>
              <ul className="contact-info list-unstyled mb-0">
                <li className="position-relative">
                  <img src="/assets/img/icons/pin-small.svg" alt="Icon" />
                  <span className="text-white fw-medium">Address :</span> 952 Bad Hill St, Asheville, NC 28803, USA
                </li>
                <li className="position-relative">
                  <img src="/assets/img/icons/mail-small.svg" alt="Icon" />
                  <span className="text-white fw-medium d-block">Email :</span>
                  <a href="mailto:contact@marineaegis.com">contact@marineaegis.com</a>
                </li>
                <li className="position-relative">
                  <img src="/assets/img/icons/phone-small.svg" alt="Icon" />
                  <span className="text-white fw-medium d-block">Phone :</span>
                  <a href="mailto:operations@marineaegis.com">Operations Support</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="col-lg-4 col-md-6 ps-xxl-4 pe-xxl-1">
            <div className="footer-widget mb-30">
              <h3 className="text-white fs-20 font-secondary fw-medium mb-12">Subscribe To Our Newsletter</h3>
              <form action="#" className="newsletter-form position-relative">
                <input type="email" className="fs-15 w-100 bg-transparent text-white outline-0" placeholder="Enter Your Email" />
                <button className="position-absolute bg-transparent border-0 end-0"><img src="/assets/img/icons/plane-small.svg" alt="Icon" /></button>
              </form>
              <div className="post-share d-flex flex-wrap align-items-center">
                <span className="text-white fw-medium me-2">Follow Us :</span>
                <ul className="social-profile style-one list-unstyled mb-0">
                  <li><a href="https://www.facebook.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-facebook-fill" /></a></li>
                  <li><a href="https://x.com/?lang=en" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-twitter-x-line" /></a></li>
                  <li><a href="https://www.instagram.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-instagram-line" /></a></li>
                  <li><a href="https://www.linkedin.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-linkedin-fill" /></a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom position-relative overflow-hidden z-1">
        <div className="container-fluid position-relative px-xxl-4">
          <p className="copyright-text position-absolute bg_primary round-oval d-inline-block text-white text-center mb-0"><i className="ri-copyright-line" /><span className="text_secondary fw-semibold">MarineAegis </span> protects connected and autonomous maritime operations.</p>
        </div>
      </div>
    </footer>

  );
}
