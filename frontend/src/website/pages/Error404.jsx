import PageLayout from "../components/layout/PageLayout.jsx";

export default function Error404() {
  return (
    <PageLayout pageSlug="error-404" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="inner">
<>{/* Error Section Start */}
  <div className="error-wrap pt-130 pb-130">
    <div className="container-fluid">
      <div className="row">
        <div className="col-xl-10 offset-xl-1 ps-xl-0 text-center">
          <img src="/assets/img/error.png" alt="Iamge" className="mx-auto d-block mb-40" />
          <h3 className="fs-24 fw-bold font-primary text-title mt-5 mb-40">This MarineAegis page could not be found</h3>
          <a href="/" className="btn style-three fw-semibold position-relative round-oval" type="submit">Back To Home<span className="position-absolute top-0 end-0 h-100 d-flex flex-column align-items-center justify-content-center"><img src="/assets/img/icons/right-arrow-white.svg" alt="Icon" /></span></a>
        </div>
      </div>
    </div>
  </div>
  {/* Error Section End */}</>
    </PageLayout>
  );
}

