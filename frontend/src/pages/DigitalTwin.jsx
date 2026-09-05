import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    Anchor,
    BatteryCharging,
    Compass,
    Gauge,
    MapPin,
    Navigation,
    Radio,
    ShieldCheck,
    Ship,
    Thermometer,
    Waves,
    Wifi,
    Zap,
} from "lucide-react";
import { createSocket } from "../services/socket";
import api from "../services/api";


const DigitalTwin = () => {
    const [vessels, setVessels] = useState([]);
    const [telemetry, setTelemetry] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();

        const socket = createSocket();

        socket.on("telemetry:update", (data) => {
            if (!data?.success || !Array.isArray(data.data)) return;

            const incoming = data.data.map((item) => ({
                vessel: item.vessel,
                telemetry: item.telemetry || item,
            }));

            setTelemetry(incoming);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const loadData = async () => {
        try {
            const [vesselRes, telemetryRes] =
                await Promise.all([
                    api.get("/vessels"),
                    api.get("/telemetry"),
                ]);

            const vesselData =
                vesselRes.data?.vessels || [];

            const telemetryData =
                telemetryRes.data?.data || [];

            setVessels(vesselData);

            setTelemetry(
                telemetryData.map((item) => ({
                    vessel: item.vessel,
                    telemetry:
                        item.telemetry || item,
                }))
            );

            if (vesselData.length > 0) {
                setSelectedId(vesselData[0]._id);
            }
        } catch (error) {
            console.error(
                "Digital Twin loading error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const selectedVessel = useMemo(
        () =>
            vessels.find(
                (vessel) =>
                    vessel._id === selectedId
            ),
        [vessels, selectedId]
    );

    const selectedTelemetry = useMemo(() => {
        const record = telemetry.find(
            (item) =>
                item.vessel?._id === selectedId
        );

        return record?.telemetry || null;
    }, [telemetry, selectedId]);

    const getValue = (
        telemetryKey,
        vesselKey,
        fallback = "--"
    ) => {
        return (
            selectedTelemetry?.[telemetryKey] ??
            selectedVessel?.[vesselKey] ??
            fallback
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Activity className="h-4 w-4 animate-pulse text-cyan-400" />
                    Loading digital twin...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* HEADER */}

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                        <Activity className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Digital Twin
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Live virtual representation of
                            maritime vessel systems
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </span>

                    <span className="text-xs font-medium text-emerald-400">
                        DIGITAL TWIN ONLINE
                    </span>
                </div>
            </div>

            {/* VESSEL SELECTOR */}

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Select Vessel
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Switch between live vessel digital
                            twins
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {vessels.map((vessel) => (
                            <button
                                key={vessel._id}
                                onClick={() =>
                                    setSelectedId(vessel._id)
                                }
                                className={`rounded-lg border px-3 py-2 text-xs transition ${selectedId === vessel._id
                                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-400"
                                        : "border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                                    }`}
                            >
                                {vessel.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {!selectedVessel ? (
                <EmptyState />
            ) : (
                <>
                    {/* VESSEL OVERVIEW */}

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
                            {/* Decorative grid */}

                            <div
                                className="pointer-events-none absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(rgba(34,211,238,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.12) 1px, transparent 1px)",
                                    backgroundSize:
                                        "42px 42px",
                                }}
                            />

                            <div className="relative p-6">
                                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                                            <Ship className="h-8 w-8 text-cyan-400" />
                                        </div>

                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-xl font-bold text-white">
                                                    {selectedVessel.name}
                                                </h2>

                                                <StatusBadge
                                                    status={
                                                        selectedVessel.status
                                                    }
                                                />
                                            </div>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {selectedVessel.vesselId}
                                                {" • "}
                                                {selectedVessel.vesselType ||
                                                    "MARITIME VESSEL"}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-600">
                                                {
                                                    selectedVessel.route
                                                        ?.origin
                                                }{" "}
                                                →{" "}
                                                {
                                                    selectedVessel.route
                                                        ?.destination
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                                            Current Risk
                                        </p>

                                        <p
                                            className={`mt-1 text-4xl font-black ${getRiskColor(
                                                selectedVessel.riskLevel
                                            )}`}
                                        >
                                            {selectedVessel.riskScore ??
                                                0}
                                        </p>

                                        <p
                                            className={`text-[10px] font-semibold ${getRiskColor(
                                                selectedVessel.riskLevel
                                            )}`}
                                        >
                                            {selectedVessel.riskLevel ||
                                                "UNKNOWN"}
                                        </p>
                                    </div>
                                </div>

                                {/* Vessel visual */}

                                <div className="mt-8 flex min-h-[250px] items-center justify-center">
                                    <div className="relative flex h-52 w-52 items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border border-cyan-400/10" />

                                        <div className="absolute inset-5 rounded-full border border-cyan-400/10" />

                                        <div className="absolute inset-10 rounded-full border border-cyan-400/10" />

                                        <div className="absolute h-1 w-full bg-cyan-400/10" />

                                        <div className="absolute h-full w-1 bg-cyan-400/10" />

                                        <div className="relative flex h-24 w-12 items-center justify-center rounded-[45%] border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
                                            <div className="h-14 w-5 rounded-full border border-cyan-300/50 bg-cyan-400/10" />

                                            <div className="absolute -bottom-3 h-8 w-5 rounded-b-full border-b-2 border-l-2 border-r-2 border-cyan-400 bg-slate-950" />
                                        </div>

                                        <div className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.8)]" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    <MiniMetric
                                        icon={Gauge}
                                        label="Speed"
                                        value={`${getValue(
                                            "speed",
                                            "speed",
                                            0
                                        )} kn`}
                                    />

                                    <MiniMetric
                                        icon={Compass}
                                        label="Heading"
                                        value={`${getValue(
                                            "heading",
                                            "heading",
                                            0
                                        )}°`}
                                    />

                                    <MiniMetric
                                        icon={Navigation}
                                        label="Destination"
                                        value={
                                            selectedVessel
                                                .destination ||
                                            selectedVessel.route
                                                ?.destination ||
                                            "--"
                                        }
                                    />

                                    <MiniMetric
                                        icon={MapPin}
                                        label="Position"
                                        value={`${Number(
                                            getValue(
                                                "latitude",
                                                "latitude",
                                                0
                                            )
                                        ).toFixed(3)}, ${Number(
                                            getValue(
                                                "longitude",
                                                "longitude",
                                                0
                                            )
                                        ).toFixed(3)}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SYSTEM HEALTH */}

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-white">
                                        System Health
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-600">
                                        Real-time digital state
                                    </p>
                                </div>

                                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                            </div>

                            <div className="mt-5 space-y-3">
                                <HealthRow
                                    icon={Radio}
                                    label="GPS Signal"
                                    value={`${getValue(
                                        "gpsSignal",
                                        null,
                                        0
                                    )}%`}
                                    progress={getValue(
                                        "gpsSignal",
                                        null,
                                        0
                                    )}
                                    status={
                                        Number(
                                            getValue(
                                                "gpsSignal",
                                                null,
                                                0
                                            )
                                        ) > 70
                                            ? "GOOD"
                                            : "WEAK"
                                    }
                                />

                                <HealthRow
                                    icon={Wifi}
                                    label="AIS System"
                                    value={getValue(
                                        "aisStatus",
                                        null,
                                        "UNKNOWN"
                                    )}
                                    progress={
                                        getValue(
                                            "aisStatus",
                                            null,
                                            "INACTIVE"
                                        ) === "ACTIVE"
                                            ? 100
                                            : 35
                                    }
                                    status={
                                        getValue(
                                            "aisStatus",
                                            null,
                                            "INACTIVE"
                                        )
                                    }
                                />

                                <HealthRow
                                    icon={Zap}
                                    label="Edge Device"
                                    value={getValue(
                                        "deviceStatus",
                                        null,
                                        "UNKNOWN"
                                    )}
                                    progress={
                                        getValue(
                                            "deviceStatus",
                                            null,
                                            "OFFLINE"
                                        ) === "ONLINE"
                                            ? 100
                                            : 45
                                    }
                                    status={getValue(
                                        "deviceStatus",
                                        null,
                                        "UNKNOWN"
                                    )}
                                />

                                <HealthRow
                                    icon={Thermometer}
                                    label="Engine Temperature"
                                    value={`${getValue(
                                        "engineTemperature",
                                        null,
                                        0
                                    )} °C`}
                                    progress={Math.min(
                                        Number(
                                            getValue(
                                                "engineTemperature",
                                                null,
                                                0
                                            )
                                        ),
                                        100
                                    )}
                                    status={
                                        Number(
                                            getValue(
                                                "engineTemperature",
                                                null,
                                                0
                                            )
                                        ) > 90
                                            ? "HIGH"
                                            : "NORMAL"
                                    }
                                />

                                <HealthRow
                                    icon={BatteryCharging}
                                    label="Fuel Level"
                                    value={`${getValue(
                                        "fuelLevel",
                                        null,
                                        0
                                    )}%`}
                                    progress={Number(
                                        getValue(
                                            "fuelLevel",
                                            null,
                                            0
                                        )
                                    )}
                                    status={
                                        Number(
                                            getValue(
                                                "fuelLevel",
                                                null,
                                                0
                                            )
                                        ) < 25
                                            ? "LOW"
                                            : "NORMAL"
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* TELEMETRY */}

                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-white">
                                    Live Telemetry
                                </h2>

                                <p className="mt-1 text-xs text-slate-600">
                                    Sensor and navigation state
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                                <Activity className="h-3.5 w-3.5" />
                                LIVE DATA
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                            <TelemetryCard
                                icon={Gauge}
                                label="Speed"
                                value={getValue(
                                    "speed",
                                    "speed",
                                    0
                                )}
                                unit="kn"
                            />

                            <TelemetryCard
                                icon={Compass}
                                label="Heading"
                                value={getValue(
                                    "heading",
                                    "heading",
                                    0
                                )}
                                unit="°"
                            />

                            <TelemetryCard
                                icon={Waves}
                                label="Depth"
                                value={getValue(
                                    "depth",
                                    null,
                                    0
                                )}
                                unit="m"
                            />

                            <TelemetryCard
                                icon={Radio}
                                label="GPS Signal"
                                value={getValue(
                                    "gpsSignal",
                                    null,
                                    0
                                )}
                                unit="%"
                            />

                            <TelemetryCard
                                icon={Thermometer}
                                label="Engine Temp"
                                value={getValue(
                                    "engineTemperature",
                                    null,
                                    0
                                )}
                                unit="°C"
                            />

                            <TelemetryCard
                                icon={BatteryCharging}
                                label="Fuel"
                                value={getValue(
                                    "fuelLevel",
                                    null,
                                    0
                                )}
                                unit="%"
                            />
                        </div>
                    </div>

                    {/* NAVIGATION + SECURITY */}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Navigation */}

                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                            <div className="flex items-center gap-2">
                                <Anchor className="h-4 w-4 text-cyan-400" />

                                <h3 className="font-semibold text-white">
                                    Navigation State
                                </h3>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <InfoBox
                                    label="Latitude"
                                    value={Number(
                                        getValue(
                                            "latitude",
                                            "latitude",
                                            0
                                        )
                                    ).toFixed(5)}
                                />

                                <InfoBox
                                    label="Longitude"
                                    value={Number(
                                        getValue(
                                            "longitude",
                                            "longitude",
                                            0
                                        )
                                    ).toFixed(5)}
                                />

                                <InfoBox
                                    label="Origin"
                                    value={
                                        selectedVessel.route
                                            ?.origin || "--"
                                    }
                                />

                                <InfoBox
                                    label="Destination"
                                    value={
                                        selectedVessel.route
                                            ?.destination ||
                                        selectedVessel.destination ||
                                        "--"
                                    }
                                />
                            </div>
                        </div>

                        {/* Security */}

                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />

                                <h3 className="font-semibold text-white">
                                    Security State
                                </h3>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <SecurityState
                                    label="Risk Level"
                                    value={
                                        selectedVessel.riskLevel ||
                                        "UNKNOWN"
                                    }
                                    danger={
                                        selectedVessel.riskLevel ===
                                        "CRITICAL" ||
                                        selectedVessel.riskLevel ===
                                        "HIGH"
                                    }
                                />

                                <SecurityState
                                    label="Risk Score"
                                    value={
                                        selectedVessel.riskScore ??
                                        0
                                    }
                                    danger={
                                        Number(
                                            selectedVessel.riskScore
                                        ) >= 67
                                    }
                                />

                                <SecurityState
                                    label="AIS State"
                                    value={getValue(
                                        "aisStatus",
                                        null,
                                        "UNKNOWN"
                                    )}
                                    danger={
                                        getValue(
                                            "aisStatus",
                                            null,
                                            "ACTIVE"
                                        ) !== "ACTIVE"
                                    }
                                />

                                <SecurityState
                                    label="Device"
                                    value={getValue(
                                        "deviceStatus",
                                        null,
                                        "UNKNOWN"
                                    )}
                                    danger={
                                        getValue(
                                            "deviceStatus",
                                            null,
                                            "ONLINE"
                                        ) !== "ONLINE"
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* DIGITAL TWIN FOOTER */}

                    <div className="flex flex-col gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.02] p-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10">
                                <Activity className="h-4 w-4 text-cyan-400" />
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-slate-300">
                                    Digital Twin Synchronization
                                </p>

                                <p className="mt-1 text-[10px] text-slate-600">
                                    Virtual state is synchronized
                                    with vessel telemetry
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                            <CheckDot />
                            SYNCHRONIZED
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// ========================================
// MINI METRIC
// ========================================

const MiniMetric = ({
    icon: Icon,
    label,
    value,
}) => {
    return (
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-cyan-400" />

                <span className="text-[9px] uppercase tracking-wider text-slate-600">
                    {label}
                </span>
            </div>

            <p className="mt-2 truncate text-sm font-semibold text-slate-200">
                {value}
            </p>
        </div>
    );
};

// ========================================
// TELEMETRY CARD
// ========================================

const TelemetryCard = ({
    icon: Icon,
    label,
    value,
    unit,
}) => {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-cyan-400" />

                <span className="text-[9px] uppercase tracking-wider text-slate-600">
                    LIVE
                </span>
            </div>

            <p className="mt-4 text-[10px] text-slate-600">
                {label}
            </p>

            <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">
                    {value}
                </span>

                <span className="text-[10px] text-slate-600">
                    {unit}
                </span>
            </div>
        </div>
    );
};

// ========================================
// HEALTH ROW
// ========================================

const HealthRow = ({
    icon: Icon,
    label,
    value,
    progress,
    status,
}) => {
    return (
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-slate-500" />

                    <span className="text-xs text-slate-400">
                        {label}
                    </span>
                </div>

                <span
                    className={`text-[9px] font-semibold ${status === "GOOD" ||
                            status === "ACTIVE" ||
                            status === "ONLINE" ||
                            status === "NORMAL"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                >
                    {status}
                </span>
            </div>

            <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                        className="h-full rounded-full bg-cyan-400 transition-all"
                        style={{
                            width: `${Math.max(
                                0,
                                Math.min(Number(progress) || 0, 100)
                            )}%`,
                        }}
                    />
                </div>

                <span className="w-12 text-right text-[10px] text-slate-500">
                    {value}
                </span>
            </div>
        </div>
    );
};

// ========================================
// INFO BOX
// ========================================

const InfoBox = ({
    label,
    value,
}) => {
    return (
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
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
// SECURITY STATE
// ========================================

const SecurityState = ({
    label,
    value,
    danger,
}) => {
    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 p-3">
            <span className="text-xs text-slate-500">
                {label}
            </span>

            <span
                className={`text-xs font-semibold ${danger
                        ? "text-red-400"
                        : "text-emerald-400"
                    }`}
            >
                {value}
            </span>
        </div>
    );
};

// ========================================
// STATUS
// ========================================

const StatusBadge = ({ status }) => {
    const styles = {
        ONLINE:
            "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
        OFFLINE:
            "border-slate-700 bg-slate-800 text-slate-500",
        WARNING:
            "border-amber-400/20 bg-amber-400/10 text-amber-400",
        CRITICAL:
            "border-red-400/20 bg-red-400/10 text-red-400",
    };

    return (
        <span
            className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${styles[status] ||
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

const EmptyState = () => {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/70">
            <Ship className="h-10 w-10 text-slate-700" />

            <p className="mt-4 text-sm text-slate-500">
                No vessel available
            </p>
        </div>
    );
};

// ========================================
// HELPERS
// ========================================

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

const CheckDot = () => (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/10">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
    </span>
);

export default DigitalTwin;