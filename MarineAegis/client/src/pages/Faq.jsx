import PageLayout from "../components/layout/PageLayout.jsx";

export default function Faq() {
  return (
    <PageLayout pageSlug="faq" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="inner">
<>{/* Breadcrumb Start */}
  <div className="breadcrumb-area bg-f round-20 position-relative z-1">
    <div className="container text-center">
      <ul className="br-menu text-center bg_secondary d-inline-block list-unstyled mb-15">
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/">HOME</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block">FAQ</li>
      </ul>
      <h2 className="section-title style-one fw-medium font-secondary text-black text-center mb-6">FAQ</h2>
    </div>
  </div>
  {/* Breadcrumb End */}
  {/* FAQ Section Start */}
  <div className="container style-one ptb-130">
    <div className="row">
      <div className="col-xl-5 col-lg-6 mb-md-30">
        <div className="faq-bg bg-f d-flex flex-column justify-content-end round-10">
          <h6 className="text-white">Answers To Common Questions About Maritime Cyber Defense And Vessel Integration</h6>
        </div>
      </div>
      <div className="col-xl-7 col-lg-6">
        <div className="faq-box style-one round-10">
          <div className="accordion style-three" id="accordionExample_one">
            <div className="accordion-item" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="true" aria-controls="collapseFour" role="button">
              <div className="accordion-header" id="headingFour">
                <div className="accordion-button">
                  <span className="accord-arrow">
                    <i className="ri-arrow-down-s-fill plus" />
                    <i className="ri-arrow-up-s-fill minus" />
                  </span>
                  <span className="text_primary fw-semibold me-2">01 .</span> What Vessel Systems Does MarineAegis Protect?
                </div>
              </div>
              <div id="collapseFour" className="accordion-collapse collapse show" aria-labelledby="headingFour" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">MarineAegis protects navigation, satellite communications, onboard IT and OT networks, edge devices, remote command channels, distress workflows, and fleet operations.</p>
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
                  <span className="text_primary fw-semibold me-2">02 .</span> 
                  How Does MarineAegis Detect GPS Or AIS Spoofing?
                </div>
              </div>
              <div id="collapseFive" className="accordion-collapse collapse " aria-labelledby="headingFive" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">It compares GPS and AIS reports with heading, speed, route, timing, and physical movement. Conflicts increase risk confidence and trigger an explainable navigation-integrity alert.</p>
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
                  <span className="text_primary fw-semibold me-2">03 .</span> 
                  Can MarineAegis Integrate With Existing Ship Systems?
                </div>
              </div>
              <div id="collapseSix" className="accordion-collapse collapse" aria-labelledby="headingSix" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">Yes. MarineAegis connects with existing bridge, navigation, satellite, IT, OT, and fleet systems through controlled integrations designed to avoid operational disruption.</p>
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
                  <span className="text_primary fw-semibold me-2">04 .</span> 
                  Does The Platform Work On Autonomous Vessels?
                </div>
              </div>
              <div id="collapseOne" className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">Yes. Edge-based monitoring and command guardrails help autonomous or remotely operated vessels validate signals and react safely when no onboard expert is available.</p>
                </div>
              </div>
            </div>
            <div className="accordion-item  collapsed" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2" role="button">
              <div className="accordion-header" id="heading_2">
                <div className="accordion-button">
                  <span className="accord-arrow">
                    <i className="ri-arrow-down-s-fill plus" />
                    <i className="ri-arrow-up-s-fill minus" />
                  </span>
                  <span className="text_primary fw-semibold me-2">05 .</span> 
                  How Are Remote Commands Validated?
                </div>
              </div>
              <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="heading_2" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">Each command is checked for identity, authorization, timing, vessel state, route context, and expected behavior before it is allowed to reach operational systems.</p>
                </div>
              </div>
            </div>
            <div className="accordion-item  collapsed" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3" role="button">
              <div className="accordion-header" id="heading_3">
                <div className="accordion-button">
                  <span className="accord-arrow">
                    <i className="ri-arrow-down-s-fill plus" />
                    <i className="ri-arrow-up-s-fill minus" />
                  </span>
                  <span className="text_primary fw-semibold me-2">06 .</span> 
                  Can MarineAegis Work With Limited Connectivity?
                </div>
              </div>
              <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="heading_3" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">Yes. Critical monitoring and safety logic can continue at the edge during degraded satellite or network connectivity, then synchronize evidence when communications return.</p>
                </div>
              </div>
            </div>
            <div className="accordion-item  collapsed" data-bs-toggle="collapse" data-bs-target="#collapse_30" aria-expanded="false" aria-controls="collapse_30" role="button">
              <div className="accordion-header" id="heading_30">
                <div className="accordion-button">
                  <span className="accord-arrow">
                    <i className="ri-arrow-down-s-fill plus" />
                    <i className="ri-arrow-up-s-fill minus" />
                  </span>
                  <span className="text_primary fw-semibold me-2">07 .</span> 
                  How Does Incident Recovery And Replay Work?
                </div>
              </div>
              <div id="collapse_30" className="accordion-collapse collapse" aria-labelledby="heading_30" data-bs-parent="#accordionExample_one">
                <div className="accordion-body">
                  <p className="text-para fs-xx-14">MarineAegis preserves a replayable incident timeline, tests recovery actions against a digital twin, and records evidence for investigation, lessons learned, and compliance.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* FAQ Section End */}
  <div className="move-text-wrapper overflow-hidden mb-120">
    <div className="move-text style-seven position-relative z-1">
      <ul className="list-unstyled mb-0">
        <li className="position-relative font-secondary fw-normal">ONE MARITIME PLATFORM BUILT TO VERIFY, DEFEND, EXPLAIN, AND RECOVER VESSEL OPERATIONS </li>
        <li className="position-relative font-secondary fw-normal">ONE MARITIME PLATFORM BUILT TO VERIFY, DEFEND, EXPLAIN, AND RECOVER VESSEL OPERATIONS </li>
        <li className="position-relative font-secondary fw-normal">ONE MARITIME PLATFORM BUILT TO VERIFY, DEFEND, EXPLAIN, AND RECOVER VESSEL OPERATIONS </li>
      </ul>
    </div>
  </div>
  {/* Integration Section Start */}
  <div className="integration-area style-two position-relative overflow-hidden round-10 z-1">
    <div className="container style-one ptb-130">
      <div className="row">
        <div className="col-xl-8 offset-xl-2 col-md-10 offset-md-1 text-center">
          <span className="section-subtitle d-inline-block text_primary fw-bold fs-14 ls-15 mb-12" data-cue="slideInUp">INTEGRATIONS</span>
          <h2 className="section-title style-one fw-medium text-center text-title mb-50 px-xxl-5 mx-xxl-5" data-cue="slideInUp" data-delay={300}>A Maritime Defense Platform That Works Across Your Vessel Ecosystem</h2>
        </div>
      </div>
      <div className="integration-wrapper style-one position-relative z-1">
        <img src="/assets/img/about/integration-line.png" alt="Shape" className="intg-line position-absolute z-n1 sm-none" />
        <div className="row align-items-center">
          <div className="col-lg-4 col-md-5 pe-xxl-0">
            <div className="int-box-wrapper style-one">
              <div className="int-box" data-cue="bounceIn">
                <img src="/assets/img/about/ms.png" alt="Icon" className="round-10" />
              </div>
              <div className="int-box" data-cue="bounceIn" data-delay={200}>
                <img src="/assets/img/about/drive.png" alt="Icon" className="round-10" />
              </div>
              <div className="int-box" data-cue="bounceIn" data-delay={300}>
                <img src="/assets/img/about/slack.png" alt="Icon" className="round-10" />
              </div>
              <div className="int-box" data-cue="bounceIn" data-delay={400}>
                <img src="/assets/img/about/discord.png" alt="Icon" className="round-10" />
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-2">
            <div className="int-logo">
              <img src="/assets/img/about/integration-circle-2.png" alt="Shape" className="d-block mx-auto" />
            </div>
          </div>
          <div className="col-lg-4 col-md-5">
            <div className="int-box-wrapper style-two">
              <div className="int-box" data-cue="bounceIn" data-delay={200}>
                <img src="/assets/img/about/git.png" alt="Icon" className="round-10" />
              </div>
              <div className="int-box" data-cue="bounceIn" data-delay={300}>
                <img src="/assets/img/about/teams.png" alt="Icon" className="round-10" />
              </div>
              <div className="int-box" data-cue="bounceIn" data-delay={500}>
                <img src="/assets/img/about/chatgpt.png" alt="Icon" className="round-10" />
              </div>
              <div className="int-box" data-cue="bounceIn" data-delay={400}>
                <img src="/assets/img/about/onedrive.png" alt="Icon" className="round-10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Integration Section End */}
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
  {/* Brand Section End */}</>
    </PageLayout>
  );
}


