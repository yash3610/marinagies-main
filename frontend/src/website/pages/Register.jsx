import PageLayout from "../components/layout/PageLayout.jsx";

export default function Register() {
  return (
    <PageLayout pageSlug="register" title="MarineAegis - Autonomous Maritime Cyber Defense" variant="inner">
<>{/* Breadcrumb Start */}
  <div className="breadcrumb-area bg-f round-20 position-relative z-1">
    <div className="container text-center">
      <ul className="br-menu text-center bg_secondary d-inline-block list-unstyled mb-15">
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block"><a href="/">HOME</a></li>
        <li className="position-relative fs-13 fw-semibold ls-1 d-inline-block">REGISTER</li>
      </ul>
      <h2 className="section-title style-one fw-medium font-secondary text-black text-center mb-6">Register</h2>
    </div>
  </div>
  {/* Breadcrumb End */}
  {/* Account Section Start */}
  <div className="container ptb-130">
    <div className="account-wrap style-two bg-f position-relative z-1">
      <div className="row">
        <div className="col-lg-6">
          <div className="account-box round-10">
            <h4 className="fs-20 fw-semibold text-center mb-2">Register Your Account</h4>
            <p className="text-center mb-22">Create your secure MarineAegis operator account</p>
            <a href="https://www.gmail.com/" target="_blank" className="btn style-11 fw-medium w-block d-block text-center mx-xl-5"><img src="/assets/img/icons/google.svg" alt="Google" />Login With Google</a>
            <div className="or-text text-center position-relative"><span>Or</span></div>
            <form action="#" className="form-wrapper style-two">
              <div className="form-group mb-20">
                <input type="text" placeholder="Name*" className="w-100 border-0 round-10 outline-0 text-para" />
              </div>
              <div className="form-group mb-20">
                <input type="email" placeholder="Email Address*" className="w-100 border-0 round-10 outline-0 text-para" />
              </div>
              <div className="form-group mb-20">
                <input type="password" placeholder="Password*" className="w-100 border-0 round-10 outline-0 text-para" />
              </div>
              <div className="form-group mb-20">
                <input type="password" placeholder="Confirm Password*" className="w-100 border-0 round-10 outline-0 text-para" />
              </div>
              <div className="form-check checkbox style-two mb-25">
                <input className="form-check-input" type="checkbox" id="test_20" />
                <label className="form-check-label text-para" htmlFor="test_20">
                  I've read and agree to the <a href="/terms-conditions" className="text_primary link-hover-primary">Terms &amp; Conditions</a> and <a href="/privacy-policy" className="text_primary link-hover-primary">Privacy Policy</a>
                </label>
              </div>
              <button className="btn style-12 position-relative z-1 w-100 fw-medium d-block border-0" type="submit">Register</button>
              <p className="mt-4 mb-0">Already have an account? <a href="/login" className="text_primary link-hover-primary">Login</a></p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Account Section End */}</>
    </PageLayout>
  );
}
