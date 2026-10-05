import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import RequireAuth from "./components/RequireAuth";
import RequirePermission from "./components/RequirePermission";
import DashboardPageSkeleton from "./components/dashboard/DashboardPageSkeleton";

const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const FleetOverview = lazy(() => import("./pages/FleetOverview"));
const NavigationMap = lazy(() => import("./pages/NavigationMap"));
const LiveMonitoring = lazy(() => import("./pages/LiveMonitoring"));
const SOC = lazy(() => import("./pages/SOC"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Incidents = lazy(() => import("./pages/Incidents"));
const DigitalTwin = lazy(() => import("./pages/DigitalTwin"));
const Reports = lazy(() => import("./pages/Reports"));
const EdgeArmor = lazy(() => import("./pages/EdgeArmor"));
const NetGuard = lazy(() => import("./pages/NetGuard"));
const AgentWatch = lazy(() => import("./pages/AgentWatch"));
const FleetChoke = lazy(() => import("./pages/FleetChoke"));
const SARVerify = lazy(() => import("./pages/SARVerify"));
const ROCShield = lazy(() => import("./pages/ROCShield"));
const RecoveryShield = lazy(() => import("./pages/RecoveryShield"));
const Users = lazy(() => import("./pages/Users"));
const Settings = lazy(() => import("./pages/Settings"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const AttackSimulation = lazy(() => import("./pages/AttackSimulation"));
const IntelligenceCenter = lazy(() => import("./pages/IntelligenceCenter"));
const MLLab = lazy(() => import("./pages/MLLab"));
const Connectivity = lazy(() => import("./pages/Connectivity"));

function WebsiteRedirect() {
  useEffect(() => { window.location.replace("/"); }, []);
  return null;
}

const permitted = (permission, Page) => (
  <RequirePermission permission={permission}>
    <Suspense fallback={<DashboardPageSkeleton />}>
      <Page />
    </Suspense>
  </RequirePermission>
);

export default function App() {
  return <BrowserRouter><Routes>
    <Route element={<RequireAuth />}>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={permitted("dashboard:view", DashboardHome)} />
        <Route path="fleet" element={permitted("vessels:view", FleetOverview)} />
        <Route path="monitoring" element={permitted("telemetry:view", LiveMonitoring)} />
        <Route path="navigation" element={permitted("navigation:view", NavigationMap)} />
        <Route path="attack-simulation" element={permitted("attack-simulation:view", AttackSimulation)} />
        <Route path="soc" element={permitted("security-operations:view", SOC)} />
        <Route path="alerts" element={permitted("alerts:view", Alerts)} />
        <Route path="incidents" element={permitted("incidents:view", Incidents)} />
        <Route path="digital-twin" element={permitted("digital-twin:view", DigitalTwin)} />
        <Route path="reports" element={permitted("reports:view", Reports)} />
        <Route path="devices" element={permitted("devices:view", EdgeArmor)} />
        <Route path="network" element={permitted("network:view", NetGuard)} />
        <Route path="agentwatch" element={permitted("security-operations:view", AgentWatch)} />
        <Route path="fleet-risk" element={permitted("fleet-risk:view", FleetChoke)} />
        <Route path="sarverify" element={permitted("sar-verify:view", SARVerify)} />
        <Route path="rocshield" element={permitted("commands:view", ROCShield)} />
        <Route path="recovery" element={permitted("recovery:view", RecoveryShield)} />
        <Route path="intelligence" element={permitted("threat-intelligence:view", IntelligenceCenter)} />
        <Route path="ml-lab" element={permitted("fleet-learning:view", MLLab)} />
        <Route path="users" element={permitted("users:manage", Users)} />
        <Route path="settings" element={permitted("settings:view", Settings)} />
        <Route path="connectivity" element={permitted("connectivity:view", Connectivity)} />
        <Route path="audit-logs" element={permitted("audit-logs:view", AuditLogs)} />
      </Route>
    </Route>
    <Route path="*" element={<WebsiteRedirect />} />
  </Routes></BrowserRouter>;
}
