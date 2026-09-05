import PageLayout from "../components/layout/PageLayout.jsx";

export default function PrivacyPolicy() {
  return (
    <PageLayout pageSlug="privacy-policy" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="inner">
<>{/* Breadcrumb Start */}
  <div className="breadcrumb-area bg-f round-20 position-relative z-1">
    <div className="container text-center">
      <ul className="br-menu text-center bg_secondary d-inline-block list-unstyled mb-15">
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/">HOME</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block">PRIVACY POLICY</li>
      </ul>
      <h2 className="section-title style-one fw-medium font-secondary text-black text-center mb-6">Privacy Policy</h2>
    </div>
  </div>
  {/* Breadcrumb End */}
  {/* Privacy Policy Section start */}
  <div className="terms-wrap ptb-130">
    <div className="container"><div className="row gx-5"><div className="col-lg-12">
      <div className="single-para"><h3>Information We Collect</h3><p>MarineAegis may collect contact, account, organization, support, and website usage information when operators request a demonstration, create an account, submit a form, or communicate with our team.</p><p>When the platform is deployed, authorized customers control the vessel, network, device, navigation, command, and incident telemetry provided for maritime defense operations.</p></div>
      <div className="single-para"><h3>How We Use Cookies</h3><p>We use necessary cookies for secure sessions and site operation, and limited analytics cookies to understand performance and improve the MarineAegis experience. Available preferences can be managed through browser settings.</p></div>
      <div className="single-para"><h3>How We Use Information</h3><p>Information is used to provide and secure the platform, validate access, respond to requests, improve detections, support incident investigations, maintain compliance evidence, and communicate relevant service updates.</p></div>
      <div className="single-para"><h3>Data Protection</h3><p>MarineAegis applies access controls, encryption, monitoring, evidence integrity safeguards, and retention policies designed for sensitive maritime and operational data.</p><p>Access to customer telemetry is limited to authorized personnel and approved service providers with a legitimate operational purpose.</p></div>
      <div className="single-para"><h3>Data Sharing And Retention</h3><p>We do not sell personal or vessel operational data. Information may be shared with approved infrastructure providers, legal authorities when required, or parties authorized by the customer.</p><ol><li>Personal information is retained only for documented business, security, and legal needs.</li><li>Operational telemetry retention follows the customer agreement and configured fleet policy.</li><li>Incident evidence may be preserved longer when required for investigation or compliance.</li><li>Customers may contact MarineAegis to request access, correction, or deletion where applicable.</li></ol></div>
      <div className="single-para"><h3>Children Privacy</h3><p>MarineAegis services are designed for maritime organizations and professional operators. We do not knowingly collect personal information from children under 18.</p></div>
    </div></div></div>
  </div>
  {/* Privacy Policy Section end */}</>
    </PageLayout>
  );
}

