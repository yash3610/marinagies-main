import DarkSelect from "../components/ui/DarkSelect";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Cpu, FlaskConical, LockKeyhole, RefreshCw, Search, ShieldCheck, UnlockKeyhole, Wifi, WifiOff } from "lucide-react";
import api from "../services/api";
import { createSocket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";

const formatAge = (value) => {
    if (!value) return "Never";
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
};

const statusStyle = {
    ONLINE: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
    WARNING: "border-orange-400/20 bg-orange-400/10 text-orange-400",
    OFFLINE: "border-red-400/20 bg-red-400/10 text-red-400",
    QUARANTINED: "border-purple-400/20 bg-purple-400/10 text-purple-400",
};

const EdgeArmor = () => {
    const { hasPermission } = useAuth();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [fault, setFault] = useState("HIGH_TEMPERATURE");
    const [busyId, setBusyId] = useState(null);

    const mergeDevice = useCallback((device) => {
        if (!device?._id) return;
        setDevices((current) => {
            const exists = current.some((item) => item._id === device._id);
            return exists ? current.map((item) => item._id === device._id ? device : item) : [device, ...current];
        });
    }, []);

    const loadDevices = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/devices");
            setDevices(response.data?.devices || []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to load EdgeArmor devices");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(loadDevices, 0);
        const socket = createSocket();
        socket.on("edge-device:update", mergeDevice);
        return () => {
            window.clearTimeout(timer);
            socket.disconnect();
        };
    }, [loadDevices, mergeDevice]);

    const runAction = async (device, action) => {
        try {
            setBusyId(device._id);
            setError("");
            let response;
            if (action === "quarantine") {
                const reason = window.prompt("Quarantine reason (minimum 10 characters):", "Unexplained EdgeArmor health anomaly");
                if (!reason) return;
                const confirmSafetyImpact = device.criticality === "SAFETY_CRITICAL"
                    ? window.confirm("This is safety-critical. Confirm that a safe fallback is available before quarantine.")
                    : false;
                if (device.criticality === "SAFETY_CRITICAL" && !confirmSafetyImpact) return;
                response = await api.post(`/devices/${device._id}/quarantine`, { reason, confirmSafetyImpact });
            } else if (action === "release") {
                response = await api.post(`/devices/${device._id}/release`);
            } else {
                response = await api.post(`/devices/${device._id}/simulate-fault`, { fault });
            }
            mergeDevice(response.data.device);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Device action failed");
        } finally {
            setBusyId(null);
        }
    };

    const visible = useMemo(() => devices.filter((device) => {
        const effectiveStatus = device.containmentState === "QUARANTINED" ? "QUARANTINED" : device.status;
        const query = search.toLowerCase();
        const matchesSearch = !query || [device.deviceId, device.name, device.vessel?.name]
            .some((value) => String(value || "").toLowerCase().includes(query));
        return matchesSearch && (status === "ALL" || effectiveStatus === status);
    }), [devices, search, status]);

    const count = (value) => devices.filter((device) => (
        value === "QUARANTINED"
            ? device.containmentState === value
            : device.containmentState !== "QUARANTINED" && device.status === value
    )).length;
    const averageHealth = devices.length
        ? Math.round(devices.reduce((total, device) => total + (device.health?.score || 0), 0) / devices.length)
        : 0;

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                        <ShieldCheck className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">EdgeArmor</h1>
                        <p className="mt-1 text-sm text-slate-400">Device identity, heartbeat, firmware and sensor-health defense</p>
                    </div>
                </div>
                <button type="button" onClick={loadDevices} className="flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
            </div>

            {error && <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</div>}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <Stat icon={Wifi} label="Online" value={count("ONLINE")} tone="emerald" />
                <Stat icon={Activity} label="Warning" value={count("WARNING")} tone="orange" />
                <Stat icon={WifiOff} label="Offline" value={count("OFFLINE")} tone="red" />
                <Stat icon={LockKeyhole} label="Quarantined" value={count("QUARANTINED")} tone="purple" />
                <Stat icon={ShieldCheck} label="Average Health" value={`${averageHealth}%`} tone="cyan" />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70">
                <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-white">Trusted Device Registry</h2>
                        <p className="mt-1 text-[10px] text-slate-600">Devices auto-register when authenticated telemetry is received</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search devices" className="h-9 w-44 rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-xs text-slate-300 outline-none" />
                        </div>
                        <DarkSelect value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-slate-300">
                            {['ALL', 'ONLINE', 'WARNING', 'OFFLINE', 'QUARANTINED'].map((item) => <option key={item}>{item}</option>)}
                        </DarkSelect>
                        {hasPermission("devices:manage") && (
                            <DarkSelect value={fault} onChange={(event) => setFault(event.target.value)} className="h-9 rounded-lg border border-orange-400/20 bg-orange-400/5 px-3 text-xs text-orange-300">
                                <option value="HIGH_TEMPERATURE">Mock: High temperature</option>
                                <option value="LOW_SIGNAL">Mock: Low signal</option>
                                <option value="FIRMWARE_TAMPER">Mock: Firmware tamper</option>
                                <option value="HEARTBEAT_LOSS">Mock: Heartbeat loss</option>
                            </DarkSelect>
                        )}
                    </div>
                </div>

                {loading && !devices.length ? (
                    <div className="p-12 text-center text-sm text-slate-500">Loading EdgeArmor registry...</div>
                ) : !visible.length ? (
                    <div className="p-12 text-center">
                        <Cpu className="mx-auto h-8 w-8 text-slate-700" />
                        <p className="mt-3 text-sm text-slate-500">No registered devices yet.</p>
                        <p className="mt-1 text-xs text-slate-700">Start the voyage simulator to send mock ESP32/MPU6050 telemetry.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/70">
                        {visible.map((device) => (
                            <DeviceCard
                                key={device._id}
                                device={device}
                                busy={busyId === device._id}
                                canManage={hasPermission("devices:manage")}
                                canQuarantine={hasPermission("devices:quarantine")}
                                onAction={(action) => runAction(device, action)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Stat = ({ icon: Icon, label, value, tone }) => (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <Icon className={`h-4 w-4 ${{
            emerald: "text-emerald-400", orange: "text-orange-400", red: "text-red-400",
            purple: "text-purple-400", cyan: "text-cyan-400",
        }[tone]}`} />
        <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
        <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
);

const DeviceCard = ({ device, busy, canManage, canQuarantine, onAction }) => {
    const effectiveStatus = device.containmentState === "QUARANTINED" ? "QUARANTINED" : device.status;
    return (
        <div className="p-4">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr_.8fr_1.4fr_auto] xl:items-center">
                <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3"><Cpu className="h-5 w-5 text-cyan-400" /></div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-200">{device.name}</p>
                            <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${statusStyle[effectiveStatus]}`}>{effectiveStatus}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500">{device.deviceId} · {device.type.replaceAll("_", " ")}</p>
                        <p className="mt-1 text-[10px] text-slate-600">{device.source === "SIMULATED" ? "Mock ESP32 adapter" : "Physical/registered device"}</p>
                        {device.mockFault?.type && <p className="mt-1 text-[9px] text-orange-400">Active mock fault: {device.mockFault.type.replaceAll("_", " ")}</p>}
                    </div>
                </div>
                <Info label="Vessel" value={device.vessel?.name || "--"} sub={device.vessel?.vesselId} />
                <Info label="Heartbeat" value={formatAge(device.lastHeartbeatAt)} sub={`${device.heartbeatCount || 0} received`} />
                <div>
                    <div className="flex justify-between text-[10px]"><span className="text-slate-500">Health</span><span className="text-cyan-400">{device.health?.score ?? 0}%</span></div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${device.health?.score || 0}%` }} /></div>
                    <p className="mt-2 text-[10px] leading-4 text-slate-500">{device.health?.reasons?.[0] || "No health explanation"}</p>
                    <p className="mt-1 text-[9px] text-slate-700">Firmware {device.reportedFirmware} / approved {device.approvedFirmware} · Signal {device.health?.signalStrength ?? 0}% · Temp {device.health?.temperature ?? "--"} C</p>
                </div>
                <div className="flex flex-wrap gap-2 xl:justify-end">
                    {canManage && device.source === "SIMULATED" && (
                        <button type="button" disabled={busy} onClick={() => onAction("fault")} className="flex items-center gap-1 rounded-lg border border-orange-400/20 px-3 py-2 text-[10px] text-orange-300 disabled:opacity-50"><FlaskConical className="h-3 w-3" /> Inject</button>
                    )}
                    {canQuarantine && device.containmentState === "ACTIVE" && (
                        <button type="button" disabled={busy} onClick={() => onAction("quarantine")} className="flex items-center gap-1 rounded-lg border border-purple-400/20 px-3 py-2 text-[10px] text-purple-300 disabled:opacity-50"><LockKeyhole className="h-3 w-3" /> Quarantine</button>
                    )}
                    {canQuarantine && device.containmentState === "QUARANTINED" && (
                        <button type="button" disabled={busy} onClick={() => onAction("release")} className="flex items-center gap-1 rounded-lg border border-emerald-400/20 px-3 py-2 text-[10px] text-emerald-300 disabled:opacity-50"><UnlockKeyhole className="h-3 w-3" /> Release</button>
                    )}
                </div>
            </div>
            {device.health?.anomalyCodes?.length > 0 && (
                <div className="mt-3 flex items-center gap-2 border-t border-slate-800/60 pt-3 text-[10px] text-orange-300">
                    <AlertTriangle className="h-3.5 w-3.5" /> {device.health.anomalyCodes.join(" · ")}
                </div>
            )}
        </div>
    );
};

const Info = ({ label, value, sub }) => <div><p className="text-[9px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-xs text-slate-300">{value}</p><p className="mt-1 text-[9px] text-slate-700">{sub || "--"}</p></div>;

export default EdgeArmor;
