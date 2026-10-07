import { NavLink } from "react-router-dom";
import {
    Activity, Bell, Bot, Boxes, BrainCircuit, ChevronRight, DatabaseBackup,
    FileText, Gauge, GitFork, Globe2, LayoutDashboard, LifeBuoy, LogOut, Map,
    RadioTower, Radar, Satellite, ScrollText, Settings, ShieldAlert, Ship, Siren, Users, X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const groups = [
    { label: "Command center", items: [
        ["Overview", "/dashboard", LayoutDashboard, "dashboard:view"], ["Fleet", "/dashboard/fleet", Ship, "vessels:view"],
        ["Live monitoring", "/dashboard/monitoring", Activity, "telemetry:view"], ["Navigation", "/dashboard/navigation", Map, "navigation:view"],
        ["Attack Simulation", "/dashboard/attack-simulation", Siren, "attack-simulation:view"],
    ] },
    { label: "Defense modules", items: [
        ["Security operations", "/dashboard/soc", Radar, "security-operations:view"], ["Alerts", "/dashboard/alerts", Bell, "alerts:view"],
        ["Incidents", "/dashboard/incidents", ShieldAlert, "incidents:view"], ["Digital twin", "/dashboard/digital-twin", Boxes, "digital-twin:view"],
        ["EdgeArmor", "/dashboard/devices", Gauge, "devices:view"], ["NetGuard", "/dashboard/network", Globe2, "network:view"],
        ["AgentWatch", "/dashboard/agentwatch", Bot, "security-operations:view"], ["FleetChoke", "/dashboard/fleet-risk", GitFork, "fleet-risk:view"],
        ["SARVerify", "/dashboard/sarverify", LifeBuoy, "sar-verify:view"], ["ROCShield", "/dashboard/rocshield", RadioTower, "commands:view"],
        ["RecoveryShield", "/dashboard/recovery", DatabaseBackup, "recovery:view"],
    ] },
    { label: "Intelligence & assurance", items: [
        ["Intelligence", "/dashboard/intelligence", BrainCircuit, "threat-intelligence:view"], ["ML training", "/dashboard/ml-lab", BrainCircuit, "fleet-learning:view"],
        ["Reports", "/dashboard/reports", FileText, "reports:view"], ["Audit trail", "/dashboard/audit-logs", ScrollText, "audit-logs:view"],
        ["Offline operations", "/dashboard/connectivity", Satellite, "connectivity:view"],
    ] },
];

const navClass = ({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${isActive ? "bg-gradient-to-r from-cyan-400/15 to-blue-500/[0.04] text-cyan-200 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.12)]" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"}`;

const ModernDashboardSidebar = ({ open, onClose }) => {
    const { user, logout, hasPermission } = useAuth();
    const initials = String(user?.name || "MA").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    const handleLogout = async () => { await logout(); window.location.assign("/login"); };

    return <>
        {open && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm lg:hidden" />}
        <aside className={`dashboard-sidebar fixed inset-y-0 left-0 z-50 flex w-[17.5rem] shrink-0 flex-col border-r border-white/[0.06] bg-[#07101d]/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex h-[4.75rem] items-center gap-3 border-b border-white/[0.06] px-4">
                <a href="/" aria-label="MarineAegis home" className="flex min-w-0 flex-1 items-center">
                    <img src="/assets/img/footer-logo.png" alt="MarineAegis" className="block w-[190px] max-w-full object-contain drop-shadow-[0_7px_22px_rgba(190,242,2,.12)]" />
                </a>
                <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white lg:hidden"><X className="h-4 w-4" /></button>
            </div>
            <nav className="marine-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5">
                {groups.map((group) => { const items = group.items.filter(([, , , permission]) => hasPermission(permission)); return items.length ? <section key={group.label}><p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">{group.label}</p><div className="space-y-1">{items.map(([label, path, Icon]) => <NavLink key={path} to={path} end={path === "/dashboard"} onClick={onClose} className={navClass}><Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{label}</span><ChevronRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-50" /></NavLink>)}</div></section> : null; })}
                <section><p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">Platform</p><div className="space-y-1">{hasPermission("users:manage") && <NavLink to="/dashboard/users" onClick={onClose} className={navClass}><Users className="h-4 w-4" /><span className="flex-1">Users</span></NavLink>}{hasPermission("settings:view") && <NavLink to="/dashboard/settings" onClick={onClose} className={navClass}><Settings className="h-4 w-4" /><span className="flex-1">Settings</span></NavLink>}</div></section>
            </nav>
            <div className="border-t border-white/[0.06] p-3"><div className="flex items-center gap-3 rounded-xl bg-white/[0.025] p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/10 text-xs font-bold text-cyan-200">{initials}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-100">{user?.name || "Operator"}</p><p className="mt-0.5 truncate text-[9px] uppercase tracking-wide text-slate-500">{String(user?.role || "USER").replaceAll("_", " ")}</p></div><button type="button" aria-label="Logout" onClick={handleLogout} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"><LogOut className="h-4 w-4" /></button></div></div>
        </aside>
    </>;
};

export default ModernDashboardSidebar;
