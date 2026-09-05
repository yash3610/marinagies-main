import { useEffect, useMemo, useState } from "react";
import {
    Shield,
    ShieldAlert,
    Activity,
    AlertTriangle,
    Siren,
    Target,
    Radio,
    Clock3,
    CheckCircle2,
    XCircle,
    Eye,
    Zap,
    Ship,
    BrainCircuit,
} from "lucide-react";
import api from "../services/api";
import { createSocket } from "../services/socket";


const SOC = () => {
    const [alerts, setAlerts] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [vessels, setVessels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    // =========================
    // Load Security Data
    // =========================
    const loadSecurityData = async () => {
        try {
            const [alertsRes, incidentsRes, vesselsRes] =
                await Promise.all([
                    api.get("/alerts"),
                    api.get("/incidents"),
                    api.get("/vessels"),
                ]);

            setAlerts(alertsRes.data?.alerts || []);
            setIncidents(incidentsRes.data?.incidents || []);
            setVessels(vesselsRes.data?.vessels || []);
            setLastUpdate(new Date());
        } catch (error) {
            console.error("SOC data error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSecurityData();
    }, []);

    // =========================
    // Socket.IO
    // =========================
    useEffect(() => {
        const socket = createSocket();

        socket.on("connect", () => {
            console.log("SOC Socket connected:", socket.id);
        });

        socket.on("alert:new", (alert) => {
            if (!alert) return;

            setAlerts((prev) => [alert, ...prev]);
            setLastUpdate(new Date());
        });

        socket.on("incident:new", (incident) => {
            if (!incident) return;

            setIncidents((prev) => [incident, ...prev]);
            setLastUpdate(new Date());
        });

        socket.on("alert:update", (alert) => {
            if (!alert?._id) return;

            setAlerts((prev) =>
                prev.map((item) =>
                    item._id === alert._id ? alert : item
                )
            );

            setLastUpdate(new Date());
        });

        socket.on("incident:update", (incident) => {
            if (!incident?._id) return;

            setIncidents((prev) =>
                prev.map((item) =>
                    item._id === incident._id ? incident : item
                )
            );

            setLastUpdate(new Date());
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // =========================
    // Security Metrics
    // =========================
    const metrics = useMemo(() => {
        const openAlerts = alerts.filter(
            (alert) => alert.status === "OPEN"
        );

        const criticalAlerts = alerts.filter(
            (alert) => alert.severity === "CRITICAL"
        );

        const highAlerts = alerts.filter(
            (alert) => alert.severity === "HIGH"
        );

        const activeIncidents = incidents.filter(
            (incident) =>
                !["RESOLVED", "CLOSED"].includes(incident.status)
        );

        const criticalIncidents = incidents.filter(
            (incident) =>
                incident.severity === "CRITICAL" &&
                !["RESOLVED", "CLOSED"].includes(incident.status)
        );

        const confidenceValues = alerts
            .map((alert) => Number(alert.confidence))
            .filter((value) => !Number.isNaN(value));

        const avgConfidence =
            confidenceValues.length > 0
                ? Math.round(
                    confidenceValues.reduce(
                        (sum, value) => sum + value,
                        0
                    ) / confidenceValues.length
                )
                : 0;

        return {
            openAlerts: openAlerts.length,
            criticalAlerts: criticalAlerts.length,
            highAlerts: highAlerts.length,
            activeIncidents: activeIncidents.length,
            criticalIncidents: criticalIncidents.length,
            avgConfidence,
        };
    }, [alerts, incidents]);

    // =========================
    // Severity
    // =========================
    const severityData = useMemo(() => {
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

    // =========================
    // Attack Types
    // =========================
    const attackTypes = useMemo(() => {
        const counts = {};

        alerts.forEach((alert) => {
            const type = alert.type || "OTHER";
            counts[type] = (counts[type] || 0) + 1;
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);
    }, [alerts]);

    // =========================
    // Recent Security Events
    // =========================
    const recentEvents = useMemo(() => {
        const alertEvents = alerts.map((item) => ({
            id: item._id,
            eventId: item.alertId,
            title: item.title,
            type: item.type,
            severity: item.severity,
            status: item.status,
            vessel: item.vessel?.name || "Unknown Vessel",
            confidence: item.confidence,
            detectedAt: item.detectedAt,
            source: item.source,
            kind: "ALERT",
        }));

        const incidentEvents = incidents.map((item) => ({
            id: item._id,
            eventId: item.incidentId,
            title: item.title,
            type: item.type,
            severity: item.severity,
            status: item.status,
            vessel: item.vessel?.name || "Unknown Vessel",
            confidence: item.confidence,
            detectedAt: item.detectedAt,
            source: item.source,
            kind: "INCIDENT",
        }));

        return [...alertEvents, ...incidentEvents]
            .sort(
                (a, b) =>
                    new Date(b.detectedAt) -
                    new Date(a.detectedAt)
            )
            .slice(0, 8);
    }, [alerts, incidents]);

    // =========================
    // Vessel Security
    // =========================
    const vesselSecurity = useMemo(() => {
        return vessels
            .map((vessel) => {
                const vesselAlerts = alerts.filter(
                    (alert) =>
                        alert.vessel?._id === vessel._id
                );

                const vesselIncidents = incidents.filter(
                    (incident) =>
                        incident.vessel?._id === vessel._id
                );

                const critical = [
                    ...vesselAlerts,
                    ...vesselIncidents,
                ].filter(
                    (item) =>
                        item.severity === "CRITICAL" &&
                        !["RESOLVED", "CLOSED"].includes(
                            item.status
                        )
                ).length;

                const active = [
                    ...vesselAlerts,
                    ...vesselIncidents,
                ].filter(
                    (item) =>
                        !["RESOLVED", "CLOSED"].includes(
                            item.status
                        )
                ).length;

                return {
                    ...vessel,
                    active,
                    critical,
                };
            })
            .sort(
                (a, b) =>
                    b.critical - a.critical ||
                    b.active - a.active
            );
    }, [vessels, alerts, incidents]);

    const formatTime = (date) => {
        if (!date) return "--";

        return new Date(date).toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    return (
        <div className="space-y-5">
            {/* =====================================
          HEADER
      ===================================== */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                        <Shield className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Security Operations Center
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Maritime cyber threat detection and
                            security intelligence
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        </span>

                        <span className="text-xs font-medium text-emerald-400">
                            SOC ACTIVE
                        </span>
                    </div>

                    {lastUpdate && (
                        <span className="text-xs text-slate-600">
                            {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* =====================================
          SECURITY KPIs
      ===================================== */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                <SecurityStat
                    icon={ShieldAlert}
                    label="Open Alerts"
                    value={metrics.openAlerts}
                    description="Awaiting response"
                    type="danger"
                />

                <SecurityStat
                    icon={Siren}
                    label="Critical Threats"
                    value={metrics.criticalAlerts}
                    description="Immediate attention"
                    type="critical"
                />

                <SecurityStat
                    icon={Activity}
                    label="Active Incidents"
                    value={metrics.activeIncidents}
                    description="Under investigation"
                    type="warning"
                />

                <SecurityStat
                    icon={Target}
                    label="High Alerts"
                    value={metrics.highAlerts}
                    description="Elevated threat"
                    type="amber"
                />

                <SecurityStat
                    icon={BrainCircuit}
                    label="AI Confidence"
                    value={`${metrics.avgConfidence}%`}
                    description="Detection confidence"
                    type="cyan"
                />
            </div>

            {/* =====================================
          THREAT OVERVIEW
      ===================================== */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Severity */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-white">
                                Threat Severity
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Current alert distribution
                            </p>
                        </div>

                        <ShieldAlert className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div className="mt-6 space-y-4">
                        <SeverityBar
                            label="Critical"
                            value={severityData.CRITICAL}
                            total={alerts.length}
                            color="bg-red-500"
                            textColor="text-red-400"
                        />

                        <SeverityBar
                            label="High"
                            value={severityData.HIGH}
                            total={alerts.length}
                            color="bg-orange-500"
                            textColor="text-orange-400"
                        />

                        <SeverityBar
                            label="Medium"
                            value={severityData.MEDIUM}
                            total={alerts.length}
                            color="bg-amber-500"
                            textColor="text-amber-400"
                        />

                        <SeverityBar
                            label="Low"
                            value={severityData.LOW}
                            total={alerts.length}
                            color="bg-emerald-500"
                            textColor="text-emerald-400"
                        />
                    </div>
                </div>

                {/* Attack Types */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-white">
                                Threat Categories
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Detected maritime attack vectors
                            </p>
                        </div>

                        <Target className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div className="mt-5 space-y-3">
                        {attackTypes.length === 0 ? (
                            <EmptyState text="No threat categories detected" />
                        ) : (
                            attackTypes.map(([type, count]) => (
                                <div
                                    key={type}
                                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10">
                                            <Zap className="h-4 w-4 text-cyan-400" />
                                        </div>

                                        <span className="text-xs font-medium text-slate-300">
                                            {formatThreatType(type)}
                                        </span>
                                    </div>

                                    <span className="text-sm font-bold text-white">
                                        {count}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* =====================================
          LIVE SECURITY FEED
      ===================================== */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-cyan-400" />

                        <div>
                            <h2 className="font-semibold text-white">
                                Live Security Feed
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Alerts and incidents across the fleet
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <Radio className="h-3.5 w-3.5" />
                        LIVE
                    </div>
                </div>

                <div className="divide-y divide-slate-800/70">
                    {loading ? (
                        <div className="p-8 text-center text-sm text-slate-500">
                            Loading security events...
                        </div>
                    ) : recentEvents.length === 0 ? (
                        <EmptyState text="No security events available" />
                    ) : (
                        recentEvents.map((event) => (
                            <SecurityEvent
                                key={`${event.kind}-${event.id}`}
                                event={event}
                                formatTime={formatTime}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* =====================================
          VESSEL SECURITY + SYSTEM
      ===================================== */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
                {/* Vessel Security */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70">
                    <div className="border-b border-slate-800 px-5 py-4">
                        <div className="flex items-center gap-3">
                            <Ship className="h-5 w-5 text-cyan-400" />

                            <div>
                                <h2 className="font-semibold text-white">
                                    Fleet Security Status
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Vessel-level security posture
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-600">
                                    <th className="px-5 py-3">
                                        Vessel
                                    </th>

                                    <th className="px-5 py-3">
                                        Status
                                    </th>

                                    <th className="px-5 py-3">
                                        Active Events
                                    </th>

                                    <th className="px-5 py-3">
                                        Critical
                                    </th>

                                    <th className="px-5 py-3">
                                        Security
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {vesselSecurity.map((vessel) => {
                                    const securityStatus =
                                        vessel.critical > 0
                                            ? "CRITICAL"
                                            : vessel.active > 0
                                                ? "MONITOR"
                                                : "SECURE";

                                    return (
                                        <tr
                                            key={vessel._id}
                                            className="border-b border-slate-800/60 last:border-0"
                                        >
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        {vessel.name}
                                                    </p>

                                                    <p className="mt-0.5 text-[11px] text-slate-600">
                                                        {vessel.vesselId}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusDot status={vessel.status} />
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-300">
                                                {vessel.active}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={
                                                        vessel.critical > 0
                                                            ? "font-semibold text-red-400"
                                                            : "text-slate-600"
                                                    }
                                                >
                                                    {vessel.critical}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <SecurityBadge
                                                    status={securityStatus}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SOC Health */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-white">
                                SOC Health
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Security infrastructure status
                            </p>
                        </div>

                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>

                    <div className="mt-5 space-y-3">
                        <HealthRow
                            label="AI Detection Engine"
                            value="OPERATIONAL"
                            status="ONLINE"
                        />

                        <HealthRow
                            label="Alert Processing"
                            value="OPERATIONAL"
                            status="ONLINE"
                        />

                        <HealthRow
                            label="Incident Engine"
                            value="OPERATIONAL"
                            status="ONLINE"
                        />

                        <HealthRow
                            label="Fleet Telemetry"
                            value={`${vessels.length} VESSELS`}
                            status="ONLINE"
                        />

                        <HealthRow
                            label="Threat Intelligence"
                            value="ACTIVE"
                            status="ONLINE"
                        />
                    </div>

                    <div className="mt-5 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.03] p-4">
                        <div className="flex gap-3">
                            <Eye className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />

                            <div>
                                <p className="text-xs font-semibold text-cyan-300">
                                    Autonomous Monitoring
                                </p>

                                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                    MARINEAEGIS continuously analyzes
                                    vessel telemetry, AIS, GPS and
                                    security events for anomalous
                                    behavior.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* =====================================
          FOOTER STATUS
      ===================================== */}
            <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    Security monitoring active
                </div>

                <div className="flex items-center gap-4 text-slate-600">
                    <span>
                        {alerts.length} total alerts
                    </span>

                    <span>
                        {incidents.length} total incidents
                    </span>

                    <span>
                        {vessels.length} monitored vessels
                    </span>
                </div>
            </div>
        </div>
    );
};

// ========================================
// STAT CARD
// ========================================

const SecurityStat = ({
    icon: Icon,
    label,
    value,
    description,
    type,
}) => {
    const styles = {
        danger: {
            icon: "text-orange-400",
            bg: "bg-orange-400/10",
        },
        critical: {
            icon: "text-red-400",
            bg: "bg-red-400/10",
        },
        warning: {
            icon: "text-amber-400",
            bg: "bg-amber-400/10",
        },
        amber: {
            icon: "text-yellow-400",
            bg: "bg-yellow-400/10",
        },
        cyan: {
            icon: "text-cyan-400",
            bg: "bg-cyan-400/10",
        },
    };

    const style = styles[type];

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-slate-500">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-white">
                        {value}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-600">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.bg}`}
                >
                    <Icon className={`h-5 w-5 ${style.icon}`} />
                </div>
            </div>
        </div>
    );
};

// ========================================
// SEVERITY BAR
// ========================================

const SeverityBar = ({
    label,
    value,
    total,
    color,
    textColor,
}) => {
    const percentage =
        total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs ${textColor}`}>
                    {label}
                </span>

                <span className="text-xs text-slate-500">
                    {value} · {percentage}%
                </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                    className={`h-full rounded-full ${color} transition-all`}
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </div>
    );
};

// ========================================
// SECURITY EVENT
// ========================================

const SecurityEvent = ({
    event,
    formatTime,
}) => {
    const severityStyles = {
        CRITICAL: {
            icon: Siren,
            color: "text-red-400",
            bg: "bg-red-400/10",
            border: "border-red-400/10",
        },

        HIGH: {
            icon: ShieldAlert,
            color: "text-orange-400",
            bg: "bg-orange-400/10",
            border: "border-orange-400/10",
        },

        MEDIUM: {
            icon: AlertTriangle,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
            border: "border-amber-400/10",
        },

        LOW: {
            icon: Activity,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            border: "border-emerald-400/10",
        },
    };

    const style =
        severityStyles[event.severity] ||
        severityStyles.LOW;

    const Icon = style.icon;

    return (
        <div className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-900/30">
            <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.bg}`}
            >
                <Icon className={`h-4 w-4 ${style.color}`} />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-200">
                        {event.title}
                    </p>

                    <span
                        className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${style.bg} ${style.color} ${style.border}`}
                    >
                        {event.severity}
                    </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
                    <span>{event.eventId}</span>
                    <span>{event.vessel}</span>
                    <span>{formatThreatType(event.type)}</span>
                    <span>{event.source || "SYSTEM"}</span>
                </div>
            </div>

            <div className="hidden text-right sm:block">
                <p className="text-[10px] text-slate-600">
                    CONFIDENCE
                </p>

                <p className="mt-1 text-xs font-semibold text-cyan-400">
                    {event.confidence ?? "--"}%
                </p>
            </div>

            <div className="hidden w-16 text-right sm:block">
                <p className="text-[10px] text-slate-600">
                    {formatTime(event.detectedAt)}
                </p>
            </div>
        </div>
    );
};

// ========================================
// HEALTH ROW
// ========================================

const HealthRow = ({
    label,
    value,
    status,
}) => {
    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
            <div className="flex items-center gap-3">
                <span
                    className={`h-2 w-2 rounded-full ${status === "ONLINE"
                            ? "bg-emerald-400"
                            : "bg-red-400"
                        }`}
                />

                <span className="text-xs text-slate-400">
                    {label}
                </span>
            </div>

            <span
                className={`text-[10px] font-semibold ${status === "ONLINE"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
            >
                {value}
            </span>
        </div>
    );
};

// ========================================
// STATUS DOT
// ========================================

const StatusDot = ({ status }) => {
    const config = {
        ONLINE: "bg-emerald-400",
        OFFLINE: "bg-slate-500",
        WARNING: "bg-amber-400",
        CRITICAL: "bg-red-400",
    };

    return (
        <div className="flex items-center gap-2">
            <span
                className={`h-2 w-2 rounded-full ${config[status] || "bg-slate-500"
                    }`}
            />

            <span className="text-[10px] text-slate-500">
                {status}
            </span>
        </div>
    );
};

// ========================================
// SECURITY BADGE
// ========================================

const SecurityBadge = ({ status }) => {
    const config = {
        SECURE: {
            className:
                "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
        },

        MONITOR: {
            className:
                "border-amber-400/20 bg-amber-400/10 text-amber-400",
        },

        CRITICAL: {
            className:
                "border-red-400/20 bg-red-400/10 text-red-400",
        },
    };

    const item =
        config[status] || config.SECURE;

    return (
        <span
            className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${item.className}`}
        >
            {status}
        </span>
    );
};

// ========================================
// EMPTY STATE
// ========================================

const EmptyState = ({ text }) => {
    return (
        <div className="flex items-center justify-center px-5 py-10 text-sm text-slate-600">
            <XCircle className="mr-2 h-4 w-4" />
            {text}
        </div>
    );
};

// ========================================
// HELPERS
// ========================================

const formatThreatType = (type) => {
    if (!type) return "Unknown";

    return type
        .toLowerCase()
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
};

export default SOC;