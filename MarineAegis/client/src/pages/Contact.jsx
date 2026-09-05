import PageLayout from "../components/layout/PageLayout.jsx";

export default function Contact() {
  return (
    <PageLayout pageSlug="contact" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="inner">
<>{/* Breadcrumb Start */}
  <div className="breadcrumb-area bg-f round-20 position-relative z-1">
    <div className="container text-center">
      <ul className="br-menu text-center bg_secondary d-inline-block list-unstyled mb-15">
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/">HOME</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block">CONTACT US</li>
      </ul>
      <h2 className="section-title style-one fw-medium font-secondary text-black text-center mb-6">Contact Us</h2>
    </div>
  </div>
  {/* Breadcrumb End */}
  {/* Contact Section Start */}
  <div className="container style-one pt-130">
    <div className="row">
      <div className="col-lg-5 mb-md-30">
        <div className="comment-form-box round-10">
          <form action="#" className="comment-form style-one round-10" id="cmt-form">
            <h3 className="fs-20 fw-semibold mb-18"> Get In Touch</h3>
            <div className="form-group position-relative mb-20">
              <input type="text" required className="w-100 ht-52 round-5 bg-white text-para border-0" placeholder="Name" />
            </div>
            <div className="form-group mb-20">
              <input type="email" placeholder="Email" required className="w-100 ht-52 round-5 bg-white text-para border-0" />
            </div>
            <div className="form-group mb-20">
              <input type="number" placeholder="Phone" required className="w-100 ht-52 round-5 bg-white text-para border-0" />
            </div>
            <div className="form-group mb-20">
              <input type="text" placeholder="Subject" required className="w-100 ht-52 round-5 bg-white text-para border-0" />
            </div>
            <div className="form-group mb-20">
              <textarea name="messages" id="messages" cols={30} rows={10} placeholder="Comment" className="w-100 round-20 bg-white text-para border-0 resize-0" defaultValue={""} />
            </div>
            <div className="form-check checkbox style-two mb-25">
              <input className="form-check-input" type="checkbox" id="test_2" />
              <label className="form-check-label" htmlFor="test_2">
                I've read &amp; agreed to <a href="/terms-conditions" className="text_primary link-hover-primary">Terms &amp; Conditions</a> &amp; <a href="/privacy-policy">Privacy Policy</a>
              </label>
            </div>
            <button className="btn style-three d-block w-100 fw-semibold position-relative round-oval" type="submit">Send Message<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></button>
          </form>
        </div>
      </div>
      <div className="col-lg-7 ps-xxl-5">
        <div className="contact-content ps-xxl-5 ms-xxl-3 mb-60">
          <h2 className="section-title style-one font-secondary fw-medium text-title mb-18">Talk To Our Maritime Cyber Defense And Fleet Intelligence Team</h2>
          <p className="mb-45">Discuss vessel integration, navigation integrity, autonomous operations, fleet risk, or incident recovery with our team.</p>
          <div className="contact-card-wrap style-one d-flex flex-wrap position-relative">
            <div className="contact-card style-two d-flex flex-wrap">
              <span className="contact-icon d-flex flex-column align-items-center justify-content-center rounded-circle bg_secondary"><img src="/assets/img/icons/phone-black.svg" alt="Icon" /></span>
              <div>
                <h6 className="fs-16 fw-semibold mb-12">Operations Desk</h6>
                <a href="mailto:operations@marineaegis.com" className="d-block text-para hover-text-primary">operations@marineaegis.com</a>
                <a href="mailto:security@marineaegis.com" className="d-block text-para hover-text-primary">security@marineaegis.com</a>
              </div>
            </div>
            <div className="contact-card style-two d-flex flex-wrap">
              <span className="contact-icon d-flex flex-column align-items-center justify-content-center rounded-circle bg_secondary"><img src="/assets/img/icons/pin-black.svg" alt="Icon" /></span>
              <div>
                <h6 className="fs-16 fw-semibold mb-12">Maritime Security Center</h6>
                <p>Global Maritime Operations Center<br />Atlantic Fleet Region</p>
              </div>
            </div>
            <div className="contact-card style-two d-flex flex-wrap">
              <span className="contact-icon d-flex flex-column align-items-center justify-content-center rounded-circle bg_secondary"><img src="/assets/img/icons/pin-black.svg" alt="Icon" /></span>
              <div>
                <h6 className="fs-16 fw-semibold mb-12">Email</h6>
                <a href="mailto:contact@marineaegis.com" className="d-block text-para hover-text-primary">contact@marineaegis.com</a>
                <a href="mailto:contact@marineaegis.com" className="d-block text-para hover-text-primary">contact@marineaegis.com</a>
              </div>
            </div>
            <div className="contact-card style-two">
              <h6 className="fs-16 fw-semibold mb-25 d-block">Follow Us</h6>
              <ul className="social-profile style-four list-unstyled mb-0">
                <li><a href="https://www.facebook.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-facebook-fill" /></a></li>
                <li><a href="https://x.com/?lang=en" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-twitter-x-line" /></a></li>
                <li><a href="https://www.instagram.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-instagram-line" /></a></li>
                <li><a href="https://www.linkedin.com/" target="_blank" className="d-flex flex-column align-items-center justify-content-center rounded-circle"><i className="ri-linkedin-fill" /></a></li>
              </ul>
            </div>
          </div>
        </div>
        <img src="/assets/img/contact-img.png" alt="Image" className="contact-img d-block mx-auto" />
      </div>
    </div>
  </div>
  {/* Contact Section End */}
  <div className="map-area contact-map-area position-relative z-1">
    <div className="container">
      <div className="comp-map style-two w-100 round-10">
        <iframe src="https://www.google.com/maps?q=Mumbai,+Maharashtra&amp;output=embed">
        </iframe>
      </div>
    </div>
  </div></>
    </PageLayout>
  );
}

