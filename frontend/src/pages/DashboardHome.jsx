import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertTriangle,
    Anchor,
    Bell,
    Cpu,
    Gauge,
    Fuel,
    MapPin,
    Navigation,
    Radio,
    Server,
    ShieldAlert,
    Ship,
    Wifi,
    Zap,
} from "lucide-react";
import { io } from "socket.io-client";
import api from "../services/api";
import VesselMap from "../components/VesselMap";

const DashboardHome = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [alerts, setAlerts] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [telemetry, setTelemetry] = useState([]);

    /* ========================================================= */
    /* DASHBOARD DATA */
    /* ========================================================= */

    useEffect(() => {
        let mounted = true;

        const fetchDashboardData = async () => {
            try {
                const [
                    statsResponse,
                    alertsResponse,
                    incidentsResponse,
                    telemetryResponse,
                ] = await Promise.all([
                    api.get("/dashboard/stats"),
                    api.get("/alerts"),
                    api.get("/incidents"),
                    api.get("/telemetry"),
                ]);

                if (!mounted) return;

                setStats(statsResponse.data?.stats || null);
                setAlerts(alertsResponse.data?.alerts || []);
                setIncidents(incidentsResponse.data?.incidents || []);
                setTelemetry(telemetryResponse.data?.data || []);
            } catch (err) {
                console.error("Dashboard error:", err);

                if (!mounted) return;

                setError(
                    err.response?.data?.message ||
                    "Failed to load dashboard data."
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchDashboardData();

        return () => {
            mounted = false;
        };
    }, []);

    /* ========================================================= */
    /* SOCKET.IO REAL-TIME TELEMETRY */
    /* ========================================================= */

    useEffect(() => {
        const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
            transports: ["websocket"],
        });

        socket.on("connect", () => {
            console.log(
                "MARINEAEGIS Socket connected:",
                socket.id
            );
        });

        socket.on("telemetry:update", (data) => {
            if (!data?.success || !Array.isArray(data.data)) {
                return;
            }

            const formattedTelemetry = data.data.map((item) => ({
                vessel: item.vessel,
                telemetry: item.telemetry || item,
            }));

            setTelemetry(formattedTelemetry);
        });

        socket.on("disconnect", () => {
            console.log("MARINEAEGIS Socket disconnected");
        });

        socket.on("connect_error", (err) => {
            console.warn(
                "MARINEAEGIS Socket connection error:",
                err.message
            );
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    /* ========================================================= */
    /* DERIVED DATA */
    /* ========================================================= */

    const severityCounts = useMemo(() => {
        return {
            CRITICAL: alerts.filter(
                (item) => item.severity === "CRITICAL"
            ).length,

            HIGH: alerts.filter(
                (item) => item.severity === "HIGH"
            ).length,

            MEDIUM: alerts.filter(
                (item) => item.severity === "MEDIUM"
            ).length,

            LOW: alerts.filter(
                (item) => item.severity === "LOW"
            ).length,
        };
    }, [alerts]);

    const totalSeverityAlerts =
        severityCounts.CRITICAL +
        severityCounts.HIGH +
        severityCounts.MEDIUM +
        severityCounts.LOW;

    const avgConfidence = useMemo(() => {
        if (!alerts.length) return 0;

        const total = alerts.reduce(
            (sum, alert) =>
                sum + Number(alert.confidence || 0),
            0
        );

        return Math.round(total / alerts.length);
    }, [alerts]);

    const recentAlerts = useMemo(() => {
        return [...alerts]
            .sort(
                (a, b) =>
                    new Date(
                        b.detectedAt || b.createdAt
                    ) -
                    new Date(
                        a.detectedAt || a.createdAt
                    )
            )
            .slice(0, 5);
    }, [alerts]);

    const recentIncidents = useMemo(() => {
        return [...incidents]
            .sort(
                (a, b) =>
                    new Date(
                        b.detectedAt || b.createdAt
                    ) -
                    new Date(
                        a.detectedAt || a.createdAt
                    )
            )
            .slice(0, 5);
    }, [incidents]);

    const topTelemetry = telemetry.slice(0, 6);

    const cards = [
        {
            title: "Total Vessels",
            value: stats?.totalVessels ?? 0,
            subtitle: "Active fleet",
            icon: Ship,
            iconBg: "bg-cyan-500/10",
            iconColor: "text-cyan-400",
            accent: "text-cyan-400",
        },
        {
            title: "Active Alerts",
            value: stats?.activeAlerts ?? 0,
            subtitle: `${stats?.criticalAlerts ?? 0} Critical`,
            icon: ShieldAlert,
            iconBg: "bg-red-500/10",
            iconColor: "text-red-400",
            accent: "text-red-400",
        },
        {
            title: "Incidents (30d)",
            value: incidents.length,
            subtitle: `${incidents.filter(
                (i) =>
                    i.status === "RESOLVED" ||
                    i.status === "CLOSED"
            ).length} Resolved`,
            icon: AlertTriangle,
            iconBg: "bg-orange-500/10",
            iconColor: "text-orange-400",
            accent: "text-orange-400",
        },
        {
            title: "Vessels Online",
            value: stats?.onlineVessels ?? 0,
            subtitle: `${stats?.totalVessels
                ? Math.round(
                    ((stats.onlineVessels || 0) /
                        stats.totalVessels) *
                    100
                )
                : 0
                }% of total`,
            icon: Wifi,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-400",
            accent: "text-emerald-400",
        },
        {
            title: "Avg. Confidence",
            value: `${avgConfidence}%`,
            subtitle: "AI detection confidence",
            icon: Activity,
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-400",
            accent: "text-indigo-400",
        },
    ];

    /* ========================================================= */
    /* LOADING */
    /* ========================================================= */

    if (loading) {
        return (
            <div className="min-h-[500px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />

                    <span className="text-sm">
                        Loading MARINEAEGIS dashboard...
                    </span>
                </div>
            </div>
        );
    }

    /* ========================================================= */
    /* ERROR */
    /* ========================================================= */

    if (error) {
        return (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
                <div className="flex items-center gap-3 text-red-400">
                    <AlertTriangle className="w-5 h-5" />

                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-6">

            {/* ===================================================== */}
            {/* PAGE HEADER */}
            {/* ===================================================== */}

            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Anchor className="w-5 h-5 text-cyan-400" />

                        <h1 className="text-xl font-semibold text-white">
                            Fleet Overview
                        </h1>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                        Real-time maritime security and vessel intelligence
                    </p>
                </div>

                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

                    <span className="text-[11px] text-emerald-400">
                        All Systems Operational
                    </span>
                </div>
            </div>

            {/* ===================================================== */}
            {/* KPI CARDS */}
            {/* ===================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={card.title}
                            className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 hover:border-slate-700 transition"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] text-slate-500">
                                        {card.title}
                                    </p>

                                    <p className="text-2xl font-semibold text-white mt-1">
                                        {card.value}
                                    </p>

                                    <p
                                        className={`text-[10px] mt-1 ${card.accent}`}
                                    >
                                        {card.subtitle}
                                    </p>
                                </div>

                                <div
                                    className={`w-11 h-11 rounded-full ${card.iconBg} flex items-center justify-center`}
                                >
                                    <Icon
                                        className={`w-5 h-5 ${card.iconColor}`}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ===================================================== */}
            {/* MAIN ROW */}
            {/* ===================================================== */}

            <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr_0.9fr] gap-3">

                {/* LIVE MAP */}

                <DashboardPanel
                    title="Live Vessel Map"
                    subtitle="Fleet position and navigation monitoring"
                    icon={MapPin}
                    right={<LiveBadge />}
                    className="flex flex-col min-h-[376px]"
                    contentClassName="relative flex-1 min-h-[320px]"
                >
                    <div className="absolute inset-0 overflow-hidden">
                        <VesselMap />
                    </div>
                </DashboardPanel>

                {/* TOP ALERTS */}

                <DashboardPanel
                    title="Top Alerts"
                    subtitle="Latest security events"
                    icon={Bell}
                    right={
                        <span className="text-[10px] text-cyan-400">
                            View All
                        </span>
                    }
                >
                    <div className="divide-y divide-slate-800/70">
                        {recentAlerts.length === 0 ? (
                            <EmptyState text="No active alerts" />
                        ) : (
                            recentAlerts.map((alert) => (
                                <AlertCompact
                                    key={alert._id}
                                    alert={alert}
                                />
                            ))
                        )}
                    </div>
                </DashboardPanel>

                {/* TELEMETRY */}

                <DashboardPanel
                    title="Real-time Telemetry"
                    subtitle="Live vessel sensor data"
                    icon={Activity}
                    right={<LiveBadge />}
                >
                    <div className="divide-y divide-slate-800/70">
                        {topTelemetry.length === 0 ? (
                            <EmptyState text="No telemetry available" />
                        ) : (
                            topTelemetry.map((item, index) => (
                                <TelemetryCompact
                                    key={
                                        item.vessel?._id ||
                                        item.vessel?.vesselId ||
                                        index
                                    }
                                    item={item}
                                />
                            ))
                        )}
                    </div>
                </DashboardPanel>
            </div>

            {/* ===================================================== */}
            {/* ANALYTICS ROW */}
            {/* ===================================================== */}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">

                <DashboardPanel
                    title="Alerts by Severity"
                    subtitle="Current alert distribution"
                    icon={ShieldAlert}
                    right={
                        <span className="text-[10px] text-slate-500">
                            All Alerts
                        </span>
                    }
                >
                    <SeverityChart
                        counts={severityCounts}
                        total={totalSeverityAlerts}
                    />
                </DashboardPanel>

                <DashboardPanel
                    title="Incidents Trend"
                    subtitle="Recent incident activity"
                    icon={Activity}
                    right={
                        <span className="text-[10px] text-slate-500">
                            Last 30 Days
                        </span>
                    }
                >
                    <IncidentTrend incidents={incidents} />
                </DashboardPanel>

                <DashboardPanel
                    title="Digital Twin Status"
                    subtitle="Virtual vessel simulation"
                    icon={Cpu}
                    right={
                        <span className="text-[10px] text-emerald-400">
                            Live Simulation
                        </span>
                    }
                >
                    <DigitalTwin />
                </DashboardPanel>

                <DashboardPanel
                    title="Recent Incidents"
                    subtitle="Latest security incidents"
                    icon={AlertTriangle}
                    right={
                        <span className="text-[10px] text-cyan-400">
                            View All
                        </span>
                    }
                >
                    <div className="divide-y divide-slate-800/70">
                        {recentIncidents.length === 0 ? (
                            <EmptyState text="No incidents found" />
                        ) : (
                            recentIncidents.map((incident) => (
                                <IncidentCompact
                                    key={incident._id}
                                    incident={incident}
                                />
                            ))
                        )}
                    </div>
                </DashboardPanel>
            </div>

            {/* ===================================================== */}
            {/* SYSTEM FEED */}
            {/* ===================================================== */}

            <SystemFeed
                alerts={alerts}
                incidents={incidents}
                telemetry={telemetry}
            />

            {/* ===================================================== */}
            {/* BOTTOM STATUS */}
            {/* ===================================================== */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

                <DashboardPanel
                    title="Fleet Risk Distribution"
                    subtitle="Current vessel risk classification"
                    icon={ShieldAlert}
                >
                    <div className="space-y-3">
                        <RiskBar
                            label="Low Risk"
                            value={stats?.lowRiskVessels || 0}
                            total={stats?.totalVessels || 0}
                            color="bg-emerald-400"
                        />

                        <RiskBar
                            label="Medium Risk"
                            value={stats?.mediumRiskVessels || 0}
                            total={stats?.totalVessels || 0}
                            color="bg-amber-400"
                        />

                        <RiskBar
                            label="High Risk"
                            value={stats?.highRiskVessels || 0}
                            total={stats?.totalVessels || 0}
                            color="bg-orange-400"
                        />

                        <RiskBar
                            label="Critical Risk"
                            value={stats?.criticalRiskVessels || 0}
                            total={stats?.totalVessels || 0}
                            color="bg-red-400"
                        />
                    </div>
                </DashboardPanel>

                <DashboardPanel
                    title="System Status"
                    subtitle="MARINEAEGIS platform health"
                    icon={Server}
                    right={
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Operational
                        </div>
                    }
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                        <SystemStatusRow
                            icon={Server}
                            name="Backend API"
                            status="Operational"
                        />

                        <SystemStatusRow
                            icon={Cpu}
                            name="MongoDB"
                            status="Connected"
                        />

                        <SystemStatusRow
                            icon={ShieldAlert}
                            name="Authentication"
                            status="Operational"
                        />

                        <SystemStatusRow
                            icon={Radio}
                            name="Fleet Monitoring"
                            status="Active"
                        />
                    </div>
                </DashboardPanel>
            </div>
        </div>
    );
};

/* ========================================================= */
/* PANEL */
/* ========================================================= */

const DashboardPanel = ({
    title,
    subtitle,
    icon: Icon,
    right,
    children,
    className = "",
    contentClassName = "",
}) => {
    return (
        <section className={`rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden ${className}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-4 h-4 text-cyan-400 shrink-0" />

                    <div className="min-w-0">
                        <h2 className="text-xs font-semibold text-white">
                            {title}
                        </h2>

                        {subtitle && (
                            <p className="text-[9px] text-slate-600 mt-0.5 truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {right}
            </div>

            <div className={contentClassName}>{children}</div>
        </section>
    );
};

/* ========================================================= */
/* LIVE BADGE */
/* ========================================================= */

const LiveBadge = () => {
    return (
        <span className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
        </span>
    );
};

/* ========================================================= */
/* ALERT COMPACT */
/* ========================================================= */

const AlertCompact = ({ alert }) => {
    const severity = alert.severity;

    const styles = {
        CRITICAL: {
            icon: "bg-red-500/10 text-red-400 border-red-500/30",
            badge: "bg-red-500/10 text-red-400",
        },
        HIGH: {
            icon: "bg-orange-500/10 text-orange-400 border-orange-500/30",
            badge: "bg-orange-500/10 text-orange-400",
        },
        MEDIUM: {
            icon: "bg-amber-500/10 text-amber-400 border-amber-500/30",
            badge: "bg-amber-500/10 text-amber-400",
        },
        LOW: {
            icon: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
            badge: "bg-cyan-500/10 text-cyan-400",
        },
    };

    const style = styles[severity] || styles.LOW;

    return (
        <div className="flex items-center gap-3 px-3 py-3">
            <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${style.icon}`}
            >
                <AlertTriangle className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-200 truncate">
                    {alert.title}
                </p>

                <p className="text-[9px] text-slate-600 truncate mt-0.5">
                    {alert.vessel?.name || "Unknown Vessel"}
                </p>
            </div>

            <div className="text-right shrink-0">
                <span
                    className={`text-[8px] font-semibold px-2 py-1 rounded ${style.badge}`}
                >
                    {severity}
                </span>

                <p className="text-[8px] text-slate-600 mt-1">
                    {formatTime(
                        alert.detectedAt ||
                        alert.createdAt
                    )}
                </p>
            </div>
        </div>
    );
};

/* ========================================================= */
/* TELEMETRY COMPACT */
/* ========================================================= */

const TelemetryCompact = ({ item }) => {
    const vessel = item?.vessel;
    const data = item?.telemetry || {};

    return (
        <div className="px-3 py-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-cyan-500/10 flex items-center justify-center">
                        <Ship className="w-3.5 h-3.5 text-cyan-400" />
                    </div>

                    <div>
                        <p className="text-[10px] font-medium text-slate-200">
                            {vessel?.name || "Unknown Vessel"}
                        </p>

                        <p className="text-[8px] text-slate-600">
                            {vessel?.vesselId || "---"}
                        </p>
                    </div>
                </div>

                <span
                    className={`text-[8px] px-1.5 py-1 rounded ${data?.deviceStatus === "ONLINE"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : data?.deviceStatus === "WARNING"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                >
                    {data?.deviceStatus || "UNKNOWN"}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <TelemetryMini
                    icon={Gauge}
                    label="Speed"
                    value={`${data?.speed ?? 0} kn`}
                />

                <TelemetryMini
                    icon={Navigation}
                    label="Heading"
                    value={`${data?.heading ?? 0}°`}
                />

                <TelemetryMini
                    icon={MapPin}
                    label="GPS"
                    value={`${data?.gpsSignal ?? 0}%`}
                />

                <TelemetryMini
                    icon={Fuel}
                    label="Fuel"
                    value={`${data?.fuelLevel ?? 0}%`}
                />
            </div>
        </div>
    );
};

const TelemetryMini = ({ icon: Icon, label, value }) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
                <Icon className="w-3 h-3 text-cyan-400" />

                <span className="text-[8px] text-slate-600">
                    {label}
                </span>
            </div>

            <span className="text-[9px] text-slate-300">
                {value}
            </span>
        </div>
    );
};

/* ========================================================= */
/* SEVERITY CHART */
/* ========================================================= */

const SeverityChart = ({ counts, total }) => {
    const radius = 44;
    const circumference = 2 * Math.PI * radius;

    const segments = [
        {
            label: "Critical",
            value: counts.CRITICAL,
            percentage: total
                ? Math.round(
                    (counts.CRITICAL / total) * 100
                )
                : 0,
            className: "stroke-red-500",
        },
        {
            label: "High",
            value: counts.HIGH,
            percentage: total
                ? Math.round(
                    (counts.HIGH / total) * 100
                )
                : 0,
            className: "stroke-orange-500",
        },
        {
            label: "Medium",
            value: counts.MEDIUM,
            percentage: total
                ? Math.round(
                    (counts.MEDIUM / total) * 100
                )
                : 0,
            className: "stroke-amber-400",
        },
        {
            label: "Low",
            value: counts.LOW,
            percentage: total
                ? Math.round(
                    (counts.LOW / total) * 100
                )
                : 0,
            className: "stroke-blue-500",
        },
    ];

    let offset = 0;

    return (
        <div className="flex items-center justify-center gap-5 px-3 py-5 min-h-[215px]">
            <div className="relative w-32 h-32 shrink-0">
                <svg
                    viewBox="0 0 120 120"
                    className="w-full h-full -rotate-90"
                >
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        className="stroke-slate-800"
                        strokeWidth="13"
                    />

                    {segments.map((segment) => {
                        const length =
                            total > 0
                                ? (segment.value / total) *
                                circumference
                                : 0;

                        const currentOffset = offset;

                        offset += length;

                        return (
                            <circle
                                key={segment.label}
                                cx="60"
                                cy="60"
                                r={radius}
                                fill="none"
                                className={segment.className}
                                strokeWidth="13"
                                strokeDasharray={`${length} ${circumference - length}`}
                                strokeDashoffset={-currentOffset}
                            />
                        );
                    })}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-semibold text-white">
                        {total}
                    </span>

                    <span className="text-[8px] text-slate-600">
                        Total Alerts
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                {segments.map((segment) => (
                    <div
                        key={segment.label}
                        className="flex items-center gap-2"
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${segment.label === "Critical"
                                ? "bg-red-500"
                                : segment.label === "High"
                                    ? "bg-orange-500"
                                    : segment.label === "Medium"
                                        ? "bg-amber-400"
                                        : "bg-blue-500"
                                }`}
                        />

                        <span className="text-[10px] text-slate-400 w-12">
                            {segment.label}
                        </span>

                        <span className="text-[10px] text-slate-300">
                            {segment.value}
                        </span>

                        <span className="text-[9px] text-slate-600">
                            ({segment.percentage}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ========================================================= */
/* INCIDENT TREND */
/* ========================================================= */

const IncidentTrend = ({ incidents }) => {
    const width = 320;
    const height = 155;
    const padding = 20;

    const values = useMemo(() => {
        const days = 7;
        const result = Array(days).fill(0);

        incidents.forEach((incident) => {
            const date = new Date(
                incident.detectedAt ||
                incident.createdAt
            );

            const diff = Math.floor(
                (Date.now() - date.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (diff >= 0 && diff < days) {
                result[days - 1 - diff]++;
            }
        });

        return result;
    }, [incidents]);

    const maxValue = Math.max(...values, 2);

    const points = values
        .map((value, index) => {
            const x =
                padding +
                (index * (width - padding * 2)) /
                (values.length - 1);

            const y =
                height -
                padding -
                (value / maxValue) *
                (height - padding * 2);

            return `${x},${y}`;
        })
        .join(" ");

    return (
        <div className="px-3 pt-5 pb-3 min-h-[215px]">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-[165px]"
            >
                {[0, 1, 2, 3].map((line) => {
                    const y =
                        padding +
                        (line *
                            (height - padding * 2)) /
                        3;

                    return (
                        <line
                            key={line}
                            x1={padding}
                            y1={y}
                            x2={width - padding}
                            y2={y}
                            className="stroke-slate-800"
                            strokeWidth="1"
                        />
                    );
                })}

                <polyline
                    points={points}
                    fill="none"
                    className="stroke-cyan-400"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {values.map((value, index) => {
                    const x =
                        padding +
                        (index * (width - padding * 2)) /
                        (values.length - 1);

                    const y =
                        height -
                        padding -
                        (value / maxValue) *
                        (height - padding * 2);

                    return (
                        <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="2.5"
                            className="fill-cyan-400"
                        />
                    );
                })}
            </svg>

            <div className="flex justify-between px-4 text-[8px] text-slate-600">
                <span>6d ago</span>
                <span>5d</span>
                <span>4d</span>
                <span>3d</span>
                <span>2d</span>
                <span>1d</span>
                <span>Today</span>
            </div>
        </div>
    );
};

/* ========================================================= */
/* DIGITAL TWIN */
/* ========================================================= */

const DigitalTwin = () => {
    return (
        <div className="relative min-h-[215px] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_65%)]" />

            <svg
                viewBox="0 0 400 220"
                className="relative w-full h-[185px]"
            >
                <defs>
                    <linearGradient
                        id="shipGlow"
                        x1="0"
                        x2="1"
                        y1="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            className="text-cyan-400"
                            stopColor="currentColor"
                            stopOpacity="0.8"
                        />

                        <stop
                            offset="100%"
                            className="text-blue-500"
                            stopColor="currentColor"
                            stopOpacity="0.15"
                        />
                    </linearGradient>
                </defs>

                <g className="stroke-cyan-500/10" strokeWidth="1">
                    <ellipse
                        cx="200"
                        cy="165"
                        rx="150"
                        ry="30"
                        fill="none"
                    />

                    <ellipse
                        cx="200"
                        cy="165"
                        rx="110"
                        ry="22"
                        fill="none"
                    />

                    <ellipse
                        cx="200"
                        cy="165"
                        rx="70"
                        ry="14"
                        fill="none"
                    />

                    <line x1="50" y1="165" x2="350" y2="165" />
                    <line x1="80" y1="180" x2="320" y2="180" />
                </g>

                <path
                    d="M85 132 L110 150 L300 150 L325 132 L300 172 L120 172 Z"
                    fill="url(#shipGlow)"
                    className="stroke-cyan-400"
                    strokeWidth="1.5"
                />

                <path
                    d="M120 132 L145 108 L270 108 L300 132 Z"
                    fill="none"
                    className="stroke-cyan-400"
                    strokeWidth="1.5"
                />

                <path
                    d="M180 108 L180 75 L235 75 L250 108"
                    fill="none"
                    className="stroke-cyan-400"
                    strokeWidth="1.5"
                />

                <path
                    d="M187 82 L229 82 L239 96 L187 96 Z"
                    fill="none"
                    className="stroke-cyan-400/70"
                    strokeWidth="1"
                />

                <line
                    x1="207"
                    y1="75"
                    x2="207"
                    y2="45"
                    className="stroke-cyan-400"
                />

                <line
                    x1="192"
                    y1="54"
                    x2="222"
                    y2="54"
                    className="stroke-cyan-400"
                />

                <circle
                    cx="207"
                    cy="42"
                    r="3"
                    className="fill-cyan-400 animate-pulse"
                />

                <g
                    className="stroke-cyan-400/50"
                    fill="none"
                >
                    <rect x="125" y="115" width="25" height="17" />
                    <rect x="152" y="115" width="25" height="17" />
                    <rect x="260" y="115" width="25" height="17" />
                </g>
            </svg>

            <div className="absolute bottom-3 left-3 right-3 flex justify-between">
                <div>
                    <p className="text-[8px] text-slate-600">
                        Simulation Time
                    </p>

                    <p className="text-xs text-white mt-1">
                        LIVE
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-[8px] text-slate-600">
                        Scenario
                    </p>

                    <p className="text-xs text-emerald-400 mt-1">
                        Normal Operations
                    </p>
                </div>
            </div>
        </div>
    );
};

/* ========================================================= */
/* INCIDENT COMPACT */
/* ========================================================= */

const IncidentCompact = ({ incident }) => {
    const severity = incident.severity;

    const color =
        severity === "CRITICAL"
            ? "text-red-400 bg-red-500/10"
            : severity === "HIGH"
                ? "text-orange-400 bg-orange-500/10"
                : severity === "MEDIUM"
                    ? "text-amber-400 bg-amber-500/10"
                    : "text-cyan-400 bg-cyan-500/10";

    return (
        <div className="flex items-center gap-3 px-3 py-3">
            <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}
            >
                <ShieldAlert className="w-3.5 h-3.5" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-slate-200 truncate">
                    {incident.title}
                </p>

                <p className="text-[8px] text-slate-600 truncate mt-1">
                    {incident.vessel?.name ||
                        "Unknown Vessel"}{" "}
                    •{" "}
                    {formatTime(
                        incident.detectedAt
                    )}
                </p>
            </div>

            <span
                className={`text-[8px] px-2 py-1 rounded ${color}`}
            >
                {severity}
            </span>
        </div>
    );
};

/* ========================================================= */
/* SYSTEM FEED */
/* ========================================================= */

const SystemFeed = ({
    alerts,
    incidents,
    telemetry,
}) => {
    const feed = [];

    if (telemetry.length > 0) {
        const item = telemetry[0];

        feed.push({
            time: new Date(),
            text: `Telemetry data received from ${item.vessel?.name || "vessel"
                }`,
            icon: Activity,
        });
    }

    if (alerts.length > 0) {
        feed.push({
            time: new Date(
                alerts[0].detectedAt ||
                alerts[0].createdAt
            ),
            text: `New ${alerts[0].severity} alert detected`,
            icon: AlertTriangle,
        });
    }

    if (incidents.length > 0) {
        feed.push({
            time: new Date(
                incidents[0].detectedAt ||
                incidents[0].createdAt
            ),
            text: `Incident ${incidents[0].incidentId} registered`,
            icon: ShieldAlert,
        });
    }

    feed.push({
        time: new Date(),
        text: "Digital Twin simulation running",
        icon: Cpu,
    });

    return (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />

                    <h2 className="text-xs font-semibold text-white">
                        System Feed
                    </h2>

                    <LiveBadge />
                </div>

                <span className="text-[9px] text-cyan-400">
                    View All Logs
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                {feed.slice(0, 4).map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={index}
                            className="flex items-center gap-3 px-4 py-3"
                        >
                            <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />

                            <span className="text-[9px] text-slate-500 whitespace-nowrap">
                                {formatTime(item.time)}
                            </span>

                            <span className="text-[9px] text-slate-400 truncate">
                                {item.text}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/* ========================================================= */
/* RISK BAR */
/* ========================================================= */

const RiskBar = ({
    label,
    value = 0,
    total = 0,
    color,
}) => {
    const percentage =
        total > 0
            ? Math.round((value / total) * 100)
            : 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500">
                    {label}
                </span>

                <span className="text-[10px] text-slate-400">
                    {value}
                </span>
            </div>

            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </div>
    );
};

/* ========================================================= */
/* SYSTEM STATUS ROW */
/* ========================================================= */

const SystemStatusRow = ({
    icon: Icon,
    name,
    status,
}) => {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
            <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-slate-500" />

                <span className="text-[10px] text-slate-400">
                    {name}
                </span>
            </div>

            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                <span className="text-[9px] text-emerald-400">
                    {status}
                </span>
            </div>
        </div>
    );
};

/* ========================================================= */
/* EMPTY STATE */
/* ========================================================= */

const EmptyState = ({ text }) => {
    return (
        <div className="flex items-center justify-center py-12">
            <span className="text-[10px] text-slate-600">
                {text}
            </span>
        </div>
    );
};

/* ========================================================= */
/* TIME FORMAT */
/* ========================================================= */

const formatTime = (date) => {
    if (!date) return "--:--";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "--:--";
    }

    return parsed.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default DashboardHome;