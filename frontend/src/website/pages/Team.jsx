import PageLayout from "../components/layout/PageLayout.jsx";

export default function Team() {
  return (
    <PageLayout pageSlug="team" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="inner">
<>{/* Breadcrumb Start */}
  <div className="breadcrumb-area bg-f round-20 position-relative z-1">
    <div className="container text-center">
      <ul className="br-menu text-center bg_secondary d-inline-block list-unstyled mb-15">
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/">HOME</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block">TEAM</li>
      </ul>
      <h2 className="section-title style-one fw-medium font-secondary text-black text-center mb-6">Team</h2>
    </div>
  </div>
  {/* Breadcrumb End */}
  {/* Team Section Start */}
  <div className="container style-one ptb-130">
    <div className="row">
      <div className="col-xl-8 offset-xl-2 col-md-10 offset-md-1 text-center">
        <span className="section-subtitle style-two d-inline-block text_primary fw-bold fs-14 ls-15 mb-12">TEAM MEMBER</span>
        <h2 className="section-title style-one fw-medium text-center text-title mb-40 px-xxl-5">Meet&nbsp;The Team&nbsp;Building Autonomous Maritime Cyber Defense</h2>
      </div>
    </div>
    <div className="row justify-content-center">
      <div className="col-xl-3 col-lg-4 col-md-6">
        <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10 mb-35">
          <div className="team-member-bg bg-1 position-absolute top-0 start-0 w-100 h-100 transition" />
          <div className="team-thumb rounded-circle mx-auto">
            <img src="/assets/img/team/team-thumb-1.jpg" alt="Image" className="rounded-circle transition" />
          </div>
          <div className="team-info position-relative z-1">
            <h3 className="fs-20 fw-semibold text-title transition">Tanvi Ithape</h3>
            <span className="fs-15 d-block transition">Chief Maritime Defense Strategist</span>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-lg-4 col-md-6">
        <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10 mb-35">
          <div className="team-member-bg bg-2 position-absolute top-0 start-0 w-100 h-100 transition" />
          <div className="team-thumb rounded-circle mx-auto">
            <img src="/assets/img/team/team-thumb-2.jpg" alt="Image" className="rounded-circle transition" />
          </div>
          <div className="team-info position-relative z-1">
            <h3 className="fs-20 fw-semibold text-title transition">Yash Hule</h3>
            <span className="fs-15 d-block transition">Director of Operations</span>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-lg-4 col-md-6">
        <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10 mb-35">
          <div className="team-member-bg bg-3 position-absolute top-0 start-0 w-100 h-100 transition" />
          <div className="team-thumb rounded-circle mx-auto">
            <img src="/assets/img/team/team-thumb-3.jpg" alt="Image" className="rounded-circle transition" />
          </div>
          <div className="team-info position-relative z-1">
            <h3 className="fs-20 fw-semibold text-title transition">Aditya Gunjal</h3>
            <span className="fs-15 d-block transition">Autonomous Vessel Security Manager</span>
          </div>
        </div>
      </div>
      {/* Additional team cards kept for future use.
      <div className="col-xl-3 col-lg-4 col-md-6">
        <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10 mb-35">
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
      <div className="col-xl-3 col-lg-4 col-md-6">
        <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10 mb-35">
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
      <div className="col-xl-3 col-lg-4 col-md-6">
        <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10 mb-35">
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
      <div className="col-xl-3 col-lg-4 col-md-6">
        <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10 mb-35">
          <div className="team-member-bg bg-7 position-absolute top-0 start-0 w-100 h-100 transition" />
          <div className="team-thumb rounded-circle mx-auto">
            <img src="/assets/img/team/team-thumb-7.jpg" alt="Image" className="rounded-circle transition" />
          </div>
          <div className="team-info position-relative z-1">
            <h3 className="fs-20 fw-semibold text-title transition">Carlos Mendes</h3>
            <span className="fs-15 d-block transition">Director of Innovation</span>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-lg-4 col-md-6">
        <div className="team-card style-one position-relative z-1 overflow-hidden text-center round-10 mb-35">
          <div className="team-member-bg bg-8 position-absolute top-0 start-0 w-100 h-100 transition" />
          <div className="team-thumb rounded-circle mx-auto">
            <img src="/assets/img/team/team-thumb-8.jpg" alt="Image" className="rounded-circle transition" />
          </div>
          <div className="team-info position-relative z-1">
            <h3 className="fs-20 fw-semibold text-title transition">Tom Richards</h3>
            <span className="fs-15 d-block transition">Chief Operating Officer</span>
          </div>
        </div>
      </div>
      */}
    </div>
    <div className="pagination-area d-flex align-items-center justify-content-center mt-xl-5">
      <span className="page-numbers d-flex flex-column align-items-center justify-content-center rounded-circle" aria-current="page"><img src="/assets/img/icons/left-arrow-blue.svg" alt="Icon" /></span>
      <span className="page-numbers current d-flex flex-column align-items-center justify-content-center rounded-circle" aria-current="page">01</span>
      <a href="/team" className="page-numbers d-flex flex-column align-items-center justify-content-center rounded-circle">02</a>
      <a href="/team" className="page-numbers d-flex flex-column align-items-center justify-content-center rounded-circle">03</a>
      <a href="/team" className="page-numbers d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/right-arrow-blue-2.svg" alt="Icon" /></a>
    </div>
  </div>
  {/* Team Section End */}</>
    </PageLayout>
  );
}


