import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import FleetOverview from "./pages/FleetOverview";
import NavigationMap from "./pages/NavigationMap";
import RequireAuth from "./components/RequireAuth";
function WebsiteRedirect() {
  useEffect(() => { window.location.replace("/"); }, []);
  return null;
}
export default function App() {
  return <BrowserRouter><Routes>
    <Route element={<RequireAuth />}>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="fleet" element={<FleetOverview />} />
        <Route path="navigation" element={<NavigationMap />} />
      </Route>
    </Route>
    <Route path="*" element={<WebsiteRedirect />} />
  </Routes></BrowserRouter>;
}
