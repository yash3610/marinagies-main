import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import FleetOverview from "./pages/FleetOverview";
import NavigationMap from "./pages/NavigationMap";
import RequireAuth from "./components/RequireAuth";
import LiveMonitoring from "./pages/LiveMonitoring";
import SOC from "./pages/SOC";
import Alerts from "./pages/Alerts";
import Incidents from "./pages/Incidents";
import DigitalTwin from "./pages/DigitalTwin";
import Reports from "./pages/Reports";
import Devices from "./pages/Devices";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";

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
        <Route path="monitoring" element={<LiveMonitoring />} />
        <Route path="navigation" element={<NavigationMap />} />
        <Route path="soc" element={<SOC />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="digital-twin" element={<DigitalTwin />} />
        <Route path="reports" element={<Reports />} />
        <Route path="devices" element={<Devices />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>
    </Route>
    <Route path="*" element={<WebsiteRedirect />} />
  </Routes></BrowserRouter>;
}
