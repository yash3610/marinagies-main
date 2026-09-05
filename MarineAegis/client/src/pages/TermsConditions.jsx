import PageLayout from "../components/layout/PageLayout.jsx";

export default function TermsConditions() {
  return (
    <PageLayout pageSlug="terms-conditions" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="inner">
<>{/* Breadcrumb Start */}
  <div className="breadcrumb-area bg-f round-20 position-relative z-1">
    <div className="container text-center">
      <ul className="br-menu text-center bg_secondary d-inline-block list-unstyled mb-15">
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/">HOME</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block">TERMS &amp; CONDITIONS</li>
      </ul>
      <h2 className="section-title style-one fw-medium font-secondary text-black text-center mb-6">Terms &amp; Conditions</h2>
    </div>
  </div>
  {/* Breadcrumb End */}
  {/* Terms Section start */}
  <div className="terms-wrap ptb-130">
    <div className="container style-one"><div className="row"><div className="col-xl-10 offset-xl-1">
      <div className="single-para"><h3>Platform Use</h3><p>MarineAegis provides maritime cyber defense, navigation verification, command validation, fleet intelligence, and incident recovery. Access is limited to authorized users acting for an approved organization.</p></div>
      <div className="single-para"><h3>Operational Responsibilities</h3><p>MarineAegis supports safer decisions but does not replace the legal authority, professional judgment, or safety obligations of vessel masters, fleet operators, and other responsible personnel.</p><ol><li>Users must provide accurate integration and operational information.</li><li>Accounts and credentials must be protected from unauthorized access.</li><li>Recommended actions must be evaluated against vessel conditions and approved procedures.</li><li>The platform must not be used to interfere with vessels, signals, networks, or systems without authorization.</li></ol></div>
      <div className="single-para"><h3>Ownership And Authorized Data</h3><p>MarineAegis retains ownership of its platform, software, documentation, and intellectual property. Customers retain ownership of their vessel, fleet, and organizational data.</p><p>Customers confirm they have authority to provide telemetry and other information used by the platform.</p></div>
      <div className="single-para"><h3>Service Availability</h3><p>Platform availability, support, data retention, integrations, and service levels are governed by the applicable customer agreement. Maritime connectivity limitations may affect cloud synchronization while supported edge protections continue locally.</p></div>
      <div className="single-para"><h3>Limitation Of Liability</h3><p>To the extent permitted by law, liability is governed by the applicable agreement. MarineAegis does not guarantee that every threat, false signal, harmful command, or operational incident can be detected or prevented.</p></div>
      <div className="single-para"><h3>Accounts And Security</h3><p>Users are responsible for activity under their accounts and must promptly report suspected compromise. MarineAegis may restrict access when needed to protect customers, vessels, the platform, or legal compliance.</p><p>These website terms may be updated as the platform, laws, and maritime requirements evolve. Customer contracts take precedence where they contain different terms.</p></div>
    </div></div></div>
  </div>
  {/* Terms Section end */}</>
    </PageLayout>
  );
}
