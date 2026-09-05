import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertTriangle,
    BrainCircuit,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Eye,
    Filter,
    Search,
    ShieldAlert,
    Ship,
    Siren,
    Target,
    UserRound,
    X,
    Zap,
} from "lucide-react";
import api from "../services/api";

const Incidents = () => {
    const [incidents, setIncidents] = useState([]);
    const [vessels, setVessels] = useState([]);
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [selectedIncident, setSelectedIncident] =
        useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const [search, setSearch] = useState("");
    const [severity, setSeverity] = useState("ALL");
    const [status, setStatus] = useState("ALL");
    const [priority, setPriority] = useState("ALL");
    const [vesselFilter, setVesselFilter] = useState("ALL");

    // ========================================
    // LOAD DATA
    // ========================================

    const loadData = async () => {
        try {
            const requests = [
                api.get("/incidents"),
                api.get("/vessels"),
            ];

            // Users is optional. If the backend route is
            // unavailable for the current role, incidents
            // page still works.
            try {
                requests.push(api.get("/users"));
            } catch {
                // ignore
            }

            const results = await Promise.allSettled(
                requests
            );

            const incidentsResult = results[0];
            const vesselsResult = results[1];
            const usersResult = results[2];

            if (
                incidentsResult.status === "fulfilled"
            ) {
                setIncidents(
                    incidentsResult.value.data?.incidents || []
                );
            }

            if (vesselsResult.status === "fulfilled") {
                setVessels(
                    vesselsResult.value.data?.vessels || []
                );
            }

            if (
                usersResult?.status === "fulfilled"
            ) {
                setUsers(
                    usersResult.value.data?.users || []
                );
            }
        } catch (error) {
            console.error(
                "Incident loading error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ========================================
    // UPDATE INCIDENT
    // ========================================

    const updateIncident = async (
        incidentId,
        payload
    ) => {
        try {
            setUpdatingId(incidentId);

            const response = await api.put(
                `/incidents/${incidentId}`,
                payload
            );

            const updated =
                response.data?.incident;

            if (updated) {
                setIncidents((prev) =>
                    prev.map((item) =>
                        item._id === incidentId
                            ? updated
                            : item
                    )
                );

                if (
                    selectedIncident?._id ===
                    incidentId
                ) {
                    setSelectedIncident(updated);
                }
            }
        } catch (error) {
            console.error(
                "Incident update error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to update incident"
            );
        } finally {
            setUpdatingId(null);
        }
    };

    // ========================================
    // FILTERS
    // ========================================

    const filteredIncidents = useMemo(() => {
        return incidents.filter((incident) => {
            const searchText =
                search.toLowerCase();

            const matchesSearch =
                !search ||
                incident.title
                    ?.toLowerCase()
                    .includes(searchText) ||
                incident.description
                    ?.toLowerCase()
                    .includes(searchText) ||
                incident.incidentId
                    ?.toLowerCase()
                    .includes(searchText) ||
                incident.vessel?.name
                    ?.toLowerCase()
                    .includes(searchText) ||
                incident.vessel?.vesselId
                    ?.toLowerCase()
                    .includes(searchText);

            const matchesSeverity =
                severity === "ALL" ||
                incident.severity === severity;

            const matchesStatus =
                status === "ALL" ||
                incident.status === status;

            const matchesPriority =
                priority === "ALL" ||
                incident.priority === priority;

            const matchesVessel =
                vesselFilter === "ALL" ||
                incident.vessel?._id ===
                vesselFilter;

            return (
                matchesSearch &&
                matchesSeverity &&
                matchesStatus &&
                matchesPriority &&
                matchesVessel
            );
        });
    }, [
        incidents,
        search,
        severity,
        status,
        priority,
        vesselFilter,
    ]);

    // ========================================
    // STATS
    // ========================================

    const stats = useMemo(() => {
        return {
            total: incidents.length,

            open: incidents.filter(
                (item) => item.status === "OPEN"
            ).length,

            investigating: incidents.filter(
                (item) =>
                    item.status === "INVESTIGATING"
            ).length,

            critical: incidents.filter(
                (item) =>
                    item.severity === "CRITICAL"
            ).length,

            urgent: incidents.filter(
                (item) =>
                    item.priority === "URGENT"
            ).length,

            resolved: incidents.filter(
                (item) =>
                    item.status === "RESOLVED" ||
                    item.status === "CLOSED"
            ).length,
        };
    }, [incidents]);

    // ========================================
    // CLEAR FILTERS
    // ========================================

    const clearFilters = () => {
        setSearch("");
        setSeverity("ALL");
        setStatus("ALL");
        setPriority("ALL");
        setVesselFilter("ALL");
    };

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

        return new Date(date).toLocaleString(
            [],
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    return (
        <div className="space-y-5">
            {/* ========================================
          HEADER
      ======================================== */}

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-400/20 bg-orange-400/10">
                        <Siren className="h-5 w-5 text-orange-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Incident Management
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Investigate, contain and resolve
                            maritime security incidents
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-orange-400/20 bg-orange-400/5 px-3 py-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-400" />
                    </span>

                    <span className="text-xs font-medium text-orange-400">
                        INCIDENT RESPONSE ACTIVE
                    </span>
                </div>
            </div>

            {/* ========================================
          KPI CARDS
      ======================================== */}

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
                <IncidentStat
                    icon={Activity}
                    label="Total"
                    value={stats.total}
                    type="cyan"
                />

                <IncidentStat
                    icon={AlertTriangle}
                    label="Open"
                    value={stats.open}
                    type="orange"
                />

                <IncidentStat
                    icon={Eye}
                    label="Investigating"
                    value={stats.investigating}
                    type="purple"
                />

                <IncidentStat
                    icon={ShieldAlert}
                    label="Critical"
                    value={stats.critical}
                    type="red"
                />

                <IncidentStat
                    icon={Siren}
                    label="Urgent"
                    value={stats.urgent}
                    type="amber"
                />

                <IncidentStat
                    icon={CheckCircle2}
                    label="Resolved"
                    value={stats.resolved}
                    type="green"
                />
            </div>

            {/* ========================================
          FILTERS
      ======================================== */}

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-cyan-400" />

                        <span className="text-sm font-semibold text-white">
                            Incident Filters
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
                            placeholder="Search incidents..."
                            className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/70 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/40"
                        />
                    </div>

                    {/* Severity */}

                    <Select
                        value={severity}
                        onChange={setSeverity}
                        options={[
                            ["ALL", "All Severities"],
                            ["CRITICAL", "Critical"],
                            ["HIGH", "High"],
                            ["MEDIUM", "Medium"],
                            ["LOW", "Low"],
                        ]}
                    />

                    {/* Status */}

                    <Select
                        value={status}
                        onChange={setStatus}
                        options={[
                            ["ALL", "All Statuses"],
                            ["OPEN", "Open"],
                            [
                                "INVESTIGATING",
                                "Investigating",
                            ],
                            ["CONTAINED", "Contained"],
                            ["RESOLVED", "Resolved"],
                            ["CLOSED", "Closed"],
                        ]}
                    />

                    {/* Priority */}

                    <Select
                        value={priority}
                        onChange={setPriority}
                        options={[
                            ["ALL", "All Priorities"],
                            ["URGENT", "Urgent"],
                            ["HIGH", "High"],
                            ["MEDIUM", "Medium"],
                            ["LOW", "Low"],
                        ]}
                    />

                    {/* Vessel */}

                    <Select
                        value={vesselFilter}
                        onChange={setVesselFilter}
                        options={[
                            ["ALL", "All Vessels"],
                            ...vessels.map((vessel) => [
                                vessel._id,
                                vessel.name,
                            ]),
                        ]}
                    />
                </div>
            </div>

            {/* ========================================
          INCIDENT TABLE
      ======================================== */}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-white">
                            Incident Registry
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Showing{" "}
                            {filteredIncidents.length} of{" "}
                            {incidents.length} incidents
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        RESPONSE SYSTEM ONLINE
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-sm text-slate-500">
                        Loading incidents...
                    </div>
                ) : filteredIncidents.length ===
                    0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <ShieldAlert className="h-8 w-8 text-slate-700" />

                        <p className="mt-3 text-sm text-slate-500">
                            No incidents found
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
                        <table className="w-full min-w-[1100px] text-left">
                            <thead>
                                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-600">
                                    <th className="px-5 py-3">
                                        Incident
                                    </th>

                                    <th className="px-5 py-3">
                                        Vessel
                                    </th>

                                    <th className="px-5 py-3">
                                        Severity
                                    </th>

                                    <th className="px-5 py-3">
                                        Priority
                                    </th>

                                    <th className="px-5 py-3">
                                        Status
                                    </th>

                                    <th className="px-5 py-3">
                                        Assigned To
                                    </th>

                                    <th className="px-5 py-3">
                                        Confidence
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
                                {filteredIncidents.map(
                                    (incident) => (
                                        <IncidentRow
                                            key={incident._id}
                                            incident={incident}
                                            updating={
                                                updatingId ===
                                                incident._id
                                            }
                                            onView={() =>
                                                setSelectedIncident(
                                                    incident
                                                )
                                            }
                                            onInvestigate={() =>
                                                updateIncident(
                                                    incident._id,
                                                    {
                                                        status:
                                                            "INVESTIGATING",
                                                    }
                                                )
                                            }
                                            onContain={() =>
                                                updateIncident(
                                                    incident._id,
                                                    {
                                                        status: "CONTAINED",
                                                    }
                                                )
                                            }
                                            onResolve={() =>
                                                updateIncident(
                                                    incident._id,
                                                    {
                                                        status: "RESOLVED",
                                                    }
                                                )
                                            }
                                        />
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ========================================
          INCIDENT DETAILS MODAL
      ======================================== */}

            {selectedIncident && (
                <IncidentDetailsModal
                    incident={selectedIncident}
                    users={users}
                    updating={
                        updatingId ===
                        selectedIncident._id
                    }
                    onClose={() =>
                        setSelectedIncident(null)
                    }
                    onUpdate={(payload) =>
                        updateIncident(
                            selectedIncident._id,
                            payload
                        )
                    }
                    formatType={formatType}
                    formatDate={formatDate}
                />
            )}
        </div>
    );
};

// ========================================
// STAT CARD
// ========================================

const IncidentStat = ({
    icon: Icon,
    label,
    value,
    type,
}) => {
    const styles = {
        cyan: {
            icon: "text-cyan-400",
            bg: "bg-cyan-400/10",
        },

        orange: {
            icon: "text-orange-400",
            bg: "bg-orange-400/10",
        },

        purple: {
            icon: "text-purple-400",
            bg: "bg-purple-400/10",
        },

        red: {
            icon: "text-red-400",
            bg: "bg-red-400/10",
        },

        amber: {
            icon: "text-amber-400",
            bg: "bg-amber-400/10",
        },

        green: {
            icon: "text-emerald-400",
            bg: "bg-emerald-400/10",
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
// INCIDENT ROW
// ========================================

const IncidentRow = ({
    incident,
    updating,
    onView,
    onInvestigate,
    onContain,
    onResolve,
}) => {
    return (
        <tr className="border-b border-slate-800/60 transition hover:bg-slate-900/40">
            {/* Incident */}

            <td className="px-5 py-4">
                <div className="flex items-start gap-3">
                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getSeverityConfig(
                            incident.severity
                        ).bg
                            }`}
                    >
                        <Siren
                            className={`h-4 w-4 ${getSeverityConfig(
                                incident.severity
                            ).text
                                }`}
                        />
                    </div>

                    <div className="min-w-0">
                        <p className="max-w-[250px] truncate text-sm font-medium text-slate-200">
                            {incident.title}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-600">
                            {incident.incidentId}
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
                            {incident.vessel?.name ||
                                "Unknown Vessel"}
                        </p>

                        <p className="text-[10px] text-slate-600">
                            {incident.vessel?.vesselId ||
                                "--"}
                        </p>
                    </div>
                </div>
            </td>

            {/* Severity */}

            <td className="px-5 py-4">
                <SeverityBadge
                    severity={incident.severity}
                />
            </td>

            {/* Priority */}

            <td className="px-5 py-4">
                <PriorityBadge
                    priority={incident.priority}
                />
            </td>

            {/* Status */}

            <td className="px-5 py-4">
                <IncidentStatus
                    status={incident.status}
                />
            </td>

            {/* Assigned */}

            <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                    <UserRound className="h-3.5 w-3.5 text-slate-600" />

                    <span className="max-w-[120px] truncate text-[10px] text-slate-500">
                        {incident.assignedTo?.name ||
                            incident.assignedTo?.email ||
                            "Unassigned"}
                    </span>
                </div>
            </td>

            {/* Confidence */}

            <td className="px-5 py-4">
                <span className="text-xs font-semibold text-cyan-400">
                    {incident.confidence ?? "--"}%
                </span>
            </td>

            {/* Detected */}

            <td className="px-5 py-4">
                <span className="text-[10px] text-slate-500">
                    {formatRelativeTime(
                        incident.detectedAt
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

                    {incident.status === "OPEN" && (
                        <button
                            onClick={onInvestigate}
                            disabled={updating}
                            className="rounded-lg border border-purple-400/20 bg-purple-400/5 px-2.5 text-[10px] text-purple-400 transition hover:bg-purple-400/10 disabled:opacity-50"
                        >
                            INVESTIGATE
                        </button>
                    )}

                    {incident.status ===
                        "INVESTIGATING" && (
                            <button
                                onClick={onContain}
                                disabled={updating}
                                className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-2.5 text-[10px] text-amber-400 transition hover:bg-amber-400/10 disabled:opacity-50"
                            >
                                CONTAIN
                            </button>
                        )}

                    {incident.status !==
                        "RESOLVED" &&
                        incident.status !== "CLOSED" && (
                            <button
                                onClick={onResolve}
                                disabled={updating}
                                className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-2.5 text-[10px] text-emerald-400 transition hover:bg-emerald-400/10 disabled:opacity-50"
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
// DETAILS MODAL
// ========================================

const IncidentDetailsModal = ({
    incident,
    users,
    updating,
    onClose,
    onUpdate,
    formatType,
    formatDate,
}) => {
    const [status, setStatus] =
        useState(incident.status);

    const [priority, setPriority] =
        useState(incident.priority);

    const [assignedTo, setAssignedTo] =
        useState(
            incident.assignedTo?._id || ""
        );

    const severity = getSeverityConfig(
        incident.severity
    );

    const saveChanges = () => {
        const payload = {
            status,
            priority,
            assignedTo:
                assignedTo || null,
        };

        onUpdate(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
                {/* Header */}

                <div className="flex items-start justify-between border-b border-slate-800 p-5">
                    <div className="flex items-start gap-3">
                        <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${severity.bg}`}
                        >
                            <Siren
                                className={`h-5 w-5 ${severity.text}`}
                            />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-bold text-white">
                                    {incident.title}
                                </h2>

                                <SeverityBadge
                                    severity={incident.severity}
                                />
                            </div>

                            <p className="mt-1 text-xs text-slate-600">
                                {incident.incidentId}
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

                {/* Body */}

                <div className="space-y-5 p-5">
                    {/* Description */}

                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Incident Description
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            {incident.description ||
                                "No description available."}
                        </p>
                    </div>

                    {/* Incident Info */}

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <DetailItem
                            label="Vessel"
                            value={
                                incident.vessel?.name ||
                                "Unknown Vessel"
                            }
                        />

                        <DetailItem
                            label="Vessel ID"
                            value={
                                incident.vessel?.vesselId ||
                                "--"
                            }
                        />

                        <DetailItem
                            label="Incident Type"
                            value={formatType(incident.type)}
                        />

                        <DetailItem
                            label="Severity"
                            value={incident.severity}
                        />

                        <DetailItem
                            label="Priority"
                            value={incident.priority}
                        />

                        <DetailItem
                            label="Source"
                            value={
                                incident.source || "--"
                            }
                        />

                        <DetailItem
                            label="Confidence"
                            value={`${incident.confidence ?? "--"}%`}
                        />

                        <DetailItem
                            label="Detected At"
                            value={formatDate(
                                incident.detectedAt
                            )}
                        />

                        <DetailItem
                            label="Resolved At"
                            value={
                                incident.resolvedAt
                                    ? formatDate(
                                        incident.resolvedAt
                                    )
                                    : "Not resolved"
                            }
                        />
                    </div>

                    {/* Workflow */}

                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                        <div className="mb-4 flex items-center gap-2">
                            <Target className="h-4 w-4 text-cyan-400" />

                            <span className="text-sm font-semibold text-white">
                                Response Workflow
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {/* Status */}

                            <div>
                                <label className="mb-2 block text-[10px] uppercase tracking-wider text-slate-600">
                                    Incident Status
                                </label>

                                <div className="relative">
                                    <select
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(
                                                e.target.value
                                            )
                                        }
                                        className="h-10 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950 px-3 pr-8 text-xs text-slate-300 outline-none focus:border-cyan-400/40"
                                    >
                                        <option value="OPEN">
                                            Open
                                        </option>

                                        <option value="INVESTIGATING">
                                            Investigating
                                        </option>

                                        <option value="CONTAINED">
                                            Contained
                                        </option>

                                        <option value="RESOLVED">
                                            Resolved
                                        </option>

                                        <option value="CLOSED">
                                            Closed
                                        </option>
                                    </select>

                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                                </div>
                            </div>

                            {/* Priority */}

                            <div>
                                <label className="mb-2 block text-[10px] uppercase tracking-wider text-slate-600">
                                    Priority
                                </label>

                                <div className="relative">
                                    <select
                                        value={priority}
                                        onChange={(e) =>
                                            setPriority(
                                                e.target.value
                                            )
                                        }
                                        className="h-10 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950 px-3 pr-8 text-xs text-slate-300 outline-none focus:border-cyan-400/40"
                                    >
                                        <option value="LOW">
                                            Low
                                        </option>

                                        <option value="MEDIUM">
                                            Medium
                                        </option>

                                        <option value="HIGH">
                                            High
                                        </option>

                                        <option value="URGENT">
                                            Urgent
                                        </option>
                                    </select>

                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                                </div>
                            </div>

                            {/* Assigned User */}

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-[10px] uppercase tracking-wider text-slate-600">
                                    Assign Analyst
                                </label>

                                <div className="relative">
                                    <select
                                        value={assignedTo}
                                        onChange={(e) =>
                                            setAssignedTo(
                                                e.target.value
                                            )
                                        }
                                        className="h-10 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950 px-3 pr-8 text-xs text-slate-300 outline-none focus:border-cyan-400/40"
                                    >
                                        <option value="">
                                            Unassigned
                                        </option>

                                        {users.map((user) => (
                                            <option
                                                key={user._id}
                                                value={user._id}
                                            >
                                                {user.name} —{" "}
                                                {user.role}
                                            </option>
                                        ))}
                                    </select>

                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI */}

                    <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10">
                                    <BrainCircuit className="h-4 w-4 text-cyan-400" />
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-300">
                                        AI Detection Confidence
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-slate-600">
                                        Automated threat assessment
                                    </p>
                                </div>
                            </div>

                            <span className="text-lg font-bold text-cyan-400">
                                {incident.confidence ??
                                    "--"}
                                %
                            </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                                className="h-full rounded-full bg-cyan-400"
                                style={{
                                    width: `${Math.min(
                                        Number(
                                            incident.confidence ||
                                            0
                                        ),
                                        100
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}

                <div className="flex flex-col gap-2 border-t border-slate-800 p-5 sm:flex-row sm:justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={saveChanges}
                        disabled={updating}
                        className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-5 py-2.5 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-400/15 disabled:opacity-50"
                    >
                        {updating
                            ? "Saving..."
                            : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ========================================
// SELECT
// ========================================

const Select = ({
    value,
    onChange,
    options,
}) => {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) =>
                    onChange(e.target.value)
                }
                className="h-10 w-full appearance-none rounded-lg border border-slate-800 bg-slate-900/70 px-3 pr-8 text-xs text-slate-300 outline-none focus:border-cyan-400/40"
            >
                {options.map(([optionValue, label]) => (
                    <option
                        key={optionValue}
                        value={optionValue}
                    >
                        {label}
                    </option>
                ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
        </div>
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
// SEVERITY
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
// PRIORITY
// ========================================

const PriorityBadge = ({ priority }) => {
    const config = {
        URGENT:
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
            className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${config[priority] ||
                "border-slate-700 bg-slate-800 text-slate-500"
                }`}
        >
            {priority || "UNKNOWN"}
        </span>
    );
};

// ========================================
// INCIDENT STATUS
// ========================================

const IncidentStatus = ({ status }) => {
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
// RELATIVE TIME
// ========================================

const formatRelativeTime = (date) => {
    if (!date) return "--";

    const diff =
        Date.now() -
        new Date(date).getTime();

    const minutes = Math.floor(
        diff / (1000 * 60)
    );

    if (minutes < 1) return "Just now";

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(
        minutes / 60
    );

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(
        hours / 24
    );

    return `${days}d ago`;
};

export default Incidents;