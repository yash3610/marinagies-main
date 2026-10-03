import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import FleetOverview from "./pages/FleetOverview";
import NavigationMap from "./pages/NavigationMap";
import RequireAuth from "./components/RequireAuth";
import RequirePermission from "./components/RequirePermission";
import LiveMonitoring from "./pages/LiveMonitoring";
import SOC from "./pages/SOC";
import Alerts from "./pages/Alerts";
import Incidents from "./pages/Incidents";
import DigitalTwin from "./pages/DigitalTwin";
import Reports from "./pages/Reports";
import EdgeArmor from "./pages/EdgeArmor";
import NetGuard from "./pages/NetGuard";
import AgentWatch from "./pages/AgentWatch";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import AttackSimulation from "./pages/AttackSimulation";

function WebsiteRedirect() {
  useEffect(() => { window.location.replace("/"); }, []);
  return null;
}

const permitted = (permission, page) => (
  <RequirePermission permission={permission}>{page}</RequirePermission>
);

export default function App() {
  return <BrowserRouter><Routes>
    <Route element={<RequireAuth />}>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={permitted("dashboard:view", <DashboardHome />)} />
        <Route path="fleet" element={permitted("vessels:view", <FleetOverview />)} />
        <Route path="monitoring" element={permitted("telemetry:view", <LiveMonitoring />)} />
        <Route path="navigation" element={permitted("navigation:view", <NavigationMap />)} />
        <Route path="attack-simulation" element={permitted("attack-simulation:view", <AttackSimulation />)} />
        <Route path="soc" element={permitted("security-operations:view", <SOC />)} />
        <Route path="alerts" element={permitted("alerts:view", <Alerts />)} />
        <Route path="incidents" element={permitted("incidents:view", <Incidents />)} />
        <Route path="digital-twin" element={permitted("digital-twin:view", <DigitalTwin />)} />
        <Route path="reports" element={permitted("reports:view", <Reports />)} />
        <Route path="devices" element={permitted("devices:view", <EdgeArmor />)} />
        <Route path="network" element={permitted("network:view", <NetGuard />)} />
        <Route path="agentwatch" element={permitted("security-operations:view", <AgentWatch />)} />
        <Route path="users" element={permitted("users:manage", <Users />)} />
        <Route path="settings" element={permitted("settings:view", <Settings />)} />
        <Route path="audit-logs" element={permitted("audit-logs:view", <AuditLogs />)} />
      </Route>
    </Route>
    <Route path="*" element={<WebsiteRedirect />} />
  </Routes></BrowserRouter>;
}
