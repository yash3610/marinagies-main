import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    CheckCircle2,
    Clock3,
    FileText,
    Filter,
    Globe,
    RefreshCw,
    Search,
    ShieldCheck,
    User,
    XCircle,
} from "lucide-react";
import api from "../services/api";

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] =
        useState("ALL");
    const [statusFilter, setStatusFilter] =
        useState("ALL");

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/audit-logs"
            );

            setLogs(response.data?.logs || []);
        } catch (error) {
            console.error(
                "Audit logs loading error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const query =
                search.toLowerCase();

            const matchesSearch =
                !query ||
                log.action
                    ?.toLowerCase()
                    .includes(query) ||
                log.resource
                    ?.toLowerCase()
                    .includes(query) ||
                log.description
                    ?.toLowerCase()
                    .includes(query) ||
                log.user?.name
                    ?.toLowerCase()
                    .includes(query) ||
                log.user?.email
                    ?.toLowerCase()
                    .includes(query) ||
                log.ipAddress
                    ?.toLowerCase()
                    .includes(query);

            const matchesAction =
                actionFilter === "ALL" ||
                log.action === actionFilter;

            const matchesStatus =
                statusFilter === "ALL" ||
                log.status === statusFilter;

            return (
                matchesSearch &&
                matchesAction &&
                matchesStatus
            );
        });
    }, [
        logs,
        search,
        actionFilter,
        statusFilter,
    ]);

    const successfulLogs = logs.filter(
        (log) => log.status === "SUCCESS"
    ).length;

    const failedLogs = logs.filter(
        (log) => log.status === "FAILED"
    ).length;

    const uniqueUsers = new Set(
        logs
            .map((log) => log.user?._id)
            .filter(Boolean)
    ).size;

    const actions = [
        ...new Set(
            logs
                .map((log) => log.action)
                .filter(Boolean)
        ),
    ];

    return (
        <div className="space-y-5">
            {/* HEADER */}

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                        <ShieldCheck className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Audit Logs
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Security activity and system action
                            history
                        </p>
                    </div>
                </div>

                <button
                    onClick={loadLogs}
                    className="flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400 transition hover:border-slate-700 hover:text-white xl:self-auto"
                >
                    <RefreshCw
                        className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""
                            }`}
                    />
                    Refresh Logs
                </button>
            </div>

            {/* STATS */}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <AuditStat
                    icon={FileText}
                    label="Total Events"
                    value={logs.length}
                    description="Recorded actions"
                    type="cyan"
                />

                <AuditStat
                    icon={CheckCircle2}
                    label="Successful"
                    value={successfulLogs}
                    description="Completed actions"
                    type="green"
                />

                <AuditStat
                    icon={XCircle}
                    label="Failed"
                    value={failedLogs}
                    description="Failed actions"
                    type="red"
                />

                <AuditStat
                    icon={User}
                    label="Active Users"
                    value={uniqueUsers}
                    description="Users in audit trail"
                    type="purple"
                />
            </div>

            {/* FILTER BAR */}

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                    {/* SEARCH */}

                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                        <input
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search user, action, resource, IP..."
                            className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-10 pr-3 text-xs text-slate-300 outline-none placeholder:text-slate-700 focus:border-cyan-400/30"
                        />
                    </div>

                    {/* ACTION */}

                    <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-slate-600" />

                        <select
                            value={actionFilter}
                            onChange={(e) =>
                                setActionFilter(
                                    e.target.value
                                )
                            }
                            className="h-10 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-slate-400 outline-none"
                        >
                            <option value="ALL">
                                All Actions
                            </option>

                            {actions.map((action) => (
                                <option
                                    key={action}
                                    value={action}
                                >
                                    {formatAction(action)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* STATUS */}

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                        className="h-10 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-slate-400 outline-none"
                    >
                        <option value="ALL">
                            All Status
                        </option>

                        <option value="SUCCESS">
                            Success
                        </option>

                        <option value="FAILED">
                            Failed
                        </option>
                    </select>
                </div>
            </div>

            {/* LOG TABLE */}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                <div className="flex items-center justify-between border-b border-slate-800 p-4">
                    <div>
                        <h2 className="text-sm font-semibold text-white">
                            Security Activity
                        </h2>

                        <p className="mt-1 text-[10px] text-slate-600">
                            Immutable system activity trail
                        </p>
                    </div>

                    <div className="rounded-full border border-cyan-400/10 bg-cyan-400/5 px-2.5 py-1 text-[9px] font-semibold text-cyan-400">
                        {filteredLogs.length} EVENTS
                    </div>
                </div>

                {loading ? (
                    <LoadingState />
                ) : filteredLogs.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left">
                            <thead>
                                <tr className="border-b border-slate-800 text-[9px] uppercase tracking-wider text-slate-600">
                                    <th className="px-4 py-3">
                                        Timestamp
                                    </th>

                                    <th className="px-4 py-3">
                                        User
                                    </th>

                                    <th className="px-4 py-3">
                                        Action
                                    </th>

                                    <th className="px-4 py-3">
                                        Resource
                                    </th>

                                    <th className="px-4 py-3">
                                        Description
                                    </th>

                                    <th className="px-4 py-3">
                                        Network
                                    </th>

                                    <th className="px-4 py-3">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredLogs.map(
                                    (log) => (
                                        <AuditRow
                                            key={log._id}
                                            log={log}
                                        />
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* SECURITY NOTICE */}

            <div className="flex items-start gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />

                <div>
                    <p className="text-xs font-semibold text-cyan-400">
                        Security Audit Trail
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        Audit events are generated by the
                        MARINEAEGIS backend and contain user,
                        action, resource, network and timestamp
                        information for security investigation
                        and accountability.
                    </p>
                </div>
            </div>
        </div>
    );
};

/* ========================================
   AUDIT ROW
======================================== */

const AuditRow = ({ log }) => {
    const success =
        log.status === "SUCCESS";

    return (
        <tr className="border-b border-slate-800/60 transition hover:bg-slate-900/30">
            {/* TIMESTAMP */}

            <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5 text-slate-600" />

                    <div>
                        <p className="text-[10px] text-slate-300">
                            {formatDate(log.createdAt)}
                        </p>

                        <p className="mt-0.5 text-[8px] text-slate-700">
                            {formatTime(log.createdAt)}
                        </p>
                    </div>
                </div>
            </td>

            {/* USER */}

            <td className="px-4 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-300">
                            {log.user?.name ||
                                "System"}
                        </p>

                        <p className="mt-0.5 text-[8px] text-slate-600">
                            {log.user?.role ||
                                "SYSTEM"}
                        </p>
                    </div>
                </div>
            </td>

            {/* ACTION */}

            <td className="px-4 py-4">
                <span className="rounded-md border border-cyan-400/10 bg-cyan-400/5 px-2 py-1 text-[9px] font-semibold text-cyan-400">
                    {formatAction(log.action)}
                </span>
            </td>

            {/* RESOURCE */}

            <td className="px-4 py-4">
                <p className="text-xs text-slate-300">
                    {log.resource}
                </p>

                {log.resourceId && (
                    <p className="mt-1 text-[8px] text-slate-700">
                        ID: {log.resourceId}
                    </p>
                )}
            </td>

            {/* DESCRIPTION */}

            <td className="max-w-[240px] px-4 py-4">
                <p className="truncate text-[10px] text-slate-500">
                    {log.description ||
                        "No description"}
                </p>
            </td>

            {/* NETWORK */}

            <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-slate-600" />

                    <span className="text-[9px] text-slate-500">
                        {formatIp(log.ipAddress)}
                    </span>
                </div>
            </td>

            {/* STATUS */}

            <td className="px-4 py-4">
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-semibold ${success
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                            : "border-red-400/20 bg-red-400/10 text-red-400"
                        }`}
                >
                    {success ? (
                        <CheckCircle2 className="h-3 w-3" />
                    ) : (
                        <XCircle className="h-3 w-3" />
                    )}

                    {log.status}
                </span>
            </td>
        </tr>
    );
};

/* ========================================
   STAT
======================================== */

const AuditStat = ({
    icon: Icon,
    label,
    value,
    description,
    type,
}) => {
    const styles = {
        cyan:
            "bg-cyan-400/10 text-cyan-400",
        green:
            "bg-emerald-400/10 text-emerald-400",
        red:
            "bg-red-400/10 text-red-400",
        purple:
            "bg-purple-400/10 text-purple-400",
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
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

            <p className="mt-1 text-[9px] text-slate-600">
                {description}
            </p>
        </div>
    );
};

/* ========================================
   LOADING
======================================== */

const LoadingState = () => {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

            <p className="mt-3 text-xs text-slate-600">
                Loading audit events...
            </p>
        </div>
    );
};

/* ========================================
   EMPTY
======================================== */

const EmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <FileText className="h-8 w-8 text-slate-700" />

            <p className="mt-3 text-xs text-slate-500">
                No audit events found
            </p>

            <p className="mt-1 text-[9px] text-slate-700">
                Try changing your filters
            </p>
        </div>
    );
};

/* ========================================
   HELPERS
======================================== */

const formatAction = (action) => {
    if (!action) return "--";

    return action
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

    return new Date(date).toLocaleDateString(
        [],
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
};

const formatTime = (date) => {
    if (!date) return "--";

    return new Date(date).toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }
    );
};

const formatIp = (ip) => {
    if (!ip) return "--";

    return ip.replace("::ffff:", "");
};

export default AuditLogs;