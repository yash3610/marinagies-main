import PageLayout from "../components/layout/PageLayout.jsx";

export default function AboutUs() {
  return (
    <PageLayout pageSlug="about-us" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="inner">
<>{/* Breadcrumb Start */}
  <div className="breadcrumb-area bg-f round-20 position-relative z-1">
    <div className="container text-center">
      <ul className="br-menu text-center bg_secondary d-inline-block list-unstyled mb-15">
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/">HOME</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block">ABOUT US</li>
      </ul>
      <h2 className="section-title style-one fw-medium font-secondary text-black text-center mb-6">About Us</h2>
    </div>
  </div>
  {/* Breadcrumb End */}
  {/* About us Section Start */}
  <div className="about-area style-four overflow-hidden ptb-130">
    <div className="container-fluid">
      <div className="row">
        <div className="col-xxl-4 col-xl-5 col-lg-6">
          <div className="about-img-wrap position-relative mb-md-30">
            <img src="/assets/img/about/about-img-1.png" alt="Image" className="about-img position-absolute rotate" />
            <img src="/assets/img/about/about-shape-3.png" alt="Shape" className="about-img-shape mx-auto d-block" />
          </div>
        </div>
        <div className="col-xxl-7 col-xl-7 col-lg-6 ps-xl-4 pe-xxl-5">
          <div className="about-content position-relative">
            <div className="about-promo-text style-one move-right sm-none"><img src="/assets/img/about/thumbnail-2.png" alt="Image" />Write a blog post </div>
            <div className="about-promo-text style-two move-left sm-none"><img src="/assets/img/about/thumbnail-3.png" alt="Image" />Checklist task</div>
            <span className="section-subtitle style-two d-inline-block text_primary fw-bold fs-14 ls-15 mb-12" data-cue="slideInUp">ABOUT US</span>
            <h2 className="section-title style-four font-secondary fw-medium text-title">
              Built For Safer Seas, Powered By Intelligence - Discover How MarineAegis Is Protecting <span className="blur-text reveal-text">The Future Of Shipping</span>
              <span className="thumb"><img src="/assets/img/about/thumbnail-2.jpg" alt="Image" /></span>
              <span className="reveal-text blur-text d-block">Through Unified, Scalable, And Autonomous Cyber Defense For Every Connected Fleet.</span> 
            </h2>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* About us Section End */}
  {/* Mission Section Start */}
  <div className="container style-one pb-130">
    <div className="row">
      <div className="col-lg-5  mb-30">
        <div className="vision-tab bg-f round-10">
          <ul className="nav nav-tabs list-unstyled vision-tablist d-flex align-items-center justify-content-start w-100 mb-20" role="tablist">
            <li className="nav-item border-0">
              <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#tab_1" type="button" role="tab">Mission</button>
            </li>
            <li className="nav-item border-0">
              <button className="nav-link" data-bs-toggle="tab" data-bs-target="#tab_2" type="button" role="tab">Vision</button>
            </li>
          </ul>
          <div className="tab-content product-tab-content">
            <div className="tab-pane fade show active" id="tab_1" role="tabpanel">
              <div className="single-para mb-65">
                <p>To protect connected and autonomous vessels with trusted intelligence that improves resilience, ensures safety, and accelerates </p>
                <p>secure maritime operations - transforming how fleets detect, understand, and recover from cyber threats.</p>
              </div>
              <img src="/assets/img/about/mission-thumb.png" alt="Image" className="d-block mx-auto" />
            </div>
            <div className="tab-pane fade" id="tab_2" role="tabpanel">
              <p>Resilience - helping fleets operate safely as navigation, networks, and remote control become more connected.</p>
              <p>To protect connected and autonomous vessels with trusted intelligence that improves resilience, ensures safety, and accelerates </p>
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-7  mb-30">
        <div className="mission-bg bg-f position-relative overflow-hidden z-1 round-10">
          <div className="exp-box">
            <span className="font-secondary d-block text-white fw-semibold mb-20">50+</span>
            <p className="text-offwhite fw-semibold mb-0">Successful Deployments</p>
          </div>
          <h4 className="fw-semibold text-white mb-0">MarineAegis is a unified maritime cyber defense and intelligence platform</h4>
        </div>
      </div>
    </div>
  </div>
  {/* Mission Section End */}
  <div className="move-text-wrapper overflow-hidden mb-120">
    <div className="move-text style-seven position-relative z-1">
      <ul className="list-unstyled mb-0">
        <li className="position-relative font-secondary fw-normal">ONE INTELLIGENT PLATFORM BUILT TO VERIFY, DEFEND, EXPLAIN, AND RECOVER VESSEL OPERATIONS </li>
        <li className="position-relative font-secondary fw-normal">ONE INTELLIGENT PLATFORM BUILT TO VERIFY, DEFEND, EXPLAIN, AND RECOVER VESSEL OPERATIONS </li>
        <li className="position-relative font-secondary fw-normal">ONE INTELLIGENT PLATFORM BUILT TO VERIFY, DEFEND, EXPLAIN, AND RECOVER VESSEL OPERATIONS </li>
      </ul>
    </div>
  </div>
  {/* Why Choose Us Section Start */}
  <div className="wh-area style-four bg_primary position-relative z-1 round-20 pb-100">
    <img src="/assets/img/box-shape-2.png" alt="Shape" className="section-shape-one position-absolute bottom-0 start-0 z-n1" />
    <img src="/assets/img/box-shape-3.png" alt="Shape" className="section-shape-two position-absolute top-0 end-0 z-n1" />
    <div className="container-fluid style-two">
      <div className="row align-items-center">
        <div className="col-xl-7 col-lg-6 pe-xxl-5 ps-xxl-3">
          <div className="wh-bg bg-f bg-2 round-10" />
        </div>
        <div className="col-xl-5 col-lg-6 ps-xxl-5">
          <div className="wh-content mb-md-30">
            <span className="section-subtitle d-inline-block text_secondary fw-bold fs-14 ls-15 mb-12" data-cue="slideInUp">WHY CHOOSE MARINEAEGIS</span>
            <h2 className="section-title style-one font-secondary fw-medium text-white mb-15">Trusted By Fleet Operators For Scalable, Autonomous Maritime Defense</h2>
            <p className="text-offwhite mb-30">We connect navigation, onboard networks, remote commands, vendor risk, and recovery in one operational defense platform.</p>
            <ul className="feature-list d-flex flex-wrap list-unstyled mb-10 w-xxl-75">
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/shield-pink.svg" alt="Icon" /></span>
                Scalable Across Environments
              </li>
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/compliance-pink.svg" alt="Icon" /></span>
                Built-In Compliance Support
              </li>
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/folder-pink.svg" alt="Icon" /></span>
                Centralized Security Dashboard
              </li>
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/encrypted.svg" alt="Icon" /></span>
                Behavior-Based Monitoring
              </li>
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/lock-pink.svg" alt="Icon" /></span>
                Minimal Resource Footprint
              </li>
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/sensor-pink.svg" alt="Icon" /></span>
                Autonomous Incident Response
              </li>
            </ul>
            <a href="/login" className="btn style-one text-white fw-semibold position-relative round-oval">Explore Our Security Advantage<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-black.svg" alt="Icon" /></span></a>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Why Choose Us Section End */}
  {/* Testimonial Start */}
  <div className="testimonial-area style-four position-relative z-1 ptb-130">
    <div className="container style-one">
      <div className="row">
        <div className="col-lg-4">
          <div className="circle-text-wrap position-relative d-flex flex-column justify-content-center align-items-center rounded-circle me-auto">
            <img src="/assets/img/trusted-client-white.png" alt="Image" className="circle-text d-lock mx-auto rotate" />
            <img src="/assets/img/icons/quote-pink.svg" alt="Icon" className="position-absolute" />
          </div>
        </div>
        <div className="col-xl-8 col-lg-8 ps-xxl-5 pe-xxl-0">
          <div className="testimonial-slider-two swiper ps-xxl-4">
            <div className="swiper-wrapper">
              <div className="swiper-slide">
                <div className="testimonial-card style-two">
                  <p className="font-secondary fw-medium text-title">
                    MarineAegis connected navigation, network, and command intelligence across our fleet. It helped us identify suspicious behavior early and coordinate a safe response without disrupting vessel operations.
                  </p>
                  <div className="client-info-wrap d-flex flex-wrap align-items-center">
                    <div className="client-img rounded-circle">
                      <img src="/assets/img/clients/client-1.jpg" alt="Image" className="rounded-circle" />
                    </div>
                    <div className="client-info">
                      <h5 className="fs-20 fw-medium text-black mb-0">Captain Elena Ward</h5>
                      <span>Fleet Cybersecurity Director</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="swiper-slide">
                <div className="testimonial-card style-two">
                  <p className="font-secondary fw-medium text-title">
                    The platform gave our teams one clear operational picture instead of separate alerts. Its plain-language explanations made high-risk vessel decisions faster and easier to verify.
                  </p>
                  <div className="client-info-wrap d-flex flex-wrap align-items-center">
                    <div className="client-img rounded-circle">
                      <img src="/assets/img/clients/client-2.jpg" alt="Image" className="rounded-circle" />
                    </div>
                    <div className="client-info">
                      <h5 className="fs-20 fw-medium text-black mb-0">Commander Ravi Shah</h5>
                      <span>Autonomous Vessel Operator</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="swiper-slide">
                <div className="testimonial-card style-two">
                  <p className="font-secondary fw-medium text-title">
                    MarineAegis validated remote commands and emergency signals before action was taken. That extra intelligence strengthened autonomous safety and fleet-wide cyber resilience.
                  </p>
                  <div className="client-info-wrap d-flex flex-wrap align-items-center">
                    <div className="client-img rounded-circle">
                      <img src="/assets/img/clients/client-3.jpg" alt="Image" className="rounded-circle" />
                    </div>
                    <div className="client-info">
                      <h5 className="fs-20 fw-medium text-black mb-0">Dr. Sofia Chen</h5>
                      <span>Director, Maritime Operations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="slider-btn d-flex flex-wrap align-items-ecnter">
              <button className="prev-btn testimonial-prev border-0 d-flex flex-column align-items-center justify-content-center rounded-circle">
                <img src="/assets/img/icons/left-arrow-black.svg" alt="Image" />
              </button>
              <div className="testimonial-pagination" />
              <button className="next-btn testimonial-next border-0 d-flex flex-column align-items-center justify-content-center rounded-circle">
                <img src="/assets/img/icons/right-arrow-black.svg" alt="Image" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Testimonial End */}
  {/* Data Security Section Start */}
  <div className="data-section style-one pt-130 pb-100 round-20">
    <div className="container style-one">
      <div className="row">
        <div className="col-xl-8 offset-xl-2 col-md-10 offset-md-1 text-center">
          <span className="section-subtitle style-two fs-13 fw-medium ls-1 d-inline-block bg_secondary text-title round-oval mb-15"><img src="/assets/img/icons/lock.svg" alt="Icon" />DATA SECURITY</span>
          <h2 className="section-title style-one font-secondary fw-medium mb-40">Protect Vessel Operations With Zero Trust Architecture And Safety Controls</h2>
        </div>
      </div>
      <div className="row">
        <div className="col-xl-3 col-md-6 mb-30">
          <div className="data-card style-one bg-f d-flex flex-wrap flex-column text-center round-10">
            <div className="data-logo rounded-circle"><img src="/assets/img/about/ai-logo.png" alt="Image" className="rounded-circle" /></div>
            <h3 className="fs-24 fw-semibold mb-15">Intelligence For Vessel Safety</h3>
            <p className="mb-0">Cross-sensor intelligence verifies navigation and protects critical vessel operations.</p>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="data-card-img bg-f round-10 mb-30"><img src="/assets/img/about/about-1.png" alt="Image" className="round-10" /></div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="data-card style-two bg_primary round-10 mb-30">
            <div className="data-card-header fs-30 font-secondary fw-semibold d-flex flex-wrap align-items-center mb-15">
              <span className="data-icon d-flex flex-wrap align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/shield-white.svg" alt="Icon" /></span>
              <span className="data-header-text text-white">100%</span>
            </div>
            <h3 className="fs-20 fw-bold text-white mb-1">Navigation Integrity</h3>
            <p className="text-offwhite mb-0">GPS and AIS are checked against actual vessel movement.</p>
          </div>
          <div className="data-card style-three bg-white round-10 mb-30">
            <div className="data-card-header fs-30 font-secondary fw-semibold d-flex flex-wrap align-items-center mb-15">
              <span className="data-icon d-flex flex-wrap align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/shield-blue.svg" alt="Icon" /></span>
              <span className="data-header-text text-title">24/7</span>
            </div>
            <h3 className="fs-20 fw-bold text-title mb-1">Fleetwide Monitoring</h3>
            <p className="mb-0">Monitor vessel networks, devices, signals, and commands around the clock.</p>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-30">
          <div className="data-card style-four position-relative z-1 bg-f d-flex flex-column align-items-center justify-content-end round-10 text-center">
            <h3 className="fs-20 text-white mb-10">Resilient Edge Defense</h3>
            <p className="text-offwhite mb-0">Keep essential ship systems safe and available during an incident.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Data Security Section End */}
  {/* Brand Section Start */}
  <div className="container style-two pt-130">
    <div className="brand-slider-one swiper">
      <div className="swiper-wrapper align-items-center">
        <div className="swiper-slide">
          <div className="brand-logo style-one">
            <img src="/assets/img/brand/brand-1.svg" alt="Logo" className="d-block mx-auto" />
          </div>
        </div>
        <div className="swiper-slide">
          <div className="brand-logo style-one">
            <img src="/assets/img/brand/brand-2.svg" alt="Logo" className="d-block mx-auto" />
          </div>
        </div>
        <div className="swiper-slide">
          <div className="brand-logo style-one">
            <img src="/assets/img/brand/brand-3.svg" alt="Logo" className="d-block mx-auto" />
          </div>
        </div>
        <div className="swiper-slide">
          <div className="brand-logo style-one">
            <img src="/assets/img/brand/brand-4.svg" alt="Logo" className="d-block mx-auto" />
          </div>
        </div>
        <div className="swiper-slide">
          <div className="brand-logo style-one">
            <img src="/assets/img/brand/brand-5.svg" alt="Logo" className="d-block mx-auto" />
          </div>
        </div>
        <div className="swiper-slide">
          <div className="brand-logo style-one">
            <img src="/assets/img/brand/brand-6.svg" alt="Logo" className="d-block mx-auto" />
          </div>
        </div>
        <div className="swiper-slide">
          <div className="brand-logo style-one">
            <img src="/assets/img/brand/brand-7.svg" alt="Logo" className="d-block mx-auto" />
          </div>
        </div>
        <div className="swiper-slide">
          <div className="brand-logo style-one">
            <img src="/assets/img/brand/brand-8.svg" alt="Logo" className="d-block mx-auto" />
          </div>
        </div>
        <div className="swiper-slide">
          <div className="brand-logo style-one">
            <img src="/assets/img/brand/brand-1.svg" alt="Logo" className="d-block mx-auto" />
          </div>
        </div>
        <div className="swiper-slide">
          <div className="brand-logo style-one">
            <img src="/assets/img/brand/brand-3.svg" alt="Logo" className="d-block mx-auto" />
          </div>
        </div>
        <div className="swiper-slide">
          <div className="brand-logo style-one">
            <img src="/assets/img/brand/brand-4.svg" alt="Logo" className="d-block mx-auto" />
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Brand Section End */}
  {/* Team Section Start */}
  <div className="container style-one pt-130">
    <div className="row">
      <div className="col-xl-8 offset-xl-2 col-md-10 offset-md-1 text-center">
        <span className="section-subtitle style-two d-inline-block text_primary fw-bold fs-14 ls-15 mb-12">TEAM MEMBER</span>
        <h2 className="section-title style-one fw-medium text-center text-title mb-40 px-xxl-5">Meet&nbsp;The Team&nbsp;Building Autonomous Maritime Cyber Defense</h2>
      </div>
    </div>
  </div>
  <div className="team-slider-wrap position-relative pb-130">
    <div className="container">
      <div className="team-slider-one swiper">
        <div className="swiper-wrapper">
          <div className="swiper-slide">
            <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10">
              <div className="team-member-bg bg-1 position-absolute top-0 start-0 w-100 h-100 transition" />
              <div className="team-thumb rounded-circle mx-auto">
                <img src="/assets/img/team/team-thumb-1.jpg" alt="Image" className="rounded-circle transition" />
              </div>
              <div className="team-info position-relative z-1">
                <h3 className="fs-20 fw-semibold text-title transition">Elena Marlowe</h3>
                <span className="fs-15 d-block transition">Chief Maritime Defense Strategist</span>
              </div>
            </div>
          </div>
          <div className="swiper-slide">
            <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10">
              <div className="team-member-bg bg-2 position-absolute top-0 start-0 w-100 h-100 transition" />
              <div className="team-thumb rounded-circle mx-auto">
                <img src="/assets/img/team/team-thumb-2.jpg" alt="Image" className="rounded-circle transition" />
              </div>
              <div className="team-info position-relative z-1">
                <h3 className="fs-20 fw-semibold text-title transition">Ravi Deshmukh</h3>
                <span className="fs-15 d-block transition">Director of Operations</span>
              </div>
            </div>
          </div>
          <div className="swiper-slide">
            <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10">
              <div className="team-member-bg bg-3 position-absolute top-0 start-0 w-100 h-100 transition" />
              <div className="team-thumb rounded-circle mx-auto">
                <img src="/assets/img/team/team-thumb-3.jpg" alt="Image" className="rounded-circle transition" />
              </div>
              <div className="team-info position-relative z-1">
                <h3 className="fs-20 fw-semibold text-title transition">Sophia Zhang</h3>
                <span className="fs-15 d-block transition">Autonomous Vessel Security Manager</span>
              </div>
            </div>
          </div>
          <div className="swiper-slide">
            <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10">
              <div className="team-member-bg bg-4 position-absolute top-0 start-0 w-100 h-100 transition" />
              <div className="team-thumb rounded-circle mx-auto">
                <img src="/assets/img/team/team-thumb-4.jpg" alt="Image" className="rounded-circle transition" />
              </div>
              <div className="team-info position-relative z-1">
                <h3 className="fs-20 fw-semibold text-title transition">Lucas Anders</h3>
                <span className="fs-15 d-block transition">Senior Maritime AI Engineer</span>
              </div>
            </div>
          </div>
          <div className="swiper-slide">
            <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10">
              <div className="team-member-bg bg-5 position-absolute top-0 start-0 w-100 h-100 transition" />
              <div className="team-thumb rounded-circle mx-auto">
                <img src="/assets/img/team/team-thumb-5.jpg" alt="Image" className="rounded-circle transition" />
              </div>
              <div className="team-info position-relative z-1">
                <h3 className="fs-20 fw-semibold text-title transition">Luca Moretti</h3>
                <span className="fs-15 d-block transition">Maritime Systems Architect</span>
              </div>
            </div>
          </div>
          <div className="swiper-slide">
            <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10">
              <div className="team-member-bg bg-6 position-absolute top-0 start-0 w-100 h-100 transition" />
              <div className="team-thumb rounded-circle mx-auto">
                <img src="/assets/img/team/team-thumb-6.jpg" alt="Image" className="rounded-circle transition" />
              </div>
              <div className="team-info position-relative z-1">
                <h3 className="fs-20 fw-semibold text-title transition">James Holdon</h3>
                <span className="fs-15 d-block transition">Director of Machine</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="slider-btn">
      <button className="prev-btn team-prev bg-transparent border-0 d-flex flex-column align-items-center justify-content-center rounded-circle">
        <img src="/assets/img/icons/left-arrow-large.svg" alt="Image" />
      </button>
      <button className="next-btn team-next bg-transparent border-0 d-flex flex-column align-items-center justify-content-center rounded-circle">
        <img src="/assets/img/icons/right-arrow-large.svg" alt="Image" />
      </button>
    </div>
  </div>
  {/* Team Section End */}
  {/* Feature Section Start */}
  <div className="container style-one">
    <div className="row">
      <div className="col-xxl-6 col-lg-7 mb-md-30">
        <div className="row">
          <div className="col-md-6">
            <div className="feature-card style-three mb-45">
              <img src="/assets/img/features/automation.svg" alt="Icon" className="feature-icon" />
              <h3 className="fs-20 fw-semibold text-title">Safe Autonomous Threat Response</h3>
              <p className="mb-0">Contain threats and recommend safe actions at machine speed with clear operator control.</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="feature-card style-three mb-45">
              <img src="/assets/img/features/system-integration.svg" alt="Icon" className="feature-icon" />
              <h3 className="fs-20 fw-semibold text-title">Unified Vessel System Integration</h3>
              <p className="mb-0">Connect navigation, satellite communications, onboard IT, OT, and edge devices without disrupting operations.</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="feature-card style-three mb-30">
              <img src="/assets/img/features/analytics.svg" alt="Icon" className="feature-icon" />
              <h3 className="fs-20 fw-semibold text-title">Real-Time Fleet Monitoring &amp; Analytics</h3>
              <p className="mb-0">Correlate signals and behavior across ships through clear fleet dashboards and explainable alerts.</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="feature-card style-three mb-30">
              <img src="/assets/img/features/modular-design.svg" alt="Icon" className="feature-icon" />
              <h3 className="fs-20 fw-semibold text-title">Fleet-Scale &amp; Modular Defense</h3>
              <p className="mb-0">From one connected vessel to a global fleet, modular defenses scale with your operational needs.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xxl-5 offset-xxl-1 col-lg-5 ps-xxl-4 pe-xxl-0">
        <span className="section-subtitle style-three fs-14 fw-bold ls-15 d-inline-block text_primary mb-15">FEATURES</span>
        <h2 className="section-title style-one fw-medium text-title mb-20">Plain-Language Intelligence For Faster, Safer Operator Decisions</h2>
        <img src="/assets/img/features/feature-6.png" alt="Image" className="feature-img d-block ms-auto" />
      </div>
    </div>
  </div>
  {/* Feature Section End */}</>
    </PageLayout>
  );
}


