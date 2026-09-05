import PageLayout from "../components/layout/PageLayout.jsx";

export default function ProjectSingle() {
  return (
    <PageLayout pageSlug="project-single" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="inner">
<>{/* Breadcrumb Start */}
  <div className="breadcrumb-area bg-f round-20 position-relative z-1">
    <div className="container text-center">
      <ul className="br-menu text-center bg_secondary d-inline-block list-unstyled mb-15">
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/">HOME</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/projects">PROJECTS</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block">PROJECT SINGLE</li>
      </ul>
      <h2 className="section-title style-one fw-medium font-secondary text-black text-center mb-6">Project Single</h2>
    </div>
  </div>
  {/* Breadcrumb End */}
  {/* Project Details Start */}
  <div className="container style-one ptb-130">
    <div className="row">
      <div className="col-xl-8">
        <div className="project-desc">
          <div className="single-para">
            <h1 className="font-secondary fw-medium">Detecting GPS Spoofing Before It Redirects An Autonomous Vessel</h1>
          </div>
          <div className="service-img round-10 mb-35">
            <img src="/assets/img/projects/single-project-1.jpg" alt="Image" className="round-10" />
          </div>
          <div className="single-para">
            <p>MarineAegis worked with a fleet operator to detect false GPS positions by comparing navigation signals with AIS, heading, speed, route, and physical vessel movement. The goal was to stop spoofed data before it changed course or endangered operations.</p>
          </div>
          <div className="single-para">
            <h6 className="fw-bold">Project Overview</h6>
            <p>The deployment unified bridge telemetry and cyber signals in one intelligence layer. When reported position diverged from trusted movement context, operators received a plain-language alert and an evidence-backed safe action recommendation.</p>
          </div>
          <div className="single-para">
            <h6 className="font-bold">The Solution</h6>
            <p>We built a navigation integrity workflow using live and historical vessel telemetry. Key capabilities included:</p>
            <ul className="feature-list style-one list-unstyled">
              <li className="position-relative fw-medium text-title"><i className="ri-arrow-right-line" />Cross-checking GPS, AIS, heading, speed, and route</li>
              <li className="position-relative fw-medium text-title"><i className="ri-arrow-right-line" />Behavior baselines and multi-sensor anomaly scoring</li>
              <li className="position-relative fw-medium text-title"><i className="ri-arrow-right-line" />Secure edge processing for intermittent connectivity</li>
              <li className="position-relative fw-medium text-title"><i className="ri-arrow-right-line" />Real-time risk dashboards for bridge and fleet teams</li>
              <li className="position-relative fw-medium text-title"><i className="ri-arrow-right-line" />Integration with bridge and fleet operations systems</li>
            </ul>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="service-img round-5 mb-35">
                <img src="/assets/img/projects/single-project-2.jpg" alt="Image" className="round-5" />
              </div>
            </div>
            <div className="col-md-6">
              <div className="service-img round-5 mb-35">
                <img src="/assets/img/projects/single-project-3.jpg" alt="Image" className="round-5" />
              </div>
            </div>
          </div>
          <div className="single-para">
            <h6 className="fw-bold">Technologies used</h6>
            <ul className="feature-list style-one list-unstyled">
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">Python  -</span>Core language for telemetry processing and detection logic</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">Scikit-learn &amp; XGBoost  -</span> For predictive modeling and algorithm optimization</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">Pandas &amp; NumPy  -</span> For structured data manipulation and transformation</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">Jupyter Note book  -</span> For exploratory data analysis and prototyping</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">AWS Sage Maker  -</span> For model training, hosting, and deployment in a secure cloud environment</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">PostgreSQL  -</span> To manage vessel events, evidence, and processed telemetry</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title">Apache Airflow  -</span> For automating data pipelines and model retraining workflows</li>
            </ul>
          </div>
          <div className="wp-blockquote round-10">
            <p className="text-title fw-medium">"MarineAegis exposed the spoofed position early and gave our bridge team a safe, explainable response path."</p>
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <div className="client-info">
                <h5 className="fs-18 fw-semibold mb-1">Captain Sarah Bennett</h5>
                <span className="fs-15">Fleet Operations Director</span>
              </div>
              <img src="/assets/img/icons/quote-white-large.svg" alt="Icon" />
            </div>
          </div>
          <div className="single-para">
            <h6 className="fw-bold">Key Benefits</h6>
            <ul className="feature-list style-one list-unstyled mb-0">
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title d-block">Faster Spoofing Detection</span>Detected inconsistent navigation signals before route control was affected.</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title d-block">Faster Operator Intervention</span>Gave bridge teams real-time evidence to verify position and act safely.</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title d-block">Multi-Sensor Confidence Scoring</span>Combined independent vessel signals to reduce false positives and alert fatigue.</li>
              <li className="position-relative"><i className="ri-arrow-right-line" /><span className="fw-medium text-title d-block">Unified Ship System Integration</span>Integrated with existing bridge and fleet workflows with minimal operational disruption.</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="col-xl-4 ps-xxl-5">
        <div className="sidebar mt-lg-50">
          <div className="sidebar-widget round-10 mb-35">
            <h3 className="sidebar-widget-title fs-18 fw-semibold text-black mb-20">Deployment Information</h3>
            <ul className="feature-list style-two list-unstyled mb-0">
              <li className="position-relative"><span className="text-title fw-medium me-1">Category:</span>Autonomous Vessels</li>
              <li className="position-relative"><span className="text-title fw-medium me-1">Operator:</span>&nbsp;Atlantic Fleet Group</li>
              <li className="position-relative"><span className="text-title fw-medium me-1">Start Date:</span>20/07/2026</li>
              <li className="position-relative"><span className="text-title fw-medium me-1">Ending:</span>30/09/2026</li>
              <li className="position-relative"><span className="text-title fw-medium me-1">Location:</span>South United Kingdom</li>
              <li className="position-relative"><span className="text-title fw-medium me-1">Duration:</span>2 Months</li>
              <li className="position-relative"><span className="text-title fw-medium me-1">Scope:</span>Fleet Pilot</li>
              <li className="position-relative"><span className="text-title fw-medium me-1">Website:</span>www.marineaegis.com</li>
            </ul>
          </div>
          <div className="promo-widget style-one bg-f d-flex flex-column justify-content-end align-items-start round-10">
            <h3 className="fw-semibold text-white"><a href="/service-details" className="text-white link-hover-white transition">Maritime Cyber Defense Consulting</a></h3>
            <p className="text-offwhite mb-0">Connected vessels require trusted intelligence that connects cyber risk with navigation safety and operational action.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Project Details End */}</>
    </PageLayout>
  );
}
