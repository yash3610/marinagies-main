import { NavLink } from "react-router-dom";
import {
    Activity,
    Anchor,
    Bell,
    Bot,
    Boxes,
    FileText,
    GitFork,
    Globe2,
    Gauge,
    LayoutDashboard,
    LogOut,
    Map,
    Radar,
    Settings,
    ShieldAlert,
    Ship,
    ScrollText,
    Users,
    Siren,
    LifeBuoy,
    RadioTower,
    DatabaseBackup,
    BrainCircuit,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const operations = [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
    { label: "Fleet Overview", path: "/dashboard/fleet", icon: Ship, permission: "vessels:view" },
    { label: "Live Monitoring", path: "/dashboard/monitoring", icon: Activity, permission: "telemetry:view" },
    { label: "Navigation Map", path: "/dashboard/navigation", icon: Map, permission: "navigation:view" },
    { label: "Attack Simulation", path: "/dashboard/attack-simulation", icon: Siren, permission: "attack-simulation:view" },
    { label: "Security Operations", path: "/dashboard/soc", icon: Radar, permission: "security-operations:view" },
    { label: "Alerts", path: "/dashboard/alerts", icon: Bell, permission: "alerts:view" },
    { label: "Incidents", path: "/dashboard/incidents", icon: ShieldAlert, permission: "incidents:view" },
    { label: "Digital Twin", path: "/dashboard/digital-twin", icon: Boxes, permission: "digital-twin:view" },
    { label: "Reports", path: "/dashboard/reports", icon: FileText, permission: "reports:view" },
    { label: "EdgeArmor", path: "/dashboard/devices", icon: Gauge, permission: "devices:view" },
    { label: "NetGuard", path: "/dashboard/network", icon: Globe2, permission: "network:view" },
    { label: "AgentWatch", path: "/dashboard/agentwatch", icon: Bot, permission: "security-operations:view" },
    { label: "FleetChoke", path: "/dashboard/fleet-risk", icon: GitFork, permission: "fleet-risk:view" },
    { label: "SARVerify", path: "/dashboard/sarverify", icon: LifeBuoy, permission: "sar-verify:view" },
    { label: "ROCShield", path: "/dashboard/rocshield", icon: RadioTower, permission: "commands:view" },
    { label: "RecoveryShield", path: "/dashboard/recovery", icon: DatabaseBackup, permission: "recovery:view" },
    { label: "Intelligence Center", path: "/dashboard/intelligence", icon: BrainCircuit, permission: "threat-intelligence:view" },
    { label: "Audit Logs", path: "/dashboard/audit-logs", icon: ScrollText, permission: "audit-logs:view" },
];

const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive
        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-400/10"
        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
    }`;

const DashboardSidebar = () => {
    const { user, logout, hasPermission } = useAuth();
    const visibleOperations = operations.filter(({ permission }) =>
        hasPermission(permission)
    );

    const handleLogout = async () => {
        await logout();
        window.location.assign("/login");
    };

    return (
        <aside className="w-64 h-screen shrink-0 border-r border-slate-800 bg-[#07111f] flex flex-col">
            <div className="h-20 px-5 border-b border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                    <Anchor className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-wide text-white">
                        MARINE<span className="text-cyan-400">AEGIS</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Cyber Defense</p>
                </div>
            </div>

            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Operations</p>
                {visibleOperations.map(({ label, path, icon: Icon }) => (
                    <NavLink key={path} to={path} end={path === "/dashboard"} className={linkClass}>
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                    </NavLink>
                ))}

                <div className="pt-5 mt-5 border-t border-slate-800">
                    <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">System</p>
                    {hasPermission("users:manage") && (
                        <NavLink to="/dashboard/users" className={linkClass}>
                            <Users className="w-4 h-4" />
                            Users
                        </NavLink>
                    )}
                    {hasPermission("settings:view") && (
                        <NavLink to="/dashboard/settings" className={linkClass}>
                            <Settings className="w-4 h-4" />
                            Settings
                        </NavLink>
                    )}
                </div>
            </nav>

            <div className="border-t border-slate-800 p-4">
                <div className="mb-3">
                    <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-slate-500 truncate mt-1">{user?.role || "Operator"}</p>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition text-sm">
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default DashboardSidebar;
