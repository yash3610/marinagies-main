import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    Battery,
    Cpu,
    HardDrive,
    Radio,
    RefreshCw,
    Search,
    Signal,
    Smartphone,
    Wifi,
    WifiOff,
    Ship,
    Clock3,
    ShieldCheck,
} from "lucide-react";
import api from "../services/api";

const Devices = () => {
    const [vessels, setVessels] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("ALL");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            setLoading(true);

            const response = await api.get("/vessels");

            setVessels(
                response.data?.vessels || []
            );
        } catch (error) {
            console.error(
                "Device data loading error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * Temporary device representation.
     * Actual Device model + ESP32 data will be
     * connected in the next backend step.
     */
    const devices = useMemo(() => {
        return vessels.map((vessel, index) => {
            const deviceStatus =
                vessel.status === "OFFLINE"
                    ? "OFFLINE"
                    : vessel.status === "WARNING" ||
                        vessel.status === "CRITICAL"
                        ? "WARNING"
                        : "ONLINE";

            const signal =
                deviceStatus === "OFFLINE"
                    ? 0
                    : deviceStatus === "WARNING"
                        ? 54 + index * 5
                        : 87 + (index % 3) * 4;

            const battery =
                deviceStatus === "OFFLINE"
                    ? 0
                    : 70 + ((index * 7) % 25);

            return {
                id: `DEV-${String(index + 1).padStart(
                    3,
                    "0"
                )}`,
                name: `Marine Edge Node ${String(
                    index + 1
                ).padStart(2, "0")}`,
                type:
                    index % 2 === 0
                        ? "ESP32 TELEMETRY NODE"
                        : "NAVIGATION SENSOR",
                vessel,
                status: deviceStatus,
                signal,
                battery,
                firmware:
                    index % 2 === 0
                        ? "v1.4.2"
                        : "v1.3.8",
                lastSeen:
                    deviceStatus === "OFFLINE"
                        ? "2h 14m ago"
                        : "Just now",
                temperature:
                    deviceStatus === "OFFLINE"
                        ? "--"
                        : `${36 + index}°C`,
            };
        });
    }, [vessels]);

    const filteredDevices = devices.filter(
        (device) => {
            const matchesSearch =
                device.name
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    ) ||
                device.id
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    ) ||
                device.vessel?.name
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );

            const matchesStatus =
                statusFilter === "ALL" ||
                device.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        }
    );

    const onlineCount = devices.filter(
        (d) => d.status === "ONLINE"
    ).length;

    const warningCount = devices.filter(
        (d) => d.status === "WARNING"
    ).length;

    const offlineCount = devices.filter(
        (d) => d.status === "OFFLINE"
    ).length;

    const averageSignal =
        devices.length > 0
            ? Math.round(
                devices.reduce(
                    (sum, device) =>
                        sum + device.signal,
                    0
                ) / devices.length
            )
            : 0;

    return (
        <div className="space-y-5">
            {/* HEADER */}

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                        <Cpu className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Connected Devices
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Edge devices, sensors and vessel
                            telemetry nodes
                        </p>
                    </div>
                </div>

                <button
                    onClick={loadDevices}
                    className="flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400 transition hover:border-slate-700 hover:text-white xl:self-auto"
                >
                    <RefreshCw
                        className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""
                            }`}
                    />
                    Refresh Devices
                </button>
            </div>

            {/* DEVICE STATS */}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <DeviceStat
                    icon={Wifi}
                    label="Online"
                    value={onlineCount}
                    description="Connected nodes"
                    type="green"
                />

                <DeviceStat
                    icon={Activity}
                    label="Warning"
                    value={warningCount}
                    description="Needs attention"
                    type="orange"
                />

                <DeviceStat
                    icon={WifiOff}
                    label="Offline"
                    value={offlineCount}
                    description="Disconnected nodes"
                    type="red"
                />

                <DeviceStat
                    icon={Signal}
                    label="Avg Signal"
                    value={`${averageSignal}%`}
                    description="Fleet connectivity"
                    type="cyan"
                />
            </div>

            {/* DEVICE HEALTH */}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
                {/* DEVICE LIST */}

                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                    <div className="border-b border-slate-800 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-white">
                                    Device Registry
                                </h2>

                                <p className="mt-1 text-[10px] text-slate-600">
                                    Registered maritime edge nodes
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {/* SEARCH */}

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />

                                    <input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Search device..."
                                        className="h-9 w-44 rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-xs text-slate-300 outline-none placeholder:text-slate-700 focus:border-cyan-400/30"
                                    />
                                </div>

                                {/* FILTER */}

                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(
                                            e.target.value
                                        )
                                    }
                                    className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-slate-400 outline-none"
                                >
                                    <option value="ALL">
                                        All
                                    </option>
                                    <option value="ONLINE">
                                        Online
                                    </option>
                                    <option value="WARNING">
                                        Warning
                                    </option>
                                    <option value="OFFLINE">
                                        Offline
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-800/70">
                        {filteredDevices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14">
                                <HardDrive className="h-8 w-8 text-slate-700" />

                                <p className="mt-3 text-xs text-slate-500">
                                    No devices found
                                </p>
                            </div>
                        ) : (
                            filteredDevices.map(
                                (device) => (
                                    <DeviceRow
                                        key={device.id}
                                        device={device}
                                    />
                                )
                            )
                        )}
                    </div>
                </div>

                {/* SYSTEM HEALTH */}

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-cyan-400" />

                        <h2 className="text-sm font-semibold text-white">
                            Device Health
                        </h2>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-600">
                        Edge infrastructure overview
                    </p>

                    <div className="mt-6 space-y-5">
                        <HealthBar
                            label="Connectivity"
                            value={averageSignal}
                        />

                        <HealthBar
                            label="Device Availability"
                            value={
                                devices.length
                                    ? Math.round(
                                        (onlineCount /
                                            devices.length) *
                                        100
                                    )
                                    : 0
                            }
                        />

                        <HealthBar
                            label="Telemetry Health"
                            value={
                                devices.length
                                    ? Math.round(
                                        ((onlineCount +
                                            warningCount) /
                                            devices.length) *
                                        100
                                    )
                                    : 0
                            }
                        />
                    </div>

                    {/* PROTOCOLS */}

                    <div className="mt-7 border-t border-slate-800 pt-5">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                            Active Protocols
                        </p>

                        <div className="mt-3 space-y-2">
                            <Protocol
                                name="Socket.IO Telemetry"
                                status="ACTIVE"
                            />

                            <Protocol
                                name="AIS Data Stream"
                                status="MOCK"
                            />

                            <Protocol
                                name="GPS Sensor"
                                status="MOCK"
                            />

                            <Protocol
                                name="ESP32 Edge Agent"
                                status="READY"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* DEVICE CAPABILITIES */}

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="mb-5 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-cyan-400" />

                    <div>
                        <h2 className="text-sm font-semibold text-white">
                            Edge Device Capabilities
                        </h2>

                        <p className="mt-1 text-[10px] text-slate-600">
                            MARINEAEGIS edge intelligence layer
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <Capability
                        icon={Radio}
                        title="GPS Monitoring"
                        description="Position and navigation telemetry"
                    />

                    <Capability
                        icon={Activity}
                        title="Motion Sensors"
                        description="IMU and vessel movement data"
                    />

                    <Capability
                        icon={Signal}
                        title="AIS Monitoring"
                        description="Automatic identification anomalies"
                    />

                    <Capability
                        icon={ShieldCheck}
                        title="Cyber Detection"
                        description="Edge-level security events"
                    />
                </div>
            </div>
        </div>
    );
};

/* ========================================
   DEVICE STAT
======================================== */

const DeviceStat = ({
    icon: Icon,
    label,
    value,
    description,
    type,
}) => {
    const styles = {
        green:
            "text-emerald-400 bg-emerald-400/10",
        orange:
            "text-orange-400 bg-orange-400/10",
        red: "text-red-400 bg-red-400/10",
        cyan: "text-cyan-400 bg-cyan-400/10",
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
   DEVICE ROW
======================================== */

const DeviceRow = ({ device }) => {
    const statusConfig = {
        ONLINE: {
            icon: Wifi,
            text: "ONLINE",
            className:
                "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        },

        WARNING: {
            icon: Activity,
            text: "WARNING",
            className:
                "text-orange-400 bg-orange-400/10 border-orange-400/20",
        },

        OFFLINE: {
            icon: WifiOff,
            text: "OFFLINE",
            className:
                "text-red-400 bg-red-400/10 border-red-400/20",
        },
    };

    const config =
        statusConfig[device.status];

    const StatusIcon = config.icon;

    return (
        <div className="p-4 transition hover:bg-slate-900/30">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* DEVICE */}

                <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/5">
                        <Cpu className="h-5 w-5 text-cyan-400" />

                        <span
                            className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${device.status === "ONLINE"
                                    ? "bg-emerald-400"
                                    : device.status ===
                                        "WARNING"
                                        ? "bg-orange-400"
                                        : "bg-red-400"
                                }`}
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-200">
                                {device.name}
                            </p>

                            <span className="text-[9px] text-slate-700">
                                {device.id}
                            </span>
                        </div>

                        <p className="mt-1 text-[9px] text-slate-600">
                            {device.type}
                        </p>
                    </div>
                </div>

                {/* VESSEL */}

                <div className="flex items-center gap-2 lg:w-40">
                    <Ship className="h-3.5 w-3.5 text-slate-600" />

                    <div>
                        <p className="text-[9px] text-slate-600">
                            VESSEL
                        </p>

                        <p className="text-xs text-slate-300">
                            {device.vessel?.name}
                        </p>
                    </div>
                </div>

                {/* SIGNAL */}

                <div className="lg:w-28">
                    <div className="mb-1 flex justify-between">
                        <span className="text-[9px] text-slate-600">
                            SIGNAL
                        </span>

                        <span className="text-[9px] text-slate-400">
                            {device.signal}%
                        </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                            className="h-full rounded-full bg-cyan-400"
                            style={{
                                width: `${device.signal}%`,
                            }}
                        />
                    </div>
                </div>

                {/* BATTERY */}

                <div className="flex items-center gap-2 lg:w-24">
                    <Battery className="h-4 w-4 text-slate-500" />

                    <div>
                        <p className="text-[9px] text-slate-600">
                            BATTERY
                        </p>

                        <p className="text-xs text-slate-300">
                            {device.battery}%
                        </p>
                    </div>
                </div>

                {/* STATUS */}

                <div>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold ${config.className}`}
                    >
                        <StatusIcon className="h-3 w-3" />

                        {config.text}
                    </span>

                    <p className="mt-1 text-right text-[8px] text-slate-700">
                        {device.lastSeen}
                    </p>
                </div>
            </div>

            {/* EXTRA */}

            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-800/50 pt-3 text-[9px] text-slate-600">
                <span>
                    Firmware:{" "}
                    <span className="text-slate-400">
                        {device.firmware}
                    </span>
                </span>

                <span>
                    Temperature:{" "}
                    <span className="text-slate-400">
                        {device.temperature}
                    </span>
                </span>

                <span className="flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    Last seen: {device.lastSeen}
                </span>
            </div>
        </div>
    );
};

/* ========================================
   HEALTH BAR
======================================== */

const HealthBar = ({
    label,
    value,
}) => {
    return (
        <div>
            <div className="mb-2 flex justify-between">
                <span className="text-xs text-slate-400">
                    {label}
                </span>

                <span className="text-xs font-semibold text-cyan-400">
                    {value}%
                </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                    className="h-full rounded-full bg-cyan-400 transition-all"
                    style={{
                        width: `${value}%`,
                    }}
                />
            </div>
        </div>
    );
};

/* ========================================
   PROTOCOL
======================================== */

const Protocol = ({
    name,
    status,
}) => {
    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2.5">
            <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <span className="text-[10px] text-slate-400">
                    {name}
                </span>
            </div>

            <span className="text-[9px] font-semibold text-emerald-400">
                {status}
            </span>
        </div>
    );
};

/* ========================================
   CAPABILITY
======================================== */

const Capability = ({
    icon: Icon,
    title,
    description,
}) => {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10">
                <Icon className="h-4 w-4 text-cyan-400" />
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-300">
                {title}
            </p>

            <p className="mt-1 text-[9px] leading-4 text-slate-600">
                {description}
            </p>
        </div>
    );
};

export default Devices;