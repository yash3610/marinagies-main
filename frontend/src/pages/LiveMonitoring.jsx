import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    Anchor,
    Compass,
    Cpu,
    Gauge,
    MapPin,
    Navigation,
    Radio,
    Satellite,
    Ship,
    Thermometer,
    Waves,
    Wifi,
    Fuel,
    AlertTriangle,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { createSocket } from "../services/socket";
import api from "../services/api";


const LiveMonitoring = () => {
    const [vessels, setVessels] = useState([]);
    const [telemetry, setTelemetry] = useState([]);
    const [selectedVesselId, setSelectedVesselId] = useState("");
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    // =========================
    // Initial Data
    // =========================
    useEffect(() => {
        const loadData = async () => {
            try {
                const [vesselsRes, telemetryRes] = await Promise.all([
                    api.get("/vessels"),
                    api.get("/telemetry"),
                ]);

                const vesselData = vesselsRes.data?.vessels || [];
                const telemetryData = telemetryRes.data?.data || [];

                setVessels(vesselData);
                setTelemetry(telemetryData);

                if (vesselData.length > 0) {
                    setSelectedVesselId(vesselData[0]._id);
                }
            } catch (error) {
                console.error("Live monitoring data error:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // =========================
    // Socket.IO
    // =========================
    useEffect(() => {
        const socket = createSocket();

        socket.on("connect", () => {
            console.log("Live Monitoring Socket connected:", socket.id);
        });

        socket.on("telemetry:update", (data) => {
            if (!data?.success) return;

            setTelemetry(data.data || []);
            setLastUpdate(new Date());
        });

        socket.on("disconnect", () => {
            console.log("Live Monitoring Socket disconnected");
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // =========================
    // Selected Vessel
    // =========================
    const selectedVessel = useMemo(() => {
        return vessels.find((vessel) => vessel._id === selectedVesselId);
    }, [vessels, selectedVesselId]);

    const selectedTelemetry = useMemo(() => {
        if (!selectedVessel) return null;

        const record = telemetry.find(
            (item) => item.vessel?._id === selectedVessel._id
        );

        return record?.telemetry || record || null;
    }, [telemetry, selectedVessel]);

    // =========================
    // Fleet Stats
    // =========================
    const stats = useMemo(() => {
        const records = vessels.map((vessel) => {
            const record = telemetry.find(
                (item) => item.vessel?._id === vessel._id
            );

            return {
                vessel,
                telemetry: record?.telemetry || record || null,
            };
        });

        return {
            online: records.filter(
                (item) =>
                    item.telemetry?.deviceStatus === "ONLINE" ||
                    item.vessel.status === "ONLINE"
            ).length,

            offline: records.filter(
                (item) =>
                    item.telemetry?.deviceStatus === "OFFLINE" ||
                    item.vessel.status === "OFFLINE"
            ).length,

            warning: records.filter(
                (item) =>
                    item.telemetry?.deviceStatus === "WARNING" ||
                    item.vessel.status === "WARNING"
            ).length,

            anomalies: records.filter(
                (item) =>
                    item.telemetry?.aisStatus === "ANOMALY" ||
                    Number(item.telemetry?.gpsSignal || 100) < 70
            ).length,
        };
    }, [vessels, telemetry]);

    const formatNumber = (value, digits = 1) => {
        if (value === undefined || value === null) return "--";
        return Number(value).toFixed(digits);
    };

    const statusColor = selectedVessel?.status || "OFFLINE";

    return (
        <div className="space-y-5">
            {/* ========================================
          PAGE HEADER
      ======================================== */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                            <Activity className="h-5 w-5 text-cyan-400" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                Live Monitoring
                            </h1>

                            <p className="text-sm text-slate-400">
                                Real-time vessel telemetry and edge device monitoring
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        </span>

                        <span className="text-xs font-medium text-emerald-400">
                            LIVE
                        </span>
                    </div>

                    {lastUpdate && (
                        <div className="text-xs text-slate-500">
                            Updated {lastUpdate.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================
          KPI CARDS
      ======================================== */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <MonitoringStat
                    icon={Wifi}
                    label="Online Devices"
                    value={stats.online}
                    subtext="Connected"
                    iconClass="text-emerald-400"
                    bgClass="bg-emerald-400/10"
                />

                <MonitoringStat
                    icon={XCircle}
                    label="Offline Devices"
                    value={stats.offline}
                    subtext="Disconnected"
                    iconClass="text-red-400"
                    bgClass="bg-red-400/10"
                />

                <MonitoringStat
                    icon={AlertTriangle}
                    label="Warnings"
                    value={stats.warning}
                    subtext="Attention required"
                    iconClass="text-amber-400"
                    bgClass="bg-amber-400/10"
                />

                <MonitoringStat
                    icon={Satellite}
                    label="Anomalies"
                    value={stats.anomalies}
                    subtext="Telemetry anomalies"
                    iconClass="text-cyan-400"
                    bgClass="bg-cyan-400/10"
                />
            </div>

            {/* ========================================
          MAIN AREA
      ======================================== */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
                {/* ======================================
            VESSEL LIST
        ====================================== */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70">
                    <div className="border-b border-slate-800 px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-white">Fleet</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Select vessel to monitor
                                </p>
                            </div>

                            <Ship className="h-5 w-5 text-cyan-400" />
                        </div>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto p-2">
                        {loading ? (
                            <div className="p-6 text-center text-sm text-slate-500">
                                Loading vessels...
                            </div>
                        ) : vessels.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-500">
                                No vessels found
                            </div>
                        ) : (
                            vessels.map((vessel) => {
                                const active = vessel._id === selectedVesselId;

                                const vesselTelemetry = telemetry.find(
                                    (item) => item.vessel?._id === vessel._id
                                )?.telemetry;

                                const deviceStatus =
                                    vesselTelemetry?.deviceStatus || vessel.status;

                                return (
                                    <button
                                        key={vessel._id}
                                        onClick={() => setSelectedVesselId(vessel._id)}
                                        className={`mb-2 w-full rounded-lg border p-3 text-left transition ${active
                                                ? "border-cyan-400/40 bg-cyan-400/10"
                                                : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active
                                                            ? "bg-cyan-400/15 text-cyan-400"
                                                            : "bg-slate-800 text-slate-400"
                                                        }`}
                                                >
                                                    <Ship className="h-4 w-4" />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-white">
                                                        {vessel.name}
                                                    </p>

                                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                                        {vessel.vesselId}
                                                    </p>
                                                </div>
                                            </div>

                                            <span
                                                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${deviceStatus === "ONLINE"
                                                        ? "bg-emerald-400"
                                                        : deviceStatus === "WARNING"
                                                            ? "bg-amber-400"
                                                            : "bg-red-400"
                                                    }`}
                                            />
                                        </div>

                                        <div className="mt-3 flex items-center justify-between text-[11px]">
                                            <span className="text-slate-500">
                                                Risk
                                            </span>

                                            <span
                                                className={`font-semibold ${vessel.riskScore >= 75
                                                        ? "text-red-400"
                                                        : vessel.riskScore >= 50
                                                            ? "text-amber-400"
                                                            : "text-emerald-400"
                                                    }`}
                                            >
                                                {vessel.riskScore}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ======================================
            TELEMETRY PANEL
        ====================================== */}
                <div className="space-y-4">
                    {/* Vessel Header */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                        {selectedVessel ? (
                            <>
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                                            <Anchor className="h-7 w-7 text-cyan-400" />
                                        </div>

                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-xl font-bold text-white">
                                                    {selectedVessel.name}
                                                </h2>

                                                <StatusBadge status={statusColor} />
                                            </div>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {selectedVessel.vesselId} •{" "}
                                                {selectedVessel.destination || "Unknown destination"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                            Risk Score
                                        </p>

                                        <p
                                            className={`mt-1 text-2xl font-bold ${selectedVessel.riskScore >= 75
                                                    ? "text-red-400"
                                                    : selectedVessel.riskScore >= 50
                                                        ? "text-amber-400"
                                                        : "text-emerald-400"
                                                }`}
                                        >
                                            {selectedVessel.riskScore}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="py-10 text-center text-slate-500">
                                Select a vessel
                            </div>
                        )}
                    </div>

                    {/* Primary Telemetry */}
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <TelemetryCard
                            icon={Gauge}
                            label="Speed"
                            value={formatNumber(selectedTelemetry?.speed)}
                            unit="kn"
                        />

                        <TelemetryCard
                            icon={Compass}
                            label="Heading"
                            value={formatNumber(selectedTelemetry?.heading, 0)}
                            unit="°"
                        />

                        <TelemetryCard
                            icon={Waves}
                            label="Depth"
                            value={formatNumber(selectedTelemetry?.depth)}
                            unit="m"
                        />

                        <TelemetryCard
                            icon={Fuel}
                            label="Fuel Level"
                            value={formatNumber(selectedTelemetry?.fuelLevel, 0)}
                            unit="%"
                        />
                    </div>

                    {/* Secondary Telemetry */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <InfoCard
                            icon={MapPin}
                            title="GPS Position"
                            value={
                                selectedTelemetry
                                    ? `${formatNumber(
                                        selectedTelemetry.latitude,
                                        4
                                    )}, ${formatNumber(
                                        selectedTelemetry.longitude,
                                        4
                                    )}`
                                    : "--"
                            }
                        />

                        <InfoCard
                            icon={Satellite}
                            title="GPS Signal"
                            value={
                                selectedTelemetry
                                    ? `${formatNumber(
                                        selectedTelemetry.gpsSignal,
                                        0
                                    )}%`
                                    : "--"
                            }
                        />

                        <InfoCard
                            icon={Thermometer}
                            title="Engine Temperature"
                            value={
                                selectedTelemetry
                                    ? `${formatNumber(
                                        selectedTelemetry.engineTemperature,
                                        0
                                    )}°C`
                                    : "--"
                            }
                        />

                        <InfoCard
                            icon={Navigation}
                            title="AIS Status"
                            value={selectedTelemetry?.aisStatus || "--"}
                        />
                    </div>

                    {/* Device Health */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-white">
                                    Edge Device Health
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    ESP32 / onboard telemetry gateway status
                                </p>
                            </div>

                            <Cpu className="h-5 w-5 text-cyan-400" />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <HealthItem
                                label="Device Status"
                                value={selectedTelemetry?.deviceStatus || "--"}
                                status={selectedTelemetry?.deviceStatus}
                            />

                            <HealthItem
                                label="AIS"
                                value={selectedTelemetry?.aisStatus || "--"}
                                status={
                                    selectedTelemetry?.aisStatus === "ACTIVE"
                                        ? "ONLINE"
                                        : selectedTelemetry?.aisStatus === "ANOMALY"
                                            ? "WARNING"
                                            : "OFFLINE"
                                }
                            />

                            <HealthItem
                                label="GPS"
                                value={
                                    selectedTelemetry
                                        ? `${selectedTelemetry.gpsSignal}%`
                                        : "--"
                                }
                                status={
                                    Number(selectedTelemetry?.gpsSignal || 0) >= 80
                                        ? "ONLINE"
                                        : Number(selectedTelemetry?.gpsSignal || 0) >= 50
                                            ? "WARNING"
                                            : "OFFLINE"
                                }
                            />
                        </div>
                    </div>

                    {/* Coordinates */}
                    <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] p-5">
                        <div className="flex items-center gap-3">
                            <Radio className="h-5 w-5 text-cyan-400" />

                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Live Telemetry Stream
                                </p>

                                <p className="mt-1 text-sm text-slate-300">
                                    Socket.IO connection is active and receiving
                                    telemetry updates.
                                </p>
                            </div>

                            <div className="ml-auto flex items-center gap-2">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                                <span className="text-xs text-emerald-400">
                                    STREAMING
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================
// Components
// ========================================

const MonitoringStat = ({
    icon: Icon,
    label,
    value,
    subtext,
    iconClass,
    bgClass,
}) => {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-white">
                        {value}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-600">
                        {subtext}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgClass}`}
                >
                    <Icon className={`h-5 w-5 ${iconClass}`} />
                </div>
            </div>
        </div>
    );
};

const TelemetryCard = ({
    icon: Icon,
    label,
    value,
    unit,
}) => {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2 text-slate-500">
                <Icon className="h-4 w-4 text-cyan-400" />
                <span className="text-xs">{label}</span>
            </div>

            <div className="mt-4 flex items-end gap-2">
                <span className="text-2xl font-bold text-white">
                    {value}
                </span>

                <span className="mb-1 text-xs text-slate-500">
                    {unit}
                </span>
            </div>
        </div>
    );
};

const InfoCard = ({
    icon: Icon,
    title,
    value,
}) => {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-cyan-400" />

                <span className="text-xs text-slate-500">
                    {title}
                </span>
            </div>

            <p className="mt-3 truncate text-sm font-semibold text-slate-200">
                {value}
            </p>
        </div>
    );
};

const HealthItem = ({
    label,
    value,
    status,
}) => {
    const isOnline = status === "ONLINE";
    const isWarning = status === "WARNING";

    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
            <span className="text-xs text-slate-500">
                {label}
            </span>

            <div className="flex items-center gap-2">
                <span
                    className={`h-2 w-2 rounded-full ${isOnline
                            ? "bg-emerald-400"
                            : isWarning
                                ? "bg-amber-400"
                                : "bg-red-400"
                        }`}
                />

                <span
                    className={`text-xs font-medium ${isOnline
                            ? "text-emerald-400"
                            : isWarning
                                ? "text-amber-400"
                                : "text-red-400"
                        }`}
                >
                    {value}
                </span>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const config = {
        ONLINE: {
            text: "ONLINE",
            className:
                "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
        },
        OFFLINE: {
            text: "OFFLINE",
            className:
                "border-slate-700 bg-slate-800 text-slate-400",
        },
        WARNING: {
            text: "WARNING",
            className:
                "border-amber-400/20 bg-amber-400/10 text-amber-400",
        },
        CRITICAL: {
            text: "CRITICAL",
            className:
                "border-red-400/20 bg-red-400/10 text-red-400",
        },
    };

    const item = config[status] || config.OFFLINE;

    return (
        <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${item.className}`}
        >
            {item.text}
        </span>
    );
};

export default LiveMonitoring;