import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Bell, CheckCheck, ExternalLink, Menu, ShieldCheck, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api";
import { createSocket } from "../../services/socket";
import { useAuth } from "../../hooks/useAuth";

const NOTIFICATION_SEEN_KEY = "marineaegis.notifications.lastSeen";

const severityStyles = {
    CRITICAL: "border-red-500/30 bg-red-500/10 text-red-400",
    HIGH: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    LOW: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
};

const pageMeta = {
    "/dashboard": ["Command overview", "Fleet posture and active defense signals"],
    "/dashboard/fleet": ["Fleet overview", "Vessel status, risk and operational readiness"],
    "/dashboard/monitoring": ["Live monitoring", "Real-time navigation and onboard telemetry"],
    "/dashboard/navigation": ["Navigation intelligence", "Trusted position and route validation"],
    "/dashboard/attack-simulation": ["Attack simulation", "Controlled maritime threat demonstrations"],
    "/dashboard/soc": ["Security operations", "Correlated detection and response workspace"],
    "/dashboard/alerts": ["Security alerts", "Prioritized findings and operator decisions"],
    "/dashboard/incidents": ["Incident response", "Investigation, replay and containment"],
    "/dashboard/digital-twin": ["Digital twin", "Safety simulation before operational action"],
    "/dashboard/devices": ["EdgeArmor", "Onboard device integrity and containment"],
    "/dashboard/network": ["NetGuard", "DNS and vessel network defense"],
    "/dashboard/agentwatch": ["AgentWatch", "Autonomous attack sequence detection"],
    "/dashboard/fleet-risk": ["FleetChoke", "Supplier and fleet dependency risk"],
    "/dashboard/sarverify": ["SARVerify", "Distress signal authenticity"],
    "/dashboard/rocshield": ["ROCShield", "Remote command integrity"],
    "/dashboard/recovery": ["RecoveryShield", "Ransomware containment and recovery"],
    "/dashboard/intelligence": ["Intelligence center", "Fleet-wide evidence and learning"],
    "/dashboard/ml-lab": ["ML training lab", "Measured model training and deployment"],
    "/dashboard/reports": ["Reports", "Operational and compliance evidence"],
    "/dashboard/audit-logs": ["Audit trail", "Immutable operator and system activity"],
    "/dashboard/connectivity": ["Offline operations", "Satellite link and store-and-forward queue"],
    "/dashboard/users": ["Access management", "Users, roles and vessel scope"],
    "/dashboard/settings": ["Platform settings", "Detection policy and account controls"],
};

const getAlertTime = (alert) =>
    new Date(alert.detectedAt || alert.createdAt || 0).getTime();

const formatAlertTime = (alert) => {
    const timestamp = getAlertTime(alert);
    if (!timestamp) return "Just now";

    const elapsed = Date.now() - timestamp;
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
    });
};

const DashboardHeader = ({ onMenu }) => {
    const location = useLocation();
    const { user } = useAuth();
    const [title, subtitle] = pageMeta[location.pathname] || ["MarineAegis", "Autonomous maritime cyber defense"];
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [lastSeen, setLastSeen] = useState(() =>
        Number(localStorage.getItem(NOTIFICATION_SEEN_KEY) || 0)
    );

    useEffect(() => {
        let mounted = true;

        const loadAlerts = async () => {
            try {
                const response = await api.get("/alerts");
                if (mounted) setAlerts(response.data?.alerts || []);
            } catch (error) {
                console.error("Notification alerts error:", error);
            }
        };

        loadAlerts();
        const refreshTimer = window.setInterval(loadAlerts, 30000);
        const socket = createSocket();

        socket.on("alert:new", (alert) => {
            if (!alert?._id) return;
            setAlerts((current) => [
                alert,
                ...current.filter((item) => item._id !== alert._id),
            ]);
        });

        socket.on("alert:update", (alert) => {
            if (!alert?._id) return;
            setAlerts((current) =>
                current.map((item) => (item._id === alert._id ? alert : item))
            );
        });

        return () => {
            mounted = false;
            window.clearInterval(refreshTimer);
            socket.disconnect();
        };
    }, []);

    const recentAlerts = useMemo(
        () => [...alerts].sort((a, b) => getAlertTime(b) - getAlertTime(a)).slice(0, 8),
        [alerts]
    );

    const unreadCount = useMemo(
        () => alerts.filter((alert) => getAlertTime(alert) > lastSeen).length,
        [alerts, lastSeen]
    );

    const activeAlerts = alerts.filter((alert) => alert.status !== "RESOLVED");
    const hasCriticalAlert = activeAlerts.some((alert) => alert.severity === "CRITICAL");

    const markAllRead = () => {
        const seenAt = Date.now();
        localStorage.setItem(NOTIFICATION_SEEN_KEY, String(seenAt));
        setLastSeen(seenAt);
    };

    const toggleNotifications = () => {
        setIsOpen((open) => {
            if (!open) markAllRead();
            return !open;
        });
    };

    useEffect(() => {
        if (!isOpen) return undefined;
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [isOpen]);

    return (
        <header className="relative z-30 flex h-[4.75rem] shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#07101d]/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
                <button type="button" aria-label="Open navigation" onClick={onMenu} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-400 transition hover:text-white lg:hidden"><Menu className="h-5 w-5" /></button>
                <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold tracking-tight text-white sm:text-base">{title}</h2>
                    <p className="mt-0.5 hidden truncate text-[11px] text-slate-500 sm:block">{subtitle}</p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <div className={`hidden items-center gap-2 rounded-xl border px-3 py-2 lg:flex ${hasCriticalAlert ? "border-red-500/20 bg-red-500/[0.06]" : "border-emerald-500/15 bg-emerald-500/[0.04]"}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${hasCriticalAlert ? "bg-red-400" : "bg-emerald-400"}`} />
                    <span className={`text-xs ${hasCriticalAlert ? "text-red-400" : "text-emerald-400"}`}>
                        {hasCriticalAlert ? "Critical Alert Active" : activeAlerts.length ? `${activeAlerts.length} Active Alerts` : "Systems Operational"}
                    </span>
                </div>
                <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />
                <div className="hidden text-right xl:block"><p className="text-[11px] font-medium text-slate-300">{user?.name || "Operator"}</p><p className="mt-0.5 text-[9px] uppercase tracking-wide text-slate-600">{String(user?.role || "USER").replaceAll("_", " ")}</p></div>

                <div className="relative">
                    <button
                        type="button"
                        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                        aria-expanded={isOpen}
                        onClick={toggleNotifications}
                        className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition ${isOpen ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.12)]" : "border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/5"}`}
                    >
                        <Bell className="w-4 h-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full border-2 border-[#07111f] bg-red-500 text-[9px] font-bold leading-4 text-white flex items-center justify-center">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {isOpen && createPortal(<>
                        <button type="button" aria-label="Close notifications" onClick={() => setIsOpen(false)} className="fixed inset-0 z-[1900] cursor-default bg-slate-950/45 backdrop-blur-[2px]" />
                        <aside role="dialog" aria-modal="true" aria-label="Notifications" className="fixed inset-x-3 bottom-3 top-3 z-[2000] flex overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#07111f]/98 shadow-[0_28px_100px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:inset-x-auto sm:right-4 sm:w-[25rem]">
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                    <p className="mt-0.5 text-[10px] text-slate-500">Live security feed · {recentAlerts.length} recent</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button type="button" onClick={markAllRead} className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-medium text-cyan-400 transition hover:bg-cyan-400/[0.07] hover:text-cyan-300"><CheckCheck className="h-3.5 w-3.5" />Mark read</button>
                                    <button type="button" aria-label="Close" onClick={() => setIsOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button>
                                </div>
                            </div>

                            <div className="marine-scrollbar flex-1 overflow-y-auto">
                                {recentAlerts.length ? recentAlerts.map((alert) => (
                                    <Link
                                        key={alert._id}
                                        to="/dashboard/alerts"
                                        onClick={() => setIsOpen(false)}
                                        className="group flex gap-3 border-b border-slate-800/70 px-4 py-3.5 transition last:border-b-0 hover:bg-cyan-500/[0.04]"
                                    >
                                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${severityStyles[alert.severity] || severityStyles.LOW}`}>
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="truncate text-xs font-medium text-slate-200 group-hover:text-white">{alert.title || "Security alert detected"}</p>
                                                <span className="shrink-0 text-[9px] text-slate-600">{formatAlertTime(alert)}</span>
                                            </div>
                                            <p className="mt-1 truncate text-[10px] text-slate-500">{alert.vessel?.name || "Unknown vessel"} · {String(alert.severity || "LOW").toLowerCase()}</p>
                                            <span className={`mt-2 inline-flex rounded border px-1.5 py-0.5 text-[8px] font-semibold ${severityStyles[alert.severity] || severityStyles.LOW}`}>
                                                {alert.status || "OPEN"}
                                            </span>
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="flex flex-col items-center px-6 py-10 text-center">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <p className="mt-3 text-xs font-medium text-slate-300">No notifications</p>
                                        <p className="mt-1 text-[10px] text-slate-600">New security alerts will appear here.</p>
                                    </div>
                                )}
                            </div>

                            <Link to="/dashboard/alerts" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 border-t border-white/[0.07] bg-cyan-400/[0.03] px-4 py-3.5 text-[10px] font-medium text-cyan-300 transition hover:bg-cyan-500/[0.08]">
                                View all alerts
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </aside>
                    </>, document.body)}
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
