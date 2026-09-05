import PageLayout from "../components/layout/PageLayout.jsx";

export default function BlogGrid() {
  return (
    <PageLayout pageSlug="blog-grid" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="inner">
<>{/* Breadcrumb Start */}
  <div className="breadcrumb-area bg-f round-20 position-relative z-1">
    <div className="container text-center">
      <ul className="br-menu text-center bg_secondary d-inline-block list-unstyled mb-15">
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/">HOME</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block">BLOG</li>
      </ul>
      <h2 className="section-title style-one fw-medium font-secondary text-black text-center mb-6">Blog</h2>
    </div>
  </div>
  {/* Breadcrumb End */}
  {/* Blog Section Start */}
  <div className="container style-one ptb-130">
    <div className="row justify-content-center">
      <div className="col-xl-4 col-md-6" data-cue="slideInUp">
        <div className="blog-card style-one img-hover-wrap round-10 mb-30">
          <div className="blog-img position-relative img-hover overflow-hidden round-10">
            <img src="/assets/img/blog/blog-10.jpg" alt="Image" className="transition round-10" />
          </div>
          <div className="blog-info">
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <a className="blog-category fs-15 fw-medium d-inline-block round-oval" href="/blog-left-sidebar">Fleet Security</a>
              <ul className="blog-metainfo list-unstyled">
                <li>By <a href="/posts-by-author">MarineAegis Intelligence Team</a></li>
                <li><a href="/posts-by-date">12 Aug, 2026</a></li>
              </ul>
            </div>
            <h3 className="fs-20 fw-semibold"><a href="/blog-single-right-sidebar" className="text-black link-hover-primary transition">GPS Spoofing: How False Navigation Data Can Redirect A Vessel</a></h3>
            <a href="/blog-single-right-sidebar" className="link style-two fw-semibold">Read More<i className="ri-arrow-right-line" /></a>
          </div>
        </div>
      </div>
      <div className="col-xl-4 col-md-6" data-cue="slideInUp">
        <div className="blog-card style-one img-hover-wrap round-10 mb-30">
          <div className="blog-img position-relative img-hover overflow-hidden round-10">
            <img src="/assets/img/blog/blog-2.jpg" alt="Image" className="transition round-10" />
          </div>
          <div className="blog-info">
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <a className="blog-category fs-15 fw-medium d-inline-block round-oval" href="/blog-left-sidebar">Technology</a>
              <ul className="blog-metainfo list-unstyled">
                <li>By <a href="/posts-by-author">MarineAegis Intelligence Team</a></li>
                <li><a href="/posts-by-date">16 Aug, 2026</a></li>
              </ul>
            </div>
            <h3 className="fs-20 fw-semibold"><a href="/blog-single-right-sidebar" className="text-black link-hover-primary transition">Seven Ways Fleets Can Detect Onboard Network Threats</a></h3>
            <a href="/blog-single-right-sidebar" className="link style-two fw-semibold">Read More<i className="ri-arrow-right-line" /></a>
          </div>
        </div>
      </div>
      <div className="col-xl-4 col-md-6" data-cue="slideInUp">
        <div className="blog-card style-one img-hover-wrap round-10 mb-30">
          <div className="blog-img position-relative img-hover overflow-hidden round-10">
            <img src="/assets/img/blog/blog-11.jpg" alt="Image" className="transition round-10" />
          </div>
          <div className="blog-info">
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <a className="blog-category fs-15 fw-medium d-inline-block round-oval" href="/blog-left-sidebar">Agency</a>
              <ul className="blog-metainfo list-unstyled">
                <li>By <a href="/posts-by-author">MarineAegis Intelligence Team</a></li>
                <li><a href="/posts-by-date">22 Aug, 2026</a></li>
              </ul>
            </div>
            <h3 className="fs-20 fw-semibold"><a href="/blog-single-right-sidebar" className="text-black link-hover-primary transition">Securing Autonomous Vessels Against Machine-Speed Attacks</a></h3>
            <a href="/blog-single-right-sidebar" className="link style-two fw-semibold">Read More<i className="ri-arrow-right-line" /></a>
          </div>
        </div>
      </div>
      <div className="col-xl-4 col-md-6" data-cue="slideInUp">
        <div className="blog-card style-one img-hover-wrap round-10 mb-30">
          <div className="blog-img position-relative img-hover overflow-hidden round-10">
            <img src="/assets/img/blog/blog-12.jpg" alt="Image" className="transition round-10" />
          </div>
          <div className="blog-info">
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <a className="blog-category fs-15 fw-medium d-inline-block round-oval" href="/blog-left-sidebar">Autonomous Vessels</a>
              <ul className="blog-metainfo list-unstyled">
                <li>By <a href="/posts-by-author">MarineAegis Intelligence Team</a></li>
                <li><a href="/posts-by-date">26 Aug, 2026</a></li>
              </ul>
            </div>
            <h3 className="fs-20 fw-semibold"><a href="/blog-single-right-sidebar" className="text-black link-hover-primary transition">How Navigation Intelligence Improves Maritime Risk Decisions</a></h3>
            <a href="/blog-single-right-sidebar" className="link style-two fw-semibold">Read More<i className="ri-arrow-right-line" /></a>
          </div>
        </div>
      </div>
      <div className="col-xl-4 col-md-6" data-cue="slideInUp">
        <div className="blog-card style-one img-hover-wrap round-10 mb-30">
          <div className="blog-img position-relative img-hover overflow-hidden round-10">
            <img src="/assets/img/blog/blog-13.jpg" alt="Image" className="transition round-10" />
          </div>
          <div className="blog-info">
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <a className="blog-category fs-15 fw-medium d-inline-block round-oval" href="/blog-left-sidebar">Agency</a>
              <ul className="blog-metainfo list-unstyled">
                <li>By <a href="/posts-by-author">MarineAegis Intelligence Team</a></li>
                <li><a href="/posts-by-date">27 Aug, 2026</a></li>
              </ul>
            </div>
            <h3 className="fs-20 fw-semibold"><a href="/blog-single-right-sidebar" className="text-black link-hover-primary transition">Building Trust In Remote Commands Through Validation</a></h3>
            <a href="/blog-single-right-sidebar" className="link style-two fw-semibold">Read More<i className="ri-arrow-right-line" /></a>
          </div>
        </div>
      </div>
      <div className="col-xl-4 col-md-6" data-cue="slideInUp">
        <div className="blog-card style-one img-hover-wrap round-10 mb-30">
          <div className="blog-img position-relative img-hover overflow-hidden round-10">
            <img src="/assets/img/blog/blog-14.jpg" alt="Image" className="transition round-10" />
          </div>
          <div className="blog-info">
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <a className="blog-category fs-15 fw-medium d-inline-block round-oval" href="/blog-left-sidebar">Technology</a>
              <ul className="blog-metainfo list-unstyled">
                <li>By <a href="/posts-by-author">MarineAegis Intelligence Team</a></li>
                <li><a href="/posts-by-date">28 Aug, 2026</a></li>
              </ul>
            </div>
            <h3 className="fs-20 fw-semibold"><a href="/blog-single-right-sidebar" className="text-black link-hover-primary transition">From Signal To Safe Action With Maritime Digital Twins</a></h3>
            <a href="/blog-single-right-sidebar" className="link style-two fw-semibold">Read More<i className="ri-arrow-right-line" /></a>
          </div>
        </div>
      </div>
    </div>
    <div className="pagination-area d-flex align-items-center justify-content-center mt-xl-5">
      <span className="page-numbers d-flex flex-column align-items-center justify-content-center rounded-circle" aria-current="page"><img src="/assets/img/icons/left-arrow-blue.svg" alt="Icon" /></span>
      <span className="page-numbers current d-flex flex-column align-items-center justify-content-center rounded-circle" aria-current="page">01</span>
      <a href="/blog-right-sidebar" className="page-numbers d-flex flex-column align-items-center justify-content-center rounded-circle">02</a>
      <a href="/blog-right-sidebar" className="page-numbers d-flex flex-column align-items-center justify-content-center rounded-circle">03</a>
      <a href="/blog-right-sidebar" className="page-numbers d-flex flex-column align-items-center justify-content-center rounded-circle"><img src="/assets/img/icons/right-arrow-blue-2.svg" alt="Icon" /></a>
    </div>
  </div>
  {/* Blog Details Section End */}</>
    </PageLayout>
  );
}

