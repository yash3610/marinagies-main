import DarkSelect from "../components/ui/DarkSelect";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    Clock3,
    Eye,
    Filter,
    Search,
    ShieldAlert,
    Ship,
    X,
    Zap,
    ThumbsUp,
    ThumbsDown,
    Sparkles,
} from "lucide-react";
import api from "../services/api";

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [vessels, setVessels] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [severity, setSeverity] = useState("ALL");
    const [status, setStatus] = useState("ALL");
    const [vesselFilter, setVesselFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");

    const [selectedAlert, setSelectedAlert] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    // ========================================
    // LOAD DATA
    // ========================================

    useEffect(() => {
        const loadAlerts = async () => {
            try {
                const [alertsRes, vesselsRes] = await Promise.all([
                    api.get("/alerts"),
                    api.get("/vessels"),
                ]);
                setAlerts(alertsRes.data?.alerts || []);
                setVessels(vesselsRes.data?.vessels || []);
            } catch (error) {
                console.error("Alerts loading error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadAlerts();
    }, []);

    // ========================================
    // UPDATE ALERT
    // ========================================

    const updateAlertStatus = async (alertId, newStatus) => {
        try {
            setUpdatingId(alertId);

            const response = await api.put(`/alerts/${alertId}`, {
                status: newStatus,
            });

            const updatedAlert = response.data?.alert;

            if (updatedAlert) {
                setAlerts((prev) =>
                    prev.map((alert) =>
                        alert._id === alertId
                            ? updatedAlert
                            : alert
                    )
                );

                if (selectedAlert?._id === alertId) {
                    setSelectedAlert(updatedAlert);
                }
            }
        } catch (error) {
            console.error("Alert update error:", error);
            alert(
                error.response?.data?.message ||
                "Failed to update alert"
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const submitExplanationFeedback = async (alertId, helpful) => {
        try {
            setUpdatingId(alertId);
            const response = await api.post(`/alerts/${alertId}/explanation-feedback`, { helpful });
            const updatedAlert = response.data?.alert;
            if (updatedAlert) {
                setAlerts((current) => current.map((item) => item._id === alertId ? updatedAlert : item));
                setSelectedAlert(updatedAlert);
            }
        } catch (error) {
            window.alert(error.response?.data?.message || "Failed to save explanation feedback");
        } finally {
            setUpdatingId(null);
        }
    };

    // ========================================
    // FILTER DATA
    // ========================================

    const filteredAlerts = useMemo(() => {
        return alerts.filter((alert) => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                !search ||
                alert.title?.toLowerCase().includes(searchText) ||
                alert.message?.toLowerCase().includes(searchText) ||
                alert.alertId?.toLowerCase().includes(searchText) ||
                alert.vessel?.name
                    ?.toLowerCase()
                    .includes(searchText) ||
                alert.vessel?.vesselId
                    ?.toLowerCase()
                    .includes(searchText);

            const matchesSeverity =
                severity === "ALL" ||
                alert.severity === severity;

            const matchesStatus =
                status === "ALL" ||
                alert.status === status;

            const matchesVessel =
                vesselFilter === "ALL" ||
                alert.vessel?._id === vesselFilter;

            const matchesType =
                typeFilter === "ALL" ||
                alert.type === typeFilter;

            return (
                matchesSearch &&
                matchesSeverity &&
                matchesStatus &&
                matchesVessel &&
                matchesType
            );
        });
    }, [
        alerts,
        search,
        severity,
        status,
        vesselFilter,
        typeFilter,
    ]);

    // ========================================
    // STATS
    // ========================================

    const stats = useMemo(() => {
        return {
            total: alerts.length,

            open: alerts.filter(
                (item) => item.status === "OPEN"
            ).length,

            critical: alerts.filter(
                (item) => item.severity === "CRITICAL"
            ).length,

            high: alerts.filter(
                (item) => item.severity === "HIGH"
            ).length,

            acknowledged: alerts.filter(
                (item) => item.status === "ACKNOWLEDGED"
            ).length,

            resolved: alerts.filter(
                (item) => ["RESOLVED", "FALSE_POSITIVE"].includes(item.status)
            ).length,
        };
    }, [alerts]);

    // ========================================
    // TYPES
    // ========================================

    const alertTypes = useMemo(() => {
        return [
            ...new Set(
                alerts
                    .map((alert) => alert.type)
                    .filter(Boolean)
            ),
        ];
    }, [alerts]);

    const formatType = (type) => {
        if (!type) return "--";

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

    const formatDate = (date) => {
        if (!date) return "--";

        return new Date(date).toLocaleString([], {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const clearFilters = () => {
        setSearch("");
        setSeverity("ALL");
        setStatus("ALL");
        setVesselFilter("ALL");
        setTypeFilter("ALL");
    };

    return (
        <div className="space-y-5">
            {/* ========================================
          HEADER
      ======================================== */}

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
                        <ShieldAlert className="h-5 w-5 text-red-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Security Alerts
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Monitor, investigate and manage
                            maritime security alerts
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    </span>

                    <span className="text-xs font-medium text-cyan-400">
                        ALERT MONITORING ACTIVE
                    </span>
                </div>
            </div>

            {/* ========================================
          STAT CARDS
      ======================================== */}

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
                <AlertStat
                    icon={Bell}
                    label="Total"
                    value={stats.total}
                    color="cyan"
                />

                <AlertStat
                    icon={AlertTriangle}
                    label="Open"
                    value={stats.open}
                    color="orange"
                />

                <AlertStat
                    icon={ShieldAlert}
                    label="Critical"
                    value={stats.critical}
                    color="red"
                />

                <AlertStat
                    icon={Zap}
                    label="High"
                    value={stats.high}
                    color="amber"
                />

                <AlertStat
                    icon={Clock3}
                    label="Acknowledged"
                    value={stats.acknowledged}
                    color="purple"
                />

                <AlertStat
                    icon={CheckCircle2}
                    label="Resolved"
                    value={stats.resolved}
                    color="green"
                />
            </div>

            {/* ========================================
          FILTER PANEL
      ======================================== */}

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-cyan-400" />

                        <span className="text-sm font-semibold text-white">
                            Alert Filters
                        </span>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="text-xs text-slate-500 transition hover:text-cyan-400"
                    >
                        Clear filters
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {/* Search */}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                        <input
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search alerts..."
                            className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/70 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/40"
                        />
                    </div>

                    {/* Severity */}

                    <DarkSelect
                        value={severity}
                        onChange={(e) =>
                            setSeverity(e.target.value)
                        }
                        className="h-10 rounded-lg border border-slate-800 bg-slate-900/70 px-3 text-xs text-slate-300 outline-none focus:border-cyan-400/40"
                    >
                        <option value="ALL">
                            All Severities
                        </option>
                        <option value="CRITICAL">
                            Critical
                        </option>
                        <option value="HIGH">
                            High
                        </option>
                        <option value="MEDIUM">
                            Medium
                        </option>
                        <option value="LOW">
                            Low
                        </option>
                    </DarkSelect>

                    {/* Status */}

                    <DarkSelect
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value)
                        }
                        className="h-10 rounded-lg border border-slate-800 bg-slate-900/70 px-3 text-xs text-slate-300 outline-none focus:border-cyan-400/40"
                    >
                        <option value="ALL">
                            All Statuses
                        </option>
                        <option value="OPEN">Open</option>
                        <option value="ACKNOWLEDGED">
                            Acknowledged
                        </option>
                        <option value="RESOLVED">
                            Resolved
                        </option>
                        <option value="FALSE_POSITIVE">False Positive</option>
                    </DarkSelect>

                    {/* Vessel */}

                    <DarkSelect
                        value={vesselFilter}
                        onChange={(e) =>
                            setVesselFilter(e.target.value)
                        }
                        className="h-10 rounded-lg border border-slate-800 bg-slate-900/70 px-3 text-xs text-slate-300 outline-none focus:border-cyan-400/40"
                    >
                        <option value="ALL">
                            All Vessels
                        </option>

                        {vessels.map((vessel) => (
                            <option
                                key={vessel._id}
                                value={vessel._id}
                            >
                                {vessel.name}
                            </option>
                        ))}
                    </DarkSelect>

                    {/* Type */}

                    <DarkSelect
                        value={typeFilter}
                        onChange={(e) =>
                            setTypeFilter(e.target.value)
                        }
                        className="h-10 rounded-lg border border-slate-800 bg-slate-900/70 px-3 text-xs text-slate-300 outline-none focus:border-cyan-400/40"
                    >
                        <option value="ALL">
                            All Alert Types
                        </option>

                        {alertTypes.map((type) => (
                            <option key={type} value={type}>
                                {formatType(type)}
                            </option>
                        ))}
                    </DarkSelect>
                </div>
            </div>

            {/* ========================================
          ALERT TABLE
      ======================================== */}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-white">
                            Alert Registry
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Showing {filteredAlerts.length} of{" "}
                            {alerts.length} alerts
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        SYSTEM ONLINE
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-sm text-slate-500">
                        Loading alerts...
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Bell className="h-8 w-8 text-slate-700" />

                        <p className="mt-3 text-sm text-slate-500">
                            No alerts found
                        </p>

                        <button
                            onClick={clearFilters}
                            className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left">
                            <thead>
                                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-600">
                                    <th className="px-5 py-3">
                                        Alert
                                    </th>

                                    <th className="px-5 py-3">
                                        Vessel
                                    </th>

                                    <th className="px-5 py-3">
                                        Severity
                                    </th>

                                    <th className="px-5 py-3">
                                        Status
                                    </th>

                                    <th className="px-5 py-3">
                                        Confidence
                                    </th>

                                    <th className="px-5 py-3">
                                        Source
                                    </th>

                                    <th className="px-5 py-3">
                                        Detected
                                    </th>

                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAlerts.map((alert) => (
                                    <AlertRow
                                        key={alert._id}
                                        alert={alert}
                                        updatingId={updatingId}
                                        onView={() =>
                                            setSelectedAlert(alert)
                                        }
                                        onAcknowledge={() =>
                                            updateAlertStatus(
                                                alert._id,
                                                "ACKNOWLEDGED"
                                            )
                                        }
                                        onResolve={() =>
                                            updateAlertStatus(
                                                alert._id,
                                                "RESOLVED"
                                            )
                                        }
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ========================================
          DETAIL MODAL
      ======================================== */}

            {selectedAlert && (
                <AlertDetailsModal
                    alert={selectedAlert}
                    onClose={() =>
                        setSelectedAlert(null)
                    }
                    onAcknowledge={() =>
                        updateAlertStatus(
                            selectedAlert._id,
                            "ACKNOWLEDGED"
                        )
                    }
                    onResolve={() =>
                        updateAlertStatus(
                            selectedAlert._id,
                            "RESOLVED"
                        )
                    }
                    onFalsePositive={() =>
                        updateAlertStatus(
                            selectedAlert._id,
                            "FALSE_POSITIVE"
                        )
                    }
                    onFeedback={(helpful) => submitExplanationFeedback(selectedAlert._id, helpful)}
                    updating={
                        updatingId === selectedAlert._id
                    }
                    formatDate={formatDate}
                    formatType={formatType}
                />
            )}
        </div>
    );
};

// ========================================
// STAT CARD
// ========================================

const AlertStat = ({
    icon: Icon,
    label,
    value,
    color,
}) => {
    const colors = {
        cyan: {
            icon: "text-cyan-400",
            bg: "bg-cyan-400/10",
        },
        orange: {
            icon: "text-orange-400",
            bg: "bg-orange-400/10",
        },
        red: {
            icon: "text-red-400",
            bg: "bg-red-400/10",
        },
        amber: {
            icon: "text-amber-400",
            bg: "bg-amber-400/10",
        },
        purple: {
            icon: "text-purple-400",
            bg: "bg-purple-400/10",
        },
        green: {
            icon: "text-emerald-400",
            bg: "bg-emerald-400/10",
        },
    };

    const style = colors[color];

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
                </div>

                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${style.bg}`}
                >
                    <Icon
                        className={`h-4 w-4 ${style.icon}`}
                    />
                </div>
            </div>
        </div>
    );
};

// ========================================
// ALERT ROW
// ========================================

const AlertRow = ({
    alert,
    updatingId,
    onView,
    onAcknowledge,
    onResolve,
}) => {
    const severity = getSeverityConfig(
        alert.severity
    );

    return (
        <tr className="border-b border-slate-800/60 transition hover:bg-slate-900/40">
            {/* Alert */}

            <td className="px-5 py-4">
                <div className="flex items-start gap-3">
                    <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${severity.bg}`}
                    >
                        <AlertTriangle
                            className={`h-4 w-4 ${severity.text}`}
                        />
                    </div>

                    <div className="min-w-0">
                        <p className="max-w-[260px] truncate text-sm font-medium text-slate-200">
                            {alert.title}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-600">
                            {alert.alertId}
                        </p>
                    </div>
                </div>
            </td>

            {/* Vessel */}

            <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                    <Ship className="h-3.5 w-3.5 text-cyan-400" />

                    <div>
                        <p className="text-xs text-slate-300">
                            {alert.vessel?.name ||
                                "Unknown Vessel"}
                        </p>

                        <p className="text-[10px] text-slate-600">
                            {alert.vessel?.vesselId || "--"}
                        </p>
                    </div>
                </div>
            </td>

            {/* Severity */}

            <td className="px-5 py-4">
                <SeverityBadge
                    severity={alert.severity}
                />
            </td>

            {/* Status */}

            <td className="px-5 py-4">
                <StatusBadge status={alert.status} />
            </td>

            {/* Confidence */}

            <td className="px-5 py-4">
                <div className="w-20">
                    <div className="mb-1 flex justify-between">
                        <span className="text-[10px] text-slate-600">
                            AI
                        </span>

                        <span className="text-[10px] font-semibold text-cyan-400">
                            {alert.confidence ?? "--"}%
                        </span>
                    </div>

                    <div className="h-1 overflow-hidden rounded-full bg-slate-800">
                        <div
                            className="h-full rounded-full bg-cyan-400"
                            style={{
                                width: `${Math.min(
                                    Number(alert.confidence || 0),
                                    100
                                )}%`,
                            }}
                        />
                    </div>
                </div>
            </td>

            {/* Source */}

            <td className="px-5 py-4">
                <span className="text-[10px] text-slate-500">
                    {alert.source || "SYSTEM"}
                </span>
            </td>

            {/* Time */}

            <td className="px-5 py-4">
                <span className="text-[10px] text-slate-500">
                    {formatRelativeTime(
                        alert.detectedAt
                    )}
                </span>
            </td>

            {/* Actions */}

            <td className="px-5 py-4">
                <div className="flex justify-end gap-1.5">
                    <button
                        onClick={onView}
                        title="View details"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-500 transition hover:border-cyan-400/30 hover:bg-cyan-400/5 hover:text-cyan-400"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </button>

                    {alert.status === "OPEN" && (
                        <button
                            onClick={onAcknowledge}
                            disabled={updatingId === alert._id}
                            title="Acknowledge"
                            className="flex h-8 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/5 px-2.5 text-[10px] text-amber-400 transition hover:bg-amber-400/10 disabled:opacity-50"
                        >
                            ACK
                        </button>
                    )}

                    {!["RESOLVED", "FALSE_POSITIVE"].includes(alert.status) && (
                        <button
                            onClick={onResolve}
                            disabled={updatingId === alert._id}
                            title="Resolve"
                            className="flex h-8 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-2.5 text-[10px] text-emerald-400 transition hover:bg-emerald-400/10 disabled:opacity-50"
                        >
                            RESOLVE
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

// ========================================
// DETAIL MODAL
// ========================================

const AlertDetailsModal = ({
    alert,
    onClose,
    onAcknowledge,
    onResolve,
    onFalsePositive,
    onFeedback,
    updating,
    formatDate,
    formatType,
}) => {
    useEffect(() => {
        const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [onClose]);

    const severity = getSeverityConfig(
        alert.severity
    );

    return createPortal(
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 z-[2000] flex items-end justify-center overflow-y-auto bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div role="dialog" aria-modal="true" aria-label="Alert details" className="marine-scrollbar max-h-[96dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-2xl border border-white/[0.08] bg-[#08111f] shadow-[0_28px_100px_rgba(0,0,0,.72)] sm:max-h-[90dvh] sm:rounded-2xl">
                {/* Modal Header */}

                <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/[0.07] bg-[#08111f]/95 p-5 backdrop-blur-xl">
                    <div className="flex items-start gap-3">
                        <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${severity.bg}`}
                        >
                            <ShieldAlert
                                className={`h-5 w-5 ${severity.text}`}
                            />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-bold text-white">
                                    {alert.title}
                                </h2>

                                <SeverityBadge
                                    severity={alert.severity}
                                />
                            </div>

                            <p className="mt-1 text-xs text-slate-600">
                                {alert.alertId}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Modal Body */}

                <div className="space-y-5 p-5">
                    {/* Description */}

                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Alert Message
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            {alert.message ||
                                "No additional message available."}
                        </p>
                    </div>

                    {/* Information Grid */}

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <DetailItem
                            label="Vessel"
                            value={
                                alert.vessel?.name ||
                                "Unknown Vessel"
                            }
                        />

                        <DetailItem
                            label="Vessel ID"
                            value={
                                alert.vessel?.vesselId || "--"
                            }
                        />

                        <DetailItem
                            label="Alert Type"
                            value={formatType(alert.type)}
                        />

                        <DetailItem
                            label="Status"
                            value={alert.status}
                        />

                        <DetailItem
                            label="Source"
                            value={alert.source || "--"}
                        />

                        <DetailItem
                            label="Confidence"
                            value={`${alert.confidence ?? "--"}%`}
                        />

                        <DetailItem
                            label="Detected At"
                            value={formatDate(alert.detectedAt)}
                        />

                        <DetailItem
                            label="Created At"
                            value={formatDate(alert.createdAt)}
                        />

                        <DetailItem
                            label="Resolved At"
                            value={
                                alert.resolvedAt
                                    ? formatDate(alert.resolvedAt)
                                    : "Not resolved"
                            }
                        />
                    </div>

                    {alert.explanation && (
                        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                                <Sparkles className="h-3.5 w-3.5" /> Why {alert.module || "MarineAegis"} flagged this
                            </p>
                            <div className="mt-3 space-y-3 text-sm">
                                <div>
                                    <p className="text-xs text-slate-500">What happened</p>
                                    <p className="mt-1 text-slate-200">{alert.explanation.whatHappened}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Why it matters</p>
                                    <p className="mt-1 text-slate-200">{alert.explanation.whyItMatters}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Evidence</p>
                                    <p className="mt-1 text-slate-200">{alert.explanation.whatCausedIt}</p>
                                </div>
                                {alert.explanation.evidenceSummary?.length > 0 && <div>
                                    <p className="text-xs text-slate-500">Evidence snapshot</p>
                                    <ul className="mt-1 space-y-1 font-mono text-[10px] text-slate-400">{alert.explanation.evidenceSummary.map((item) => <li key={item}>{item}</li>)}</ul>
                                </div>}
                                <div>
                                    <p className="text-xs text-slate-500">Recommended action</p>
                                    <p className="mt-1 text-cyan-200">{alert.explanation.recommendedAction}</p>
                                </div>
                                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                                    <p className="text-xs text-slate-500">Decision engine</p>
                                    {alert.explanation.decisionSupport?.used ? <p className="mt-1 text-xs text-purple-300">ML: {alert.explanation.decisionSupport.modelKey} v{alert.explanation.decisionSupport.version} | {alert.explanation.decisionSupport.algorithm || alert.explanation.decisionSupport.engine} | {alert.explanation.decisionSupport.probability}%</p> : <p className="mt-1 text-xs text-slate-300">Explainable deterministic rules (no ML model used for this alert)</p>}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-400/10 pt-3">
                                    <p className="text-xs text-slate-500">Was this explanation useful?</p>
                                    <div className="flex gap-2"><button type="button" disabled={updating} onClick={() => onFeedback(true)} className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] ${alert.explanationFeedbackSummary?.userVote === true ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-slate-700 text-slate-400"}`}><ThumbsUp className="h-3 w-3" /> Helpful ({alert.explanationFeedbackSummary?.helpful || 0})</button><button type="button" disabled={updating} onClick={() => onFeedback(false)} className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] ${alert.explanationFeedbackSummary?.userVote === false ? "border-red-400/40 bg-red-400/10 text-red-300" : "border-slate-700 text-slate-400"}`}><ThumbsDown className="h-3 w-3" /> Not helpful ({alert.explanationFeedbackSummary?.notHelpful || 0})</button></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Confidence */}

                    <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BrainIcon />

                                <span className="text-xs font-semibold text-slate-300">
                                    Detection Confidence
                                </span>
                            </div>

                            <span className="text-sm font-bold text-cyan-400">
                                {alert.confidence ?? "--"}%
                            </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                                className="h-full rounded-full bg-cyan-400"
                                style={{
                                    width: `${Math.min(
                                        Number(alert.confidence || 0),
                                        100
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}

                <div className="flex flex-col gap-2 border-t border-slate-800 p-5 sm:flex-row sm:justify-end">
                    {alert.status === "OPEN" && (
                        <button
                            onClick={onAcknowledge}
                            disabled={updating}
                            className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-2.5 text-xs font-medium text-amber-400 transition hover:bg-amber-400/10 disabled:opacity-50"
                        >
                            Acknowledge Alert
                        </button>
                    )}

                    {!["RESOLVED", "FALSE_POSITIVE"].includes(alert.status) && (
                        <button
                            onClick={onFalsePositive}
                            disabled={updating}
                            className="rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                        >
                            Mark False Positive
                        </button>
                    )}

                    {!["RESOLVED", "FALSE_POSITIVE"].includes(alert.status) && (
                        <button
                            onClick={onResolve}
                            disabled={updating}
                            className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-2.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-400/10 disabled:opacity-50"
                        >
                            Resolve Alert
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ========================================
// DETAIL ITEM
// ========================================

const DetailItem = ({
    label,
    value,
}) => {
    return (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">
                {label}
            </p>

            <p className="mt-1 truncate text-xs font-medium text-slate-300">
                {value}
            </p>
        </div>
    );
};

// ========================================
// SEVERITY BADGE
// ========================================

const SeverityBadge = ({ severity }) => {
    const config = getSeverityConfig(
        severity
    );

    return (
        <span
            className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${config.border} ${config.bg} ${config.text}`}
        >
            {severity || "UNKNOWN"}
        </span>
    );
};

// ========================================
// STATUS BADGE
// ========================================

const StatusBadge = ({ status }) => {
    const config = {
        OPEN: {
            text: "text-orange-400",
            bg: "bg-orange-400/10",
            border: "border-orange-400/20",
        },

        ACKNOWLEDGED: {
            text: "text-cyan-400",
            bg: "bg-cyan-400/10",
            border: "border-cyan-400/20",
        },

        RESOLVED: {
            text: "text-emerald-400",
            bg: "bg-emerald-400/10",
            border: "border-emerald-400/20",
        },
        FALSE_POSITIVE: {
            text: "text-slate-300",
            bg: "bg-slate-500/10",
            border: "border-slate-500/20",
        },
    };

    const style =
        config[status] || {
            text: "text-slate-400",
            bg: "bg-slate-800",
            border: "border-slate-700",
        };

    return (
        <span
            className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${style.text} ${style.bg} ${style.border}`}
        >
            {status || "UNKNOWN"}
        </span>
    );
};

// ========================================
// SEVERITY CONFIG
// ========================================

const getSeverityConfig = (severity) => {
    const config = {
        CRITICAL: {
            text: "text-red-400",
            bg: "bg-red-400/10",
            border: "border-red-400/20",
        },

        HIGH: {
            text: "text-orange-400",
            bg: "bg-orange-400/10",
            border: "border-orange-400/20",
        },

        MEDIUM: {
            text: "text-amber-400",
            bg: "bg-amber-400/10",
            border: "border-amber-400/20",
        },

        LOW: {
            text: "text-emerald-400",
            bg: "bg-emerald-400/10",
            border: "border-emerald-400/20",
        },
    };

    return (
        config[severity] || {
            text: "text-slate-400",
            bg: "bg-slate-800",
            border: "border-slate-700",
        }
    );
};

// ========================================
// BRAIN ICON
// ========================================

const BrainIcon = () => {
    return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
        </div>
    );
};

// ========================================
// RELATIVE TIME
// ========================================

const formatRelativeTime = (date) => {
    if (!date) return "--";

    const diff =
        Date.now() - new Date(date).getTime();

    const minutes = Math.floor(
        diff / (1000 * 60)
    );

    if (minutes < 1) return "Just now";

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days}d ago`;
};

export default Alerts;
