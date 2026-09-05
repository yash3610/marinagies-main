import PageLayout from "../components/layout/PageLayout.jsx";

export default function Index2() {
  return (
    <PageLayout pageSlug="index-2" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="homeSecurity">
<>{/* Hero Section Start */}
  <div className="hero-area style-two bg-f position-relative overflow-hidden round-10 z-1">
    <img src="/assets/img/hero/section-shape-1.png" alt="Shape" className="section-shape position-absolute bottom-0 start-0 w-100 z-n1" />
    <span className="blur-text style-one position-absolute z-0">MARITIME DEFENSE</span>
    <span className="blur-text style-two position-absolute z-2">INTELLIGENCE</span>
    <div className="container-fluid position-relative">
      <div className="row">
        <div className="col-xl-5 col-lg-6">
          <div className="hero-content">
            <h6 className="section-subtitle style-two bg_secondary fs-13 fw-semibold ls-1 text-black d-inline-block bg_primary round-oval mb-10" data-cue="slideInUp"><img src="/assets/img/icons/lock.svg" alt="Icon" />AUTONOMOUS MARITIME SECURITY, POWERED BY AI</h6>
            <h1 className="font-secondary fw-medium text-black" data-cue="slideInUp" data-delay={300}>Autonomous <span className="text_primary fw-bold">Maritime Defense</span> For Safer Vessel Operations</h1>
            <p className="mb-0" data-cue="slideInUp" data-delay={400}>Protect vessels with verified navigation, command validation, fleet intelligence, and autonomous cyber defense</p>
          </div>
        </div>
      </div>
      <div className="hero-img-wrap ship-hero-wrap">
        <div className="ship-radar-rings" aria-hidden="true"><span /><span /><span /></div>
        <img src="/assets/img/hero/marine-3d-ship-transparent-v5.png" alt="3D cargo ship protected by a maritime cybersecurity shield" className="hero-img ship-hero-image d-block position-relative z-1" />
        <div className="ship-callout ship-callout-monitor"><i className="ri-radar-line" /><strong>Real-time<br />Monitoring</strong></div>
        <div className="ship-callout ship-callout-threat"><i className="ri-brain-line" /><strong>AI Threat<br />Detection</strong></div>
        <div className="ship-callout ship-callout-fleet"><i className="ri-ship-line" /><strong>Fleet<br />Security</strong></div>
        <div className="ship-callout ship-callout-network"><i className="ri-shield-keyhole-line" /><strong>Network<br />Protection</strong></div>
        <span className="blur-text">AI</span>
        <div className="circle-text-wrap rounded-circle">
          <span className="bg_secondary position-absolute d-flex flex-column align-items-center justify-content-center rounded-circle transition">
            <img src="/assets/img/icons/up-right-arrow.svg" alt="Icon" className="transition" />
          </span>
          <img src="/assets/img/hero/circle-text.svg" alt="Text Image" className="circle-text d-block mx-auto rotate" />
          <a href="/contact" className="position-absolute top-0 start-0 w-100 h-100 z-1" />
        </div>
      </div>
    </div>
  </div>
  {/* Hero Section End */}
  {/* About Section Start */}
  <div className="about-area style-two position-relative z-1 overflow-hidden pt-130 pb-100">
    <div className="container">
      <div className="row">
        <div className="col-lg-3 col-md-5 pe-xxl-5 mb-30" data-cue="slideInUp">
          <p className="mb-40">We unite vessel operations and cyber intelligence to detect threats before they affect ship safety.</p>
          <a href="/about-us" className="btn style-two fw-semibold position-relative round-oval">Learn More<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></a>
        </div>
        <div className="col-lg-4 col-md-7 mb-30">
          <div className="about-img round-10" data-cue="slideInUp">
            <img src="/assets/img/about/marine-4.png" alt="Image" className="round-10" />
          </div>
        </div>
        <div className="col-lg-5 ps-xxl-5 pe-xxl-4 mb-30">
          <span className="section-subtitle style-two fs-13 fw-medium ls-1 d-inline-block bg_secondary text-title round-oval mb-15" data-cue="slideInUp"><img src="/assets/img/icons/lock.svg" alt="Icon" />ABOUT US</span>
          <h2 className="section-title style-one font-secondary fw-medium mb-40" data-cue="slideInUp" data-delay={400}>Protecting Ships And Fleets Through Unified Intelligence And Safe Autonomous Defense</h2>
        </div>
      </div>
    </div>
    <div className="move-text style-six overflow-hidden">
      <ul className="list-unstyled mb-0">
        <li className="position-relative font-secondary">UNIFIED PROTECTION FOR NAVIGATION, NETWORKS, COMMANDS, AND VESSEL OPERATIONS </li>
        <li className="position-relative font-secondary">UNIFIED PROTECTION FOR NAVIGATION, NETWORKS, COMMANDS, AND VESSEL OPERATIONS </li>
        <li className="position-relative font-secondary">UNIFIED PROTECTION FOR NAVIGATION, NETWORKS, COMMANDS, AND VESSEL OPERATIONS </li>
      </ul>
    </div>
  </div>
  {/* About Section End */}
  {/* Service Section Start */}
  <div className="service-area style-one position-relative z-1 pt-130">
    <img src="/assets/img/section-shape-3.png" alt="Shape" className="section-shapeone position-absolute top-0 end-0 z-0" />
    <img src="/assets/img/section-shape-2.png" alt="Shape" className="section-shape-two position-absolute start-0 z-0" />
    <div className="container style-one pb-100">
      <div className="row">
        <div className="col-xl-8 offset-xl-2 col-md-10 offset-md-1 text-center">
          <span className="section-subtitle style-two fs-13 fw-medium ls-1 d-inline-block bg_secondary text-title round-oval mb-15" data-cue="slideInUp"><img src="/assets/img/icons/lock.svg" alt="Icon" />MARINEAEGIS MARITIME DEFENSE CAPABILITIES</span>
          <h2 className="section-title style-one font-secondary fw-medium text-white mb-40 px-xxl-5" data-cue="slideInUp">Integrated Maritime Intelligence For Detection, Validation, Safe Response, And Recovery</h2>
        </div>
      </div>
      <div className="service-card-wrap style-one">
        <div className="service-card style-one position-relative z-1 d-inline-flex flex-wrap align-items-center transition" data-cue="slideInUp">
          <span className="service-counter font-secondary">01</span>
          <h3 className="fs-24 fw-semibold text-white transition">GPS And AIS Signal Verification</h3>
          <a href="/service-details" className="position-absolute top-0 start-0 w-100 h-100" />
        </div>
        <div className="service-card style-one active position-relative z-1 d-inline-flex flex-wrap align-items-center transition" data-cue="slideInUp">
          <span className="service-counter font-secondary">02</span>
          <h3 className="fs-24 fw-semibold text-white transition">Digital Twin Safe Response</h3>
          <a href="/service-details" className="position-absolute top-0 start-0 w-100 h-100" />
        </div>
        <div className="service-card style-one position-relative z-1 d-inline-flex flex-wrap align-items-center transition" data-cue="slideInUp">
          <span className="service-counter font-secondary">03</span>
          <h3 className="fs-24 fw-semibold text-white transition">Onboard Network &amp; Edge Defense</h3>
          <a href="/service-details" className="position-absolute top-0 start-0 w-100 h-100" />
        </div>
        <div className="service-card style-one position-relative z-1 d-inline-flex flex-wrap align-items-center transition" data-cue="slideInUp">
          <span className="service-counter font-secondary">04</span>
          <h3 className="fs-24 fw-semibold text-white transition">Remote Command &amp; Distress Validation</h3>
          <a href="/service-details" className="position-absolute top-0 start-0 w-100 h-100" />
        </div>
      </div>
    </div>
    <div className="testimonial-area style-two position-relative z-1 ptb-130">
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
  </div>
  {/* Service Section End */}
  {/* Data Security Section Start */}
  <div className="data-section style-one pt-130 pb-100 round-20">
    <div className="container style-one">
      <div className="row">
        <div className="col-xl-8 offset-xl-2 col-md-10 offset-md-1 text-center">
          <span className="section-subtitle style-two fs-13 fw-medium ls-1 d-inline-block bg_secondary text-title round-oval mb-15" data-cue="slideInUp"><img src="/assets/img/icons/lock.svg" alt="Icon" />VESSEL OPERATIONS SECURITY</span>
          <h2 className="section-title style-one font-secondary fw-medium mb-40" data-cue="slideInUp" data-delay={400}>Protect Vessel Operations With Zero Trust Architecture And Safety Controls</h2>
        </div>
      </div>
      <div className="row">
        <div className="col-xl-3 col-md-6 mb-30" data-cue="slideInUp">
          <div className="data-card style-one bg-f d-flex flex-wrap flex-column text-center round-10">
            <div className="data-logo rounded-circle"><img src="/assets/img/about/ai-logo.png" alt="Image" className="rounded-circle" /></div>
            <h3 className="fs-24 fw-semibold mb-15">Intelligence For Vessel Safety</h3>
            <p className="mb-0">Navigation, network, and command intelligence protects every critical operation.</p>
          </div>
        </div>
        <div className="col-xl-3 col-md-6" data-cue="slideInUp">
          <div className="data-card-img bg-f round-10 mb-30"><img src="/assets/img/about/about-1.png" alt="Image" className="round-10" /></div>
        </div>
        <div className="col-xl-3 col-md-6" data-cue="slideInUp">
          <div className="data-card style-two bg_primary round-10 mb-30">
            <div className="data-card-header fs-30 font-secondary fw-semibold d-flex flex-wrap align-items-center mb-15">
              <span className="data-icon d-flex flex-wrap align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/shield-white.svg" alt="Icon" /></span>
              <span className="data-header-text text-white">100%</span>
            </div>
            <h3 className="fs-20 fw-bold text-white mb-1">Navigation Integrity</h3>
            <p className="text-offwhite mb-0">GPS and AIS are checked against real vessel movement.</p>
          </div>
          <div className="data-card style-three bg-white round-10 mb-30">
            <div className="data-card-header fs-30 font-secondary fw-semibold d-flex flex-wrap align-items-center mb-15">
              <span className="data-icon d-flex flex-wrap align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/shield-blue.svg" alt="Icon" /></span>
              <span className="data-header-text text-title">24/7</span>
            </div>
            <h3 className="fs-20 fw-bold text-title mb-1">Fleetwide Monitoring</h3>
            <p className="mb-0">Monitor vessels, edge devices, and onboard networks around the clock.</p>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-30" data-cue="slideInUp">
          <div className="data-card style-four position-relative z-1 bg-f d-flex flex-column align-items-center justify-content-end round-10 text-center">
            <h3 className="fs-20 text-white mb-10">Resilient Edge Defense</h3>
            <p className="text-offwhite mb-0">Isolate threats while keeping essential ship systems available.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Data Security Section End */}
  {/* Brand Section Start */}
  <div className="container style-two ptb-130">
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
  {/* Why Choose Us Section Start */}
  <div className="wh-area style-two bg_primary position-relative z-1 round-20">
    <img src="/assets/img/box-shape-2.png" alt="Shape" className="section-shape-one position-absolute bottom-0 start-0 z-n1" />
    <img src="/assets/img/box-shape-3.png" alt="Shape" className="section-shape-two position-absolute top-0 z-n1" />
    <div className="container-fluid style-one">
      <div className="row align-items-center">
        <div className="col-xl-5 col-lg-6">
          <div className="wh-content mb-md-30">
            <span className="section-subtitle style-two bg_secondary fs-13 fw-medium ls-1 text-black d-inline-block bg_primary round-oval mb-12" data-cue="slideInUp"><img src="/assets/img/icons/lock.svg" alt="Icon" />WHY CHOOSE MARINEAEGIS</span>
            <h2 className="section-title style-one font-secondary fw-medium text-white mb-15" data-cue="slideInUp" data-delay={400}>Trusted By Fleet Operators For Scalable, Autonomous Maritime Defense</h2>
            <p className="text-offwhite mb-30" data-cue="slideInUp" data-delay={500}>MarineAegis connects navigation, networks, commands, vendors, and recovery in one fleetwide defense platform.</p>
            <ul className="feature-list d-flex flex-wrap list-unstyled mb-10 w-xxl-75" data-cue="slideInUp" data-delay={600}>
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/shield-pink.svg" alt="Icon" /></span>
                Scalable Across Ships And Fleets
              </li>
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/compliance-pink.svg" alt="Icon" /></span>
                Replayable Compliance Evidence
              </li>
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/folder-pink.svg" alt="Icon" /></span>
                Unified Fleet Command Dashboard
              </li>
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/encrypted.svg" alt="Icon" /></span>
                Vessel Behavior Monitoring
              </li>
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/lock-pink.svg" alt="Icon" /></span>
                Edge-Ready Offline Protection
              </li>
              <li className="position-relative fw-semibold text-white">
                <span className="d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/sensor-pink.svg" alt="Icon" /></span>
                Digital Twin Safe Response
              </li>
            </ul>
            <a href="/login" className="btn style-one text-white fw-semibold position-relative round-oval">Explore Maritime Defense<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-black.svg" alt="Icon" /></span></a>
          </div>
        </div>
        <div className="col-xl-7 col-lg-6 ps-xxl-5" data-cue="slideInUp" data-delay={400}>
          <div className="wh-bg bg-f bg-1 round-10" />
        </div>
      </div>
    </div>
  </div>
  {/* Why Choose Us Section End */}
  {/* Feature Section Start */}
  <div className="container style-one pt-130 pb-100">
    <div className="row">
      <div className="col-xl-8 offset-xl-2 col-md-10 offset-md-1 text-center px-xxl-5">
        <span className="section-subtitle style-two bg_secondary fs-13 fw-medium ls-1 text-black d-inline-block bg_primary round-oval mb-15" data-cue="slideInUp"><img src="/assets/img/icons/lock.svg" alt="Icon" />MARINEAEGIS MARITIME DEFENSE FEATURES</span>
        <h2 className="section-title style-one font-secondary fw-medium text-center mb-40" data-cue="slideInUp" data-delay={400}>Verified Signals And Commands For Safer Autonomous Vessel Operations</h2>
      </div>
    </div>
    <div className="row justify-content-center position-relative z-1">
      <img src="/assets/img/line-shape.png" alt="Shape" className="feature-card-shape position-absolute top-0 start-0 d-xl-block d-none z-n1" />
      <div className="col-xxl-3 col-xl-3 col-md-6 pe-xxl-5" data-cue="slideInUp">
        <div className="feature-card style-two mb-30">
          <div className="feature-icon d-flex flex-column align-items-center justify-content-center position-relative z-1 round-10"><img src="/assets/img/icons/ransomeware.svg" alt="Icon" className="transition" /></div>
          <h3 className="fs-20 fw-semibold pe-xxl-5">Real-Time Navigation Validation</h3>
          <p className="mb-0">Cross-check GPS, AIS, and movement data to expose spoofed navigation signals.</p>
        </div>
      </div>
      <div className="col-xxl-3 col-xl-3 col-md-6 ps-xxl-5 pe-xxl-4" data-cue="slideInUp">
        <div className="feature-card style-two mb-30">
          <div className="feature-icon d-flex flex-column align-items-center justify-content-center position-relative z-1 round-10"><img src="/assets/img/icons/security.svg" alt="Icon" className="transition" /></div>
          <h3 className="fs-20 fw-semibold pe-xxl-5">Predictive Vessel Risk Analytics</h3>
          <p className="mb-0">Detect abnormal network and device behavior before it becomes operational risk.</p>
        </div>
      </div>
      <div className="col-xxl-3 col-xl-3 col-md-6 ps-xxl-5 pe-xxl-4" data-cue="slideInUp">
        <div className="feature-card style-two mb-30">
          <div className="feature-icon d-flex flex-column align-items-center justify-content-center position-relative z-1 round-10"><img src="/assets/img/icons/unlocking.svg" alt="Icon" className="transition" /></div>
          <h3 className="fs-20 fw-semibold pe-xxl-5">Digital Twin Safe Response</h3>
          <p className="mb-0">Test containment and recovery actions safely before applying them onboard.</p>
        </div>
      </div>
      <div className="col-xxl-3 col-xl-3 col-md-6 ps-xxl-5 pe-xxl-4" data-cue="slideInUp">
        <div className="feature-card style-two mb-30">
          <div className="feature-icon d-flex flex-column align-items-center justify-content-center position-relative z-1 round-10"><img src="/assets/img/icons/phishing.svg" alt="Icon" className="transition" /></div>
          <h3 className="fs-20 fw-semibold pe-xxl-5">Fleet Intelligence Dashboard</h3>
          <p className="mb-0">See threats, commands, vendors, incidents, and compliance across the fleet.</p>
        </div>
      </div>
    </div>
  </div>
  {/* Feature Section End */}
  {/* About Us Section Start */}
  <div className="about-area style-three bg-black position-relative overflow-hidden z-1 ptb-130">
    <img src="/assets/img/about/about-shape-1.png" alt="Shape" className="section-shape-one position-absolute top-0 end-0 z-n1" />
    <img src="/assets/img/about/about-shape-2.png" alt="Shape" className="section-shape-one position-absolute bottom-0 start-0 z-n1" />
    <div className="container style-one position-relative">
      <img src="/assets/img/about/about-thumb-2.png" alt="Image" className="about-thumb round-10 move-left" />
      <span className="d-block fs-14 fw-bold ls-15 text_secondary mb-12">ABOUT US</span>
      <h2 className="section-title style-four fw-medium text-white pe-xxl-4">Protecting Connected Fleets With <span className="thumb round-oval"><img src="/assets/img/about/about-thumb-4.jpg" alt="Image" className="round-oval" /></span> Unified Maritime Defense Seamlessly <span className="blur-text reveal-text">Across Navigation, Networks, Commands, And Recovery Workflows</span></h2>
      <div className="circle-text-wrap position-relative z-1 rounded-circle d-flex flex-column align-items-center justify-content-center ms-auto">
        <span className="exp-years font-secondary text-white fw-bold d-block">25</span>
        <img src="/assets/img/about/experience-text.png" alt="Image" className="circle-text d-block mx-auto rotate" />
      </div>
    </div>
    <img src="/assets/img/about/about-img-3.png" alt="Image" className="about-img position-absolute bottom-0 z-1 move-right" />
  </div>
  {/* About Us Section End */}
  {/* Pricing Section Start */}
  {/* <div className="pricing-area style-two position-relative z-1 ptb-130 round-20">
    <img src="/assets/img/box-shape.png" alt="Shape" className="section-shape position-absolute top-0 end-0 z-n1" />
    <div className="container style-one">
      <div className="row align-items-center mb-40">
        <div className="col-xl-6 col-lg-7 mb-lg-20 pe-xxl-5">
          <span className="section-subtitle style-two fs-13 fw-medium ls-1 d-inline-block bg_secondary text-title round-oval mb-15" data-cue="slideInUp"><img src="/assets/img/icons/lock.svg" alt="Icon" />PRICING PLANS</span>
          <h2 className="section-title style-one font-secondary fw-medium mb-0 pe-xxl-5" data-cue="slideInUp" data-delay={400}>Flexible Maritime Defense Plans For Vessels And Fleets Of Every Size</h2>
        </div>
        <div className="col-xl-6 col-lg-5">
          <div className="pricing-switch-wrap style-two position-relative d-flex justify-content-center ms-lg-auto" data-cue="slideInUp">
            <label className="pricing_switch">
              <input type="checkbox" id="togBtn" />
              <span className="pricing_slider round">
                <span className="on">Monthly</span>
                <span className="off">Yearly</span></span>
            </label>
          </div>
        </div>
      </div>
      <div className="pricing-table style-one table-responsive" data-cue="slideInUp">
        <table className="table text-nowrap align-middle">
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">
                <div className="pricing-header text-center">
                  <span className="pricing-subtitle fs-20 fw-medium font-secondary text-para mb-8">Starter</span>
                  <span className="font-secondary fwsemibold pricing-tag text1">30.00 <span className="fs-16 font-primary fw-medium text-para">\Per Month</span></span>
                  <span className="font-secondary fwsemibold pricing-tag text2">60.00 <span className="fs-16 font-primary fw-medium text-para">\Per Year</span></span>
                  <p className="text-para text-center mb-0">Essential protection for a <br /> single vessel</p>
                </div>
              </th>
              <th scope="col">
                <div className="pricing-header text-center">
                  <span className="featured position-absolute text-black fs-15">Popular</span>
                  <span className="pricing-subtitle fs-20 fw-medium font-secondary text-para mb-12">Pro</span>
                  <span className="font-secondary fwsemibold pricing-tag text1">50.00 <span className="fs-16 font-primary fw-medium text-para">\Per Month</span></span>
                  <span className="font-secondary fwsemibold pricing-tag text2">80.00 <span className="fs-16 font-primary fw-medium text-para">\Per Year</span></span>
                  <p className="text-para text-center mb-0">Advanced protection for a <br /> growing fleet</p>
                </div>
              </th>
              <th scope="col">
                <div className="pricing-header text-center">
                  <span className="pricing-subtitle fs-20 fw-medium font-secondary text-para mb-12">Fleet</span>
                  <span className="font-secondary fwsemibold pricing-tag text1">70.00 <span className="fs-16 font-primary fw-medium text-para">\Per Month</span></span>
                  <span className="font-secondary fwsemibold pricing-tag text2">90.00 <span className="fs-16 font-primary fw-medium text-para">\Per Year</span></span>
                  <p className="text-para text-center mb-0">Secure your cloud, network, and <br /> data at scale</p>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <span className="fw-medium text-title">Navigation And Risk Reports</span>
              </th>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <span className="fw-medium text-title">Real-Time AI Threat Monitoring</span>
              </th>
              <td>
                <span className="text-para">1 Admin User</span>
              </td>
              <td>
                <span className="text-para">4 Admin User</span>
              </td>
              <td>
                <span className="text-para">10 Admin User</span>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <span className="fw-medium text-title">Cloud &amp; Endpoint Protection</span>
              </th>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <span className="fw-medium text-title">Priority Fleet Support</span>
              </th>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <span className="fw-medium text-title">Real-Time AI Threat Monitoring</span>
              </th>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <span className="fw-medium text-title">API Access</span>
              </th>
              <td>
                <span className="unavailable"><i className="ri-close-line" /></span>
              </td>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <span className="fw-medium text-title">Dedicated Maritime Security Lead</span>
              </th>
              <td>
                <span className="unavailable"><i className="ri-close-line" /></span>
              </td>
              <td>
                <span className="unavailable"><i className="ri-close-line" /></span>
              </td>
              <td>
                <span className="available"><i className="ri-checkbox-circle-line" /></span>
              </td>
            </tr>
            <tr>
              <th scope="row" />
              <td>
                <a href="/login" className="btn style-two fw-semibold position-relative round-oval">Get Started<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></a>
              </td>
              <td>
                <a href="/login" className="btn style-two fw-semibold position-relative round-oval">Get Started<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></a>
              </td>
              <td>
                <a href="/login" className="btn style-two fw-semibold position-relative round-oval">Get Started<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div> */}
  {/* Pricing Section End */}
  {/* Serving Platform Section Start */}
  <div className="container style-one ptb-130">
    <div className="row align-items-center">
      <div className="col-lg-6 pe-xxl-5">
        <div className="platform-img round-10 pe-xxl-2 mb-md-30" data-cue="slideInUp">
          <img src="/assets/img/about/platform-marine-defense.jpg" alt="Autonomous maritime vessel protected by connected cyber defense systems" className="tilt-img round-10" />
        </div>
      </div>
      <div className="col-lg-6 ps-xxl-3">
        <div className="platform-content" data-cue="slideInUp">
          <span className="section-subtitle style-two fs-13 fw-medium ls-1 d-inline-block bg_secondary text-title round-oval mb-15" data-cue="slideInUp"><img src="/assets/img/icons/lock.svg" alt="Icon" />MARITIME OPERATIONS WE PROTECT</span>
          <h2 className="section-title style-one text-title fw-medium mb-10" data-cue="slideInUp" data-delay={300}>Comprehensive Protection For Connected, Autonomous, And Remote Vessel Systems</h2>
          <p className="mb-25">From a single connected ship to an autonomous fleet, MarineAegis provides consistent real-time cyber and operational protection.</p>
          <div className="accordion style-one" id="accordionExample_one">
            <div className="accordion-item" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="true" aria-controls="collapseFour" role="button">
              <div className="accordion-header" id="headingFour">
                <div className="accordion-button">
                  <span className="accord-arrow">
                    <i className="ri-arrow-down-s-fill plus" />
                    <i className="ri-arrow-up-s-fill minus" />
                  </span>
                  <span className="accord-icon d-flex flex-column align-items-center justify-content-center rounded-circle bg-white"> <img src="/assets/img/icons/bank.svg" alt="Icon" /></span>
                  Commercial Shipping Fleets
                </div>
              </div>
              <div id="collapseFour" className="accordion-collapse collapse show" aria-labelledby="headingFour" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">We correlate navigation, satellite links, onboard networks, edge devices, and operational technology in one system.</p>
                </div>
              </div>
            </div>
            <div className="accordion-item  collapsed" data-bs-toggle="collapse" data-bs-target="#collapseFive" aria-expanded="false" aria-controls="collapseFive" role="button">
              <div className="accordion-header" id="headingFive">
                <div className="accordion-button">
                  <span className="accord-arrow">
                    <i className="ri-arrow-down-s-fill plus" />
                    <i className="ri-arrow-up-s-fill minus" />
                  </span>
                  <span className="accord-icon d-flex flex-column align-items-center justify-content-center rounded-circle bg-white"> <img src="/assets/img/icons/cloud.svg" alt="Icon" /></span>
                  Autonomous &amp; Remote Vessels
                </div>
              </div>
              <div id="collapseFive" className="accordion-collapse collapse " aria-labelledby="headingFive" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">We correlate navigation, satellite links, onboard networks, edge devices, and operational technology in one system.</p>
                </div>
              </div>
            </div>
            <div className="accordion-item  collapsed" data-bs-toggle="collapse" data-bs-target="#collapseSix" aria-expanded="false" aria-controls="collapseSix" role="button">
              <div className="accordion-header" id="headingSix">
                <div className="accordion-button">
                  <span className="accord-arrow">
                    <i className="ri-arrow-down-s-fill plus" />
                    <i className="ri-arrow-up-s-fill minus" />
                  </span>
                  <span className="accord-icon d-flex flex-column align-items-center justify-content-center rounded-circle bg-white"> <img src="/assets/img/icons/monitor.svg" alt="Icon" /></span>
                  Ports &amp; Offshore Operations
                </div>
              </div>
              <div id="collapseSix" className="accordion-collapse collapse" aria-labelledby="headingSix" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">We correlate navigation, satellite links, onboard networks, edge devices, and operational technology in one system.</p>
                </div>
              </div>
            </div>
            <div className="accordion-item  collapsed" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne" role="button">
              <div className="accordion-header" id="headingOne">
                <div className="accordion-button">
                  <span className="accord-arrow">
                    <i className="ri-arrow-down-s-fill plus" />
                    <i className="ri-arrow-up-s-fill minus" />
                  </span>
                  <span className="accord-icon d-flex flex-column align-items-center justify-content-center rounded-circle bg-white"> <img src="/assets/img/icons/desktop.svg" alt="Icon" /></span>
                  Onboard OT &amp; Edge Devices
                </div>
              </div>
              <div id="collapseOne" className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">MarineAegis monitors onboard routers, connected devices, and operational technology for suspicious behavior while preserving critical vessel functions and safety.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Serving Platform Section End */}
  {/* Call To Action Section Start */}
  <div className="cta-area style-two bg-f position-relative z-1 ptb-130 round-20">
    <div className="container style-one">
      <div className="row align-items-center">
        <div className="col-xxl-5 col-md-6 pe-xxl-5 mb-md-30">
          <span className="section-subtitle style-two fs-13 fw-medium ls-1 d-inline-block bg_secondary text-title round-oval mb-15" data-cue="slideInUp"><img src="/assets/img/icons/lock.svg" alt="Icon" />CALL TO ACTION</span>
          <h2 className="section-title style-one text-title fw-medium mb-0" data-cue="slideInUp" data-delay={300}>Ready To Protect Every Signal, Command, Device, And Vessel Operation</h2>
        </div>
        <div className="col-xxl-6 offset-xxl-1 col-md-6">
          <div className="circle-text-wrap rounded-circle position-relative ms-md-auto">
            <span className="bg_primary position-absolute d-flex flex-column align-items-center justify-content-center rounded-circle transition">
              <img src="/assets/img/icons/up-right-arrow-white.svg" alt="Icon" className="transition" />
            </span>
            <img src="/assets/img/request-demo.svg" alt="Text Image" className="circle-text d-block mx-auto rotate" />
            <a href="/contact" className="position-absolute top-0 start-0 w-100 h-100 z-1" />
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Call To Action Section End */}
  {/* Blog Section Start */}
  <div className="container style-one pt-130 pb-100">
    <div className="row">
      <div className="col-xxl-6 offset-xxl-3 col-md-6 offset-md-3 text-center px-xxl-0">
        <span className="section-subtitle style-two fs-13 fw-medium ls-1 d-inline-block bg_secondary text-title round-oval mb-15" data-cue="slideInUp"><img src="/assets/img/icons/lock.svg" alt="Icon" />BLOG &amp; NEWS</span>
        <h2 className="section-title style-one fw-medium text-center text-title mb-40 px-xxl-5" data-cue="slideInUp" data-delay={300}>Expert&nbsp;Insights And Trends&nbsp;In Maritime Security</h2>
      </div>
    </div>
    <div className="row justify-content-center">
      <div className="col-xxl-3 col-xl-4 col-md-6" data-cue="slideInUp">
        <div className="blog-card style-two img-hover-wrap round-10 mb-30">
          <div className="blog-img position-relative img-hover overflow-hidden round-10">
            <img src="/assets/img/blog/blog-4.jpg" alt="Image" className="transition round-10" />
          </div>
          <div className="blog-info">
            <ul className="blog-metainfo list-unstyled">
              <li>By <a href="/posts-by-author">MarineAegis Intelligence Team</a></li>
              <li><a href="/posts-by-date">12 Aug, 2026</a></li>
            </ul>
            <h3 className="fs-20 fw-semibold"><a href="/blog-single-right-sidebar" className="text-black link-hover-primary transition">How AI Is Transforming Maritime Cyber Defense Systems</a></h3>
            <a href="/blog-single-right-sidebar" className="link style-two fw-semibold">Read More<i className="ri-arrow-right-line" /></a>
          </div>
        </div>
      </div>
      <div className="col-xxl-3 col-xl-4 col-md-6" data-cue="slideInUp">
        <div className="blog-card style-two img-hover-wrap round-10 mb-30">
          <div className="blog-img position-relative img-hover overflow-hidden round-10">
            <img src="/assets/img/blog/blog-5.jpg" alt="Image" className="transition round-10" />
          </div>
          <div className="blog-info">
            <ul className="blog-metainfo list-unstyled">
              <li>By <a href="/posts-by-author">MarineAegis Intelligence Team</a></li>
              <li><a href="/posts-by-date">16 Aug, 2026</a></li>
            </ul>
            <h3 className="fs-20 fw-semibold"><a href="/blog-single-right-sidebar" className="text-black link-hover-primary transition">Top Maritime Cyber Threats Every Fleet Should Watch</a></h3>
            <a href="/blog-single-right-sidebar" className="link style-two fw-semibold">Read More<i className="ri-arrow-right-line" /></a>
          </div>
        </div>
      </div>
      <div className="col-xxl-3 col-xl-4 col-md-6" data-cue="slideInUp">
        <div className="blog-card style-two img-hover-wrap round-10 mb-30">
          <div className="blog-img position-relative img-hover overflow-hidden round-10">
            <img src="/assets/img/blog/blog-6.jpg" alt="Image" className="transition round-10" />
          </div>
          <div className="blog-info">
            <ul className="blog-metainfo list-unstyled">
              <li>By <a href="/posts-by-author">MarineAegis Intelligence Team</a></li>
              <li><a href="/posts-by-date">22 Aug, 2026</a></li>
            </ul>
            <h3 className="fs-20 fw-semibold"><a href="/blog-single-right-sidebar" className="text-black link-hover-primary transition">Onboard Network Security Practices For Connected Fleets</a></h3>
            <a href="/blog-single-right-sidebar" className="link style-two fw-semibold">Read More<i className="ri-arrow-right-line" /></a>
          </div>
        </div>
      </div>
      <div className="col-xxl-3 col-xl-4 col-md-6" data-cue="slideInUp">
        <div className="blog-card style-two img-hover-wrap round-10 mb-30">
          <div className="blog-img position-relative img-hover overflow-hidden round-10">
            <img src="/assets/img/blog/blog-7.jpg" alt="Image" className="transition round-10" />
          </div>
          <div className="blog-info">
            <ul className="blog-metainfo list-unstyled">
              <li>By <a href="/posts-by-author">MarineAegis Intelligence Team</a></li>
              <li><a href="/posts-by-date">25 Aug, 2026</a></li>
            </ul>
            <h3 className="fs-20 fw-semibold"><a href="/blog-single-right-sidebar" className="text-black link-hover-primary transition">Why Zero Trust Matters For Remote Vessel Operations</a></h3>
            <a href="/blog-single-right-sidebar" className="link style-two fw-semibold">Read More<i className="ri-arrow-right-line" /></a>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Blog Section End */}</>
    </PageLayout>
  );
}
