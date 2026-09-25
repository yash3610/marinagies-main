import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bell, CheckCheck, ExternalLink, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { createSocket } from "../../services/socket";

const NOTIFICATION_SEEN_KEY = "marineaegis.notifications.lastSeen";

const severityStyles = {
    CRITICAL: "border-red-500/30 bg-red-500/10 text-red-400",
    HIGH: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    LOW: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
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

const DashboardHeader = () => {
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [lastSeen, setLastSeen] = useState(() =>
        Number(localStorage.getItem(NOTIFICATION_SEEN_KEY) || 0)
    );
    const notificationRef = useRef(null);

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

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!notificationRef.current?.contains(event.target)) setIsOpen(false);
        };
        const handleEscape = (event) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
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

    return (
        <header className="relative z-40 h-20 shrink-0 border-b border-slate-800 bg-[#07111f]/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-7">
            <div className="min-w-0">
                <h2 className="truncate text-base md:text-lg font-semibold text-white">Security Operations Center</h2>
                <p className="hidden sm:block text-xs text-slate-500 mt-1">Autonomous Maritime Cyber Defense Platform</p>
            </div>

            <div className="flex shrink-0 items-center gap-3 md:gap-4">
                <div className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border ${hasCriticalAlert ? "border-red-500/25 bg-red-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${hasCriticalAlert ? "bg-red-400" : "bg-emerald-400"}`} />
                    <span className={`text-xs ${hasCriticalAlert ? "text-red-400" : "text-emerald-400"}`}>
                        {hasCriticalAlert ? "Critical Alert Active" : activeAlerts.length ? `${activeAlerts.length} Active Alerts` : "Systems Operational"}
                    </span>
                </div>

                <div ref={notificationRef} className="relative">
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

                    {isOpen && (
                        <div className="absolute right-0 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-700/80 bg-[#07111f]/98 shadow-[0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                    <p className="mt-0.5 text-[10px] text-slate-500">Live security alert feed</p>
                                </div>
                                <button type="button" onClick={markAllRead} className="flex items-center gap-1.5 text-[10px] font-medium text-cyan-400 transition hover:text-cyan-300">
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Mark all read
                                </button>
                            </div>

                            <div className="max-h-80 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#0891b2_#07111f] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:border-l [&::-webkit-scrollbar-track]:border-slate-800/70 [&::-webkit-scrollbar-track]:bg-[#07111f] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-[#07111f] [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-cyan-400 [&::-webkit-scrollbar-thumb]:to-blue-600 hover:[&::-webkit-scrollbar-thumb]:from-cyan-300 hover:[&::-webkit-scrollbar-thumb]:to-blue-500">
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

                            <Link to="/dashboard/alerts" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 border-t border-slate-800 bg-slate-950/30 px-4 py-3 text-[10px] font-medium text-cyan-400 transition hover:bg-cyan-500/[0.05] hover:text-cyan-300">
                                View all alerts
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
