import PageLayout from "../components/layout/PageLayout.jsx";

export default function ServiceDetails() {
  return (
    <PageLayout pageSlug="service-details" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="inner">
<>{/* Breadcrumb Start */}
  <div className="breadcrumb-area bg-f round-20 position-relative z-1">
    <div className="container text-center">
      <ul className="br-menu text-center bg_secondary d-inline-block list-unstyled mb-15">
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/">HOME</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/">SERVICES</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block">SERVICE DETAILS</li>
      </ul>
      <h2 className="section-title style-one fw-medium font-secondary text-black text-center mb-6">Service Details</h2>
    </div>
  </div>
  {/* Breadcrumb End */}
  {/* Service Details Start */}
  <div className="container style-one ptb-130">
    <div className="row">
      <div className="col-xl-8">
        <div className="service-desc">
          <div className="single-para">
            <h1 className="font-secondary fw-medium">MarineAegis Unifies Navigation, Network, Command, And Recovery Intelligence For Safer Vessel Decisions</h1>
            <p>We protect connected and autonomous vessels by correlating navigation signals, onboard activity, remote commands, and operational context in real time.</p>
          </div>
          <div className="service-img round-10 mb-35">
            <img src="/assets/img/services/single-service-1.jpg" alt="Image" className="round-10" />
          </div>
          <div className="single-para">
            <p>Modern ships rely on connected navigation, satellite links, onboard networks, and remote control. MarineAegis watches these systems together so cyber events cannot silently become safety incidents.</p>
            <ul className="feature-list style-one list-unstyled">
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">Signal &amp; Telemetry Collection  -</span>We normalize GPS, AIS, network, device, and operational telemetry.</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">Behavior Baseline Development  -</span>We model normal vessel movement, commands, and onboard activity.</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">Defense Workflow Development  -</span>We build operator views, validation rules, and safe response workflows.
              </li><li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">Vessel Integration &amp; Deployment  -</span>We connect securely with existing bridge, IT, OT, and fleet systems.</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">Monitoring, Recovery &amp; Support  -</span>We tune detections, preserve incident evidence, and improve fleet resilience.</li>
            </ul>
          </div>
          <div className="single-para">
            <h4 className="font-secondary fw-medium">Navigation And Behavior Intelligence</h4>
            <p>MarineAegis correlates vessel movement, GPS and AIS consistency, device behavior, command origin, and fleet context to identify risks before they affect real-world operations.</p>
          </div>
          <div className="wp-blockquote round-10">
            <p className="text-title fw-medium">"MarineAegis gave our operations team one trusted picture of navigation, network, and command risk across the fleet."</p>
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <div className="client-info">
                <h5 className="fs-18 fw-semibold mb-1">Elena Marlow</h5>
                <span className="fs-15">Fleet Security Director</span>
              </div>
              <img src="/assets/img/icons/quote-white-large.svg" alt="Icon" />
            </div>
          </div>
          <div className="single-para">
            <h4 className="font-secondary fw-medium">Digital Twin Safe Action Testing</h4>
            <p>Potential containment and recovery actions can be tested against a vessel digital twin before execution, reducing operational risk during high-pressure incidents.</p>
          </div>
          <div className="single-para">
            <h4 className="font-secondary fw-medium">We're Here To Answer All Your Questions!</h4>
            <p>MarineAegis explains why a signal, command, or alert is suspicious and recommends safe actions in language operators can act on quickly.</p>
          </div>
          <div className="accordion style-two" id="accordionExample_one">
            <div className="accordion-item" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="true" aria-controls="collapseFour" role="button">
              <div className="accordion-header" id="headingFour">
                <div className="accordion-button">
                  <span className="accord-arrow">
                    <i className="ri-arrow-down-s-fill plus" />
                    <i className="ri-arrow-up-s-fill minus" />
                  </span>
                  Can MarineAegis Work With Existing Vessel Systems?
                </div>
              </div>
              <div id="collapseFour" className="accordion-collapse collapse show" aria-labelledby="headingFour" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">Yes. The platform integrates with existing navigation, satellite, IT, OT, edge, and fleet-management systems without replacing the entire vessel stack.</p>
                </div>
              </div>
            </div>
            <div className="accordion-item collapsed" data-bs-toggle="collapse" data-bs-target="#collapseFive" aria-expanded="false" aria-controls="collapseFive" role="button">
              <div className="accordion-header" id="headingFive">
                <div className="accordion-button">
                  <span className="accord-arrow">
                    <i className="ri-arrow-down-s-fill plus" />
                    <i className="ri-arrow-up-s-fill minus" />
                  </span>
                  How Quickly Can A Vessel Or Fleet Be Onboarded?
                </div>
              </div>
              <div id="collapseFive" className="accordion-collapse collapse " aria-labelledby="headingFive" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">Deployment begins with a controlled assessment of vessel systems, telemetry sources, operational limits, and fleet policies before monitoring is activated.</p>
                </div>
              </div>
            </div>
            <div className="accordion-item collapsed" data-bs-toggle="collapse" data-bs-target="#collapseSix" aria-expanded="false" aria-controls="collapseSix" role="button">
              <div className="accordion-header" id="headingSix">
                <div className="accordion-button">
                  <span className="accord-arrow">
                    <i className="ri-arrow-down-s-fill plus" />
                    <i className="ri-arrow-up-s-fill minus" />
                  </span>
                  Can MarineAegis Operate With Limited Connectivity?
                </div>
              </div>
              <div id="collapseSix" className="accordion-collapse collapse" aria-labelledby="headingSix" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">Core verification and protection continue on the vessel edge during limited connectivity, with evidence synchronized securely when communications return.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xl-4 ps-xxl-5">
        <div className="sidebar mt-lg-50">
          <div className="sidebar-widget round-10">
            <h3 className="sidebar-widget-title fs-18 fw-semibold text-black mb-20">Other Capabilities</h3>
            <ul className="service-category-list list-unstyled mb-0">
              <li><a href="/services">Navigation Signal Verification <i className="ri-arrow-right-line" /></a></li>
              <li><a href="/services">Onboard Network Monitoring<i className="ri-arrow-right-line" /></a></li>
              <li><a href="/services">Remote Command Validation <i className="ri-arrow-right-line" /></a></li>
              <li><a href="/services">Vendor Dependency Mapping <i className="ri-arrow-right-line" /></a></li>
              <li><a href="/services">Digital Twin Recovery Testing&nbsp; <i className="ri-arrow-right-line" /></a></li>
              <li><a href="/services">Incident Replay And Compliance <i className="ri-arrow-right-line" /></a></li>
            </ul>
          </div>
          <div className="docs-widget style-one bg-f d-flex flex-column align-items-center justify-content-between text-center round-10 mb-35">
            <div>
              <span className="fw-medium text_secondary d-block mb-2">Download</span>
              <h6 className="fs-24 fw-semibold text-white">Platform Brochure</h6>
            </div>
            <a href="/contact" className="btn style-seven fw-semibold position-relative round-oval" type="submit">Request Platform Brief<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/download-icon.svg" alt="Icon" /></span></a>
          </div>
          <div className="sidebar-widget round-10">
            <h3 className="sidebar-widget-title fs-18 fw-semibold text-black mb-20">Book A Maritime Security Assessment</h3>
            <form action="#" className="booking-form">
              <div className="form-group mb-10">
                <input type="text" className="w-100 ht-50 text-para outline-0 border-0" placeholder="Name" />
              </div>
              <div className="form-group mb-10">
                <input type="text" className="w-100 ht-50 text-para outline-0 border-0" placeholder="Name" />
              </div>
              <div className="form-group mb-10">
                <select className="w-100 ht-50 text-para outline-0 border-0">
                  <option value={0}>Service Type</option>
                  <option value={1}>Navigation Security</option>
                  <option value={2}>Autonomous Vessels</option>
                  <option value={3}>Threat Intelligence</option>
                </select>
              </div>
              <div className="form-group mb-10">
                <textarea className="w-100 text-para outline-0 border-0" placeholder="Messages" defaultValue={""} />
              </div>
              <button type="submit" className="btn style-six d-block w-100 fw-semibold position-relative round-oval">Send Message<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></button>
            </form>
          </div>
          <div className="promo-widget style-one bg-f d-flex flex-column justify-content-end align-items-start round-10">
            <h3 className="fw-semibold text-white"><a href="/service-details" className="text-white link-hover-white transition">Maritime Cyber Defense Consulting</a></h3>
            <p className="text-offwhite mb-0">Connected vessels require trusted intelligence that connects cyber risk with navigation safety and operational action.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Service Details End */}</>
    </PageLayout>
  );
}
