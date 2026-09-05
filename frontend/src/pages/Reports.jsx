import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertTriangle,
    BarChart3,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileBarChart,
    FileText,
    Filter,
    Printer,
    RefreshCw,
    ShieldAlert,
    Ship,
    Siren,
    TrendingUp,
    XCircle,
} from "lucide-react";
import api from "../services/api";

const Reports = () => {
    const [vessels, setVessels] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [reportType, setReportType] =
        useState("SECURITY_SUMMARY");

    const [period, setPeriod] =
        useState("ALL");

    const [selectedVessel, setSelectedVessel] =
        useState("ALL");

    useEffect(() => {
        loadReportData();
    }, []);

    const loadReportData = async () => {
        try {
            setLoading(true);

            const [vesselRes, alertRes, incidentRes] =
                await Promise.all([
                    api.get("/vessels"),
                    api.get("/alerts"),
                    api.get("/incidents"),
                ]);

            setVessels(
                vesselRes.data?.vessels || []
            );

            setAlerts(
                alertRes.data?.alerts || []
            );

            setIncidents(
                incidentRes.data?.incidents || []
            );
        } catch (error) {
            console.error(
                "Report data loading error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // FILTER DATA
    // ========================================

    const filteredIncidents = useMemo(() => {
        return incidents.filter((incident) => {
            const matchesVessel =
                selectedVessel === "ALL" ||
                incident.vessel?._id === selectedVessel;

            const matchesPeriod =
                period === "ALL" ||
                isWithinPeriod(
                    incident.detectedAt,
                    period
                );

            return (
                matchesVessel &&
                matchesPeriod
            );
        });
    }, [
        incidents,
        selectedVessel,
        period,
    ]);

    const filteredAlerts = useMemo(() => {
        return alerts.filter((alert) => {
            const matchesVessel =
                selectedVessel === "ALL" ||
                alert.vessel?._id === selectedVessel;

            const matchesPeriod =
                period === "ALL" ||
                isWithinPeriod(
                    alert.detectedAt,
                    period
                );

            return (
                matchesVessel &&
                matchesPeriod
            );
        });
    }, [
        alerts,
        selectedVessel,
        period,
    ]);

    // ========================================
    // REPORT STATS
    // ========================================

    const stats = useMemo(() => {
        const criticalAlerts =
            filteredAlerts.filter(
                (item) =>
                    item.severity === "CRITICAL"
            ).length;

        const highAlerts =
            filteredAlerts.filter(
                (item) =>
                    item.severity === "HIGH"
            ).length;

        const openIncidents =
            filteredIncidents.filter(
                (item) =>
                    item.status === "OPEN" ||
                    item.status === "INVESTIGATING"
            ).length;

        const resolvedIncidents =
            filteredIncidents.filter(
                (item) =>
                    item.status === "RESOLVED" ||
                    item.status === "CLOSED"
            ).length;

        const criticalIncidents =
            filteredIncidents.filter(
                (item) =>
                    item.severity === "CRITICAL"
            ).length;

        const averageConfidence =
            filteredAlerts.length ||
                filteredIncidents.length
                ? Math.round(
                    [
                        ...filteredAlerts,
                        ...filteredIncidents,
                    ].reduce(
                        (sum, item) =>
                            sum +
                            Number(
                                item.confidence || 0
                            ),
                        0
                    ) /
                    [
                        ...filteredAlerts,
                        ...filteredIncidents,
                    ].length
                )
                : 0;

        return {
            totalAlerts: filteredAlerts.length,
            criticalAlerts,
            highAlerts,
            totalIncidents:
                filteredIncidents.length,
            openIncidents,
            resolvedIncidents,
            criticalIncidents,
            averageConfidence,
        };
    }, [
        filteredAlerts,
        filteredIncidents,
    ]);

    // ========================================
    // ALERT BREAKDOWN
    // ========================================

    const alertBreakdown = useMemo(() => {
        const result = {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0,
        };

        filteredAlerts.forEach((alert) => {
            if (result[alert.severity] !== undefined) {
                result[alert.severity]++;
            }
        });

        return result;
    }, [filteredAlerts]);

    // ========================================
    // INCIDENT BREAKDOWN
    // ========================================

    const incidentBreakdown = useMemo(() => {
        const result = {
            OPEN: 0,
            INVESTIGATING: 0,
            CONTAINED: 0,
            RESOLVED: 0,
            CLOSED: 0,
        };

        filteredIncidents.forEach(
            (incident) => {
                if (
                    result[incident.status] !==
                    undefined
                ) {
                    result[incident.status]++;
                }
            }
        );

        return result;
    }, [filteredIncidents]);

    // ========================================
    // TOP THREATS
    // ========================================

    const topThreats = useMemo(() => {
        const map = {};

        filteredAlerts.forEach((alert) => {
            const type =
                alert.type || "OTHER";

            if (!map[type]) {
                map[type] = 0;
            }

            map[type]++;
        });

        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }, [filteredAlerts]);

    // ========================================
    // GENERATE / PRINT REPORT
    // ========================================

    const printReport = () => {
        window.print();
    };

    const reportTitle =
        reportType === "SECURITY_SUMMARY"
            ? "Maritime Security Summary"
            : reportType === "INCIDENT_REPORT"
                ? "Incident Analysis Report"
                : reportType === "ALERT_REPORT"
                    ? "Threat & Alert Report"
                    : "Fleet Risk Report";

    return (
        <div className="space-y-5">
            {/* ========================================
          HEADER
      ======================================== */}

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                        <FileBarChart className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Security Reports
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Generate and analyze maritime
                            security intelligence reports
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={loadReportData}
                        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400 transition hover:border-slate-700 hover:text-white"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 ${loading
                                    ? "animate-spin"
                                    : ""
                                }`}
                        />
                        Refresh
                    </button>

                    <button
                        onClick={printReport}
                        className="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-400 transition hover:bg-cyan-400/15"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Print Report
                    </button>
                </div>
            </div>

            {/* ========================================
          REPORT CONTROLS
      ======================================== */}

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 print:hidden">
                <div className="mb-4 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-cyan-400" />

                    <span className="text-sm font-semibold text-white">
                        Report Configuration
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <ReportSelect
                        label="Report Type"
                        value={reportType}
                        onChange={setReportType}
                        options={[
                            [
                                "SECURITY_SUMMARY",
                                "Security Summary",
                            ],
                            [
                                "INCIDENT_REPORT",
                                "Incident Analysis",
                            ],
                            [
                                "ALERT_REPORT",
                                "Threat & Alert Report",
                            ],
                            [
                                "FLEET_RISK",
                                "Fleet Risk Report",
                            ],
                        ]}
                    />

                    <ReportSelect
                        label="Time Period"
                        value={period}
                        onChange={setPeriod}
                        options={[
                            ["ALL", "All Available Data"],
                            ["TODAY", "Today"],
                            ["7D", "Last 7 Days"],
                            ["30D", "Last 30 Days"],
                        ]}
                    />

                    <ReportSelect
                        label="Vessel"
                        value={selectedVessel}
                        onChange={setSelectedVessel}
                        options={[
                            ["ALL", "Entire Fleet"],
                            ...vessels.map((vessel) => [
                                vessel._id,
                                vessel.name,
                            ]),
                        ]}
                    />
                </div>
            </div>

            {/* ========================================
          REPORT DOCUMENT
      ======================================== */}

            <div
                id="security-report"
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
            >
                {/* REPORT HEADER */}

                <div className="relative overflow-hidden border-b border-slate-800 p-6 md:p-8">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-20"
                        style={{
                            backgroundImage:
                                "linear-gradient(rgba(34,211,238,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.12) 1px, transparent 1px)",
                            backgroundSize: "40px 40px",
                        }}
                    />

                    <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] text-cyan-400">
                                <ShieldAlert className="h-4 w-4" />
                                MARINEAEGIS
                            </div>

                            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                                {reportTitle}
                            </h2>

                            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                                Autonomous maritime cyber defense
                                and intelligence assessment based
                                on current vessel, alert and incident
                                telemetry.
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                Generated
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-300">
                                {new Date().toLocaleDateString(
                                    [],
                                    {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    }
                                )}
                            </p>

                            <p className="mt-1 text-[10px] text-cyan-400">
                                LIVE DATASET
                            </p>
                        </div>
                    </div>
                </div>

                {/* EXECUTIVE SUMMARY */}

                <div className="border-b border-slate-800 p-6 md:p-8">
                    <div className="mb-5 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-cyan-400" />

                        <h3 className="font-semibold text-white">
                            Executive Summary
                        </h3>
                    </div>

                    <p className="max-w-4xl text-sm leading-7 text-slate-400">
                        The current fleet security posture
                        contains{" "}
                        <span className="font-semibold text-white">
                            {stats.totalIncidents}
                        </span>{" "}
                        recorded incidents and{" "}
                        <span className="font-semibold text-white">
                            {stats.totalAlerts}
                        </span>{" "}
                        security alerts in the selected
                        reporting scope.{" "}
                        {stats.criticalIncidents > 0
                            ? `There are ${stats.criticalIncidents} critical incident(s) requiring priority attention.`
                            : "No critical incidents are currently recorded in this reporting scope."}{" "}
                        The average automated detection
                        confidence is{" "}
                        <span className="font-semibold text-cyan-400">
                            {stats.averageConfidence}%
                        </span>
                        .
                    </p>
                </div>

                {/* KPI */}

                <div className="grid grid-cols-2 border-b border-slate-800 md:grid-cols-4">
                    <ReportKPI
                        icon={Siren}
                        label="Total Alerts"
                        value={stats.totalAlerts}
                        type="cyan"
                    />

                    <ReportKPI
                        icon={AlertTriangle}
                        label="Critical Alerts"
                        value={stats.criticalAlerts}
                        type="red"
                    />

                    <ReportKPI
                        icon={Activity}
                        label="Active Incidents"
                        value={stats.openIncidents}
                        type="orange"
                    />

                    <ReportKPI
                        icon={CheckCircle2}
                        label="Resolved"
                        value={stats.resolvedIncidents}
                        type="green"
                    />
                </div>

                {/* ANALYTICS */}

                <div className="grid grid-cols-1 gap-4 border-b border-slate-800 p-6 md:p-8 lg:grid-cols-2">
                    {/* Alert Severity */}

                    <ReportPanel
                        icon={BarChart3}
                        title="Alert Severity Distribution"
                    >
                        <div className="space-y-4">
                            <DistributionRow
                                label="Critical"
                                value={
                                    alertBreakdown.CRITICAL
                                }
                                total={stats.totalAlerts}
                                type="critical"
                            />

                            <DistributionRow
                                label="High"
                                value={
                                    alertBreakdown.HIGH
                                }
                                total={stats.totalAlerts}
                                type="high"
                            />

                            <DistributionRow
                                label="Medium"
                                value={
                                    alertBreakdown.MEDIUM
                                }
                                total={stats.totalAlerts}
                                type="medium"
                            />

                            <DistributionRow
                                label="Low"
                                value={
                                    alertBreakdown.LOW
                                }
                                total={stats.totalAlerts}
                                type="low"
                            />
                        </div>
                    </ReportPanel>

                    {/* Incident Status */}

                    <ReportPanel
                        icon={Activity}
                        title="Incident Lifecycle"
                    >
                        <div className="space-y-4">
                            <DistributionRow
                                label="Open"
                                value={
                                    incidentBreakdown.OPEN
                                }
                                total={stats.totalIncidents}
                                type="open"
                            />

                            <DistributionRow
                                label="Investigating"
                                value={
                                    incidentBreakdown.INVESTIGATING
                                }
                                total={stats.totalIncidents}
                                type="investigating"
                            />

                            <DistributionRow
                                label="Contained"
                                value={
                                    incidentBreakdown.CONTAINED
                                }
                                total={stats.totalIncidents}
                                type="contained"
                            />

                            <DistributionRow
                                label="Resolved"
                                value={
                                    incidentBreakdown.RESOLVED
                                }
                                total={stats.totalIncidents}
                                type="resolved"
                            />

                            <DistributionRow
                                label="Closed"
                                value={
                                    incidentBreakdown.CLOSED
                                }
                                total={stats.totalIncidents}
                                type="closed"
                            />
                        </div>
                    </ReportPanel>
                </div>

                {/* THREATS + FLEET */}

                <div className="grid grid-cols-1 gap-4 border-b border-slate-800 p-6 md:p-8 lg:grid-cols-2">
                    {/* Threat categories */}

                    <ReportPanel
                        icon={TrendingUp}
                        title="Top Threat Categories"
                    >
                        {topThreats.length === 0 ? (
                            <EmptyReportState />
                        ) : (
                            <div className="space-y-3">
                                {topThreats.map(
                                    ([type, count], index) => {
                                        const max =
                                            topThreats[0]?.[1] ||
                                            1;

                                        return (
                                            <div
                                                key={type}
                                                className="rounded-lg border border-slate-800 bg-slate-900/30 p-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-400/10 text-[10px] font-bold text-cyan-400">
                                                            {index + 1}
                                                        </span>

                                                        <span className="text-xs text-slate-300">
                                                            {formatType(type)}
                                                        </span>
                                                    </div>

                                                    <span className="text-xs font-semibold text-white">
                                                        {count}
                                                    </span>
                                                </div>

                                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                                                    <div
                                                        className="h-full rounded-full bg-cyan-400"
                                                        style={{
                                                            width: `${(count /
                                                                    max) *
                                                                100
                                                                }%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </ReportPanel>

                    {/* Fleet risk */}

                    <ReportPanel
                        icon={Ship}
                        title="Fleet Risk Snapshot"
                    >
                        <div className="space-y-3">
                            {vessels.map((vessel) => (
                                <div
                                    key={vessel._id}
                                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10">
                                            <Ship className="h-4 w-4 text-cyan-400" />
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium text-slate-300">
                                                {vessel.name}
                                            </p>

                                            <p className="mt-0.5 text-[9px] text-slate-600">
                                                {vessel.vesselId}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p
                                            className={`text-sm font-bold ${getRiskColor(
                                                vessel.riskLevel
                                            )}`}
                                        >
                                            {vessel.riskScore}
                                        </p>

                                        <p
                                            className={`text-[9px] font-semibold ${getRiskColor(
                                                vessel.riskLevel
                                            )}`}
                                        >
                                            {vessel.riskLevel}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ReportPanel>
                </div>

                {/* RECENT INCIDENTS */}

                <div className="p-6 md:p-8">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-orange-400" />

                            <h3 className="font-semibold text-white">
                                Incident Register
                            </h3>
                        </div>

                        <span className="text-[10px] text-slate-600">
                            {filteredIncidents.length} RECORDS
                        </span>
                    </div>

                    {filteredIncidents.length ===
                        0 ? (
                        <EmptyReportState />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left">
                                <thead>
                                    <tr className="border-b border-slate-800 text-[9px] uppercase tracking-wider text-slate-600">
                                        <th className="px-3 py-3">
                                            Incident
                                        </th>

                                        <th className="px-3 py-3">
                                            Vessel
                                        </th>

                                        <th className="px-3 py-3">
                                            Severity
                                        </th>

                                        <th className="px-3 py-3">
                                            Status
                                        </th>

                                        <th className="px-3 py-3">
                                            Confidence
                                        </th>

                                        <th className="px-3 py-3">
                                            Detected
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredIncidents.map(
                                        (incident) => (
                                            <tr
                                                key={incident._id}
                                                className="border-b border-slate-800/50"
                                            >
                                                <td className="px-3 py-3">
                                                    <p className="text-xs font-medium text-slate-300">
                                                        {incident.title}
                                                    </p>

                                                    <p className="mt-1 text-[9px] text-slate-600">
                                                        {
                                                            incident.incidentId
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-3 py-3 text-xs text-slate-400">
                                                    {incident.vessel
                                                        ?.name ||
                                                        "--"}
                                                </td>

                                                <td className="px-3 py-3">
                                                    <SeverityBadge
                                                        severity={
                                                            incident.severity
                                                        }
                                                    />
                                                </td>

                                                <td className="px-3 py-3">
                                                    <StatusBadge
                                                        status={
                                                            incident.status
                                                        }
                                                    />
                                                </td>

                                                <td className="px-3 py-3 text-xs font-semibold text-cyan-400">
                                                    {incident.confidence ??
                                                        "--"}
                                                    %
                                                </td>

                                                <td className="px-3 py-3 text-[10px] text-slate-600">
                                                    {formatDate(
                                                        incident.detectedAt
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* FOOTER */}

                <div className="border-t border-slate-800 bg-slate-900/30 px-6 py-4 md:px-8">
                    <div className="flex flex-col gap-2 text-[9px] text-slate-600 md:flex-row md:items-center md:justify-between">
                        <span>
                            MARINEAEGIS • Autonomous Maritime
                            Cyber Defense Platform
                        </span>

                        <span>
                            Report generated from live system
                            data
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================
// REPORT KPI
// ========================================

const ReportKPI = ({
    icon: Icon,
    label,
    value,
    type,
}) => {
    const styles = {
        cyan: "text-cyan-400 bg-cyan-400/10",
        red: "text-red-400 bg-red-400/10",
        orange:
            "text-orange-400 bg-orange-400/10",
        green:
            "text-emerald-400 bg-emerald-400/10",
    };

    return (
        <div className="border-r border-slate-800 p-5 last:border-r-0">
            <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles[type]}`}
            >
                <Icon className="h-4 w-4" />
            </div>

            <p className="mt-4 text-[10px] uppercase tracking-wider text-slate-600">
                {label}
            </p>

            <p className="mt-1 text-2xl font-bold text-white">
                {value}
            </p>
        </div>
    );
};

// ========================================
// REPORT PANEL
// ========================================

const ReportPanel = ({
    icon: Icon,
    title,
    children,
}) => {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
            <div className="mb-5 flex items-center gap-2">
                <Icon className="h-4 w-4 text-cyan-400" />

                <h3 className="text-sm font-semibold text-white">
                    {title}
                </h3>
            </div>

            {children}
        </div>
    );
};

// ========================================
// DISTRIBUTION
// ========================================

const DistributionRow = ({
    label,
    value,
    total,
    type,
}) => {
    const colors = {
        critical: "bg-red-400",
        high: "bg-orange-400",
        medium: "bg-amber-400",
        low: "bg-emerald-400",
        open: "bg-orange-400",
        investigating: "bg-purple-400",
        contained: "bg-amber-400",
        resolved: "bg-emerald-400",
        closed: "bg-slate-500",
    };

    const percentage =
        total > 0
            ? Math.round((value / total) * 100)
            : 0;

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    {label}
                </span>

                <span className="text-xs font-semibold text-slate-300">
                    {value}{" "}
                    <span className="text-slate-600">
                        ({percentage}%)
                    </span>
                </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                    className={`h-full rounded-full ${colors[type]
                        }`}
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </div>
    );
};

// ========================================
// SELECT
// ========================================

const ReportSelect = ({
    label,
    value,
    onChange,
    options,
}) => {
    return (
        <div>
            <label className="mb-2 block text-[10px] uppercase tracking-wider text-slate-600">
                {label}
            </label>

            <select
                value={value}
                onChange={(e) =>
                    onChange(e.target.value)
                }
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-slate-300 outline-none focus:border-cyan-400/40"
            >
                {options.map(
                    ([optionValue, optionLabel]) => (
                        <option
                            key={optionValue}
                            value={optionValue}
                        >
                            {optionLabel}
                        </option>
                    )
                )}
            </select>
        </div>
    );
};

// ========================================
// BADGES
// ========================================

const SeverityBadge = ({ severity }) => {
    const config = {
        CRITICAL:
            "border-red-400/20 bg-red-400/10 text-red-400",
        HIGH:
            "border-orange-400/20 bg-orange-400/10 text-orange-400",
        MEDIUM:
            "border-amber-400/20 bg-amber-400/10 text-amber-400",
        LOW:
            "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
    };

    return (
        <span
            className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${config[severity] ||
                "border-slate-700 bg-slate-800 text-slate-500"
                }`}
        >
            {severity || "UNKNOWN"}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const config = {
        OPEN:
            "border-orange-400/20 bg-orange-400/10 text-orange-400",
        INVESTIGATING:
            "border-purple-400/20 bg-purple-400/10 text-purple-400",
        CONTAINED:
            "border-amber-400/20 bg-amber-400/10 text-amber-400",
        RESOLVED:
            "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
        CLOSED:
            "border-slate-700 bg-slate-800 text-slate-400",
    };

    return (
        <span
            className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${config[status] ||
                "border-slate-700 bg-slate-800 text-slate-500"
                }`}
        >
            {status || "UNKNOWN"}
        </span>
    );
};

// ========================================
// EMPTY
// ========================================

const EmptyReportState = () => {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 py-10">
            <FileText className="h-7 w-7 text-slate-700" />

            <p className="mt-2 text-xs text-slate-600">
                No data available for this report
            </p>
        </div>
    );
};

// ========================================
// HELPERS
// ========================================

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
        hour: "2-digit",
        minute: "2-digit",
    });
};

const isWithinPeriod = (
    date,
    period
) => {
    if (!date) return false;

    const diff =
        Date.now() -
        new Date(date).getTime();

    const day =
        24 * 60 * 60 * 1000;

    if (period === "TODAY") {
        const start = new Date();

        start.setHours(0, 0, 0, 0);

        return (
            new Date(date).getTime() >=
            start.getTime()
        );
    }

    if (period === "7D") {
        return diff <= 7 * day;
    }

    if (period === "30D") {
        return diff <= 30 * day;
    }

    return true;
};

const getRiskColor = (level) => {
    switch (level) {
        case "CRITICAL":
            return "text-red-400";

        case "HIGH":
            return "text-orange-400";

        case "MEDIUM":
            return "text-amber-400";

        case "LOW":
            return "text-emerald-400";

        default:
            return "text-slate-400";
    }
};

export default Reports;