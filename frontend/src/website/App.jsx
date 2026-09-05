import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const AboutUs = lazy(() => import("./pages/AboutUs.jsx"));
const BlogGrid = lazy(() => import("./pages/BlogGrid.jsx"));
const BlogLeftSidebar = lazy(() => import("./pages/BlogLeftSidebar.jsx"));
const BlogRightSidebar = lazy(() => import("./pages/BlogRightSidebar.jsx"));
const BlogSingleRightSidebar = lazy(() => import("./pages/BlogSingleRightSidebar.jsx"));
const CareerSingle = lazy(() => import("./pages/CareerSingle.jsx"));
const Careers = lazy(() => import("./pages/Careers.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Error404 = lazy(() => import("./pages/Error404.jsx"));
const Faq = lazy(() => import("./pages/Faq.jsx"));
const Index2 = lazy(() => import("./pages/Index2.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.jsx"));
const ProjectSingle = lazy(() => import("./pages/ProjectSingle.jsx"));
const Projects = lazy(() => import("./pages/Projects.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ServiceDetails = lazy(() => import("./pages/ServiceDetails.jsx"));
const Services = lazy(() => import("./pages/Services.jsx"));
const Team = lazy(() => import("./pages/Team.jsx"));
const TermsConditions = lazy(() => import("./pages/TermsConditions.jsx"));
const Testimonials = lazy(() => import("./pages/Testimonials.jsx"));

function LoadingPage() {
  return (
    <div className="preloader-area" id="preloader">
      <div className="spinner"><div /><div /><div /><div /><div /></div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        <Route path="/" element={<Index2 />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/blog-grid" element={<BlogGrid />} />
        <Route path="/blog-left-sidebar" element={<BlogLeftSidebar />} />
        <Route path="/blog-right-sidebar" element={<BlogRightSidebar />} />
        <Route path="/blog-single-right-sidebar" element={<BlogSingleRightSidebar />} />
        <Route path="/career-single" element={<CareerSingle />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/login" element={<Login />} />
        <Route path="/posts-by-author" element={<Navigate to="/blog-grid" replace />} />
        <Route path="/posts-by-category" element={<Navigate to="/blog-grid" replace />} />
        <Route path="/posts-by-date" element={<Navigate to="/blog-grid" replace />} />
        <Route path="/posts-by-tag" element={<Navigate to="/blog-grid" replace />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/project-single" element={<ProjectSingle />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/register" element={<Register />} />
        <Route path="/service-details" element={<ServiceDetails />} />
        <Route path="/services" element={<Services />} />
        <Route path="/team" element={<Team />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </Suspense>
  );
}
