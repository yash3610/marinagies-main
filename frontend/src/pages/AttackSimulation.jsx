import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, CircleStop, LifeBuoy, Navigation, Play, Radio, RotateCcw, ShieldAlert, Siren } from "lucide-react";
import api from "../services/api";
import { createSocket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";

const AttackSimulation = () => {
    const { hasPermission } = useAuth();
    const canManage = hasPermission("attack-simulation:manage");
    const [vessels, setVessels] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedVesselId, setSelectedVesselId] = useState("");
    const [telemetry, setTelemetry] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const selectedVessel = useMemo(
        () => vessels.find((item) => String(item._id) === String(selectedVesselId)),
        [vessels, selectedVesselId]
    );
    const session = useMemo(
        () => sessions.find((item) => String(item.vessel?._id || item.vessel) === String(selectedVesselId)) || null,
        [sessions, selectedVesselId]
    );

    const mergeSession = useCallback((next) => {
        if (!next) return;
        const vesselId = String(next.vessel?._id || next.vessel);
        setSessions((current) => {
            const without = current.filter((item) => String(item.vessel?._id || item.vessel) !== vesselId);
            return [next, ...without];
        });
    }, []);

    useEffect(() => {
        Promise.all([api.get("/vessels"), api.get("/attack-simulation")])
            .then(([vesselResponse, sessionResponse]) => {
                const nextVessels = vesselResponse.data?.vessels || [];
                setVessels(nextVessels);
                setSessions(sessionResponse.data?.sessions || []);
                setSelectedVesselId((current) => current || nextVessels[0]?._id || "");
            })
            .catch((requestError) => setError(requestError.response?.data?.message || "Failed to load simulation data"));
    }, []);

    useEffect(() => {
        if (!selectedVesselId) return;
        api.get(`/telemetry/vessel/${selectedVesselId}`)
            .then((response) => setTelemetry(response.data?.data?.telemetry || null))
            .catch(() => setTelemetry(null));
    }, [selectedVesselId]);

    useEffect(() => {
        const socket = createSocket();
        socket.on("simulation:update", mergeSession);
        socket.on("telemetry:update", (payload) => {
            const record = payload?.data?.find((item) =>
                String(item.vessel?._id || item.vessel || item.telemetry?.vessel) === String(selectedVesselId)
            );
            if (record) setTelemetry(record.telemetry || record);
        });
        return () => socket.disconnect();
    }, [mergeSession, selectedVesselId]);

    const runAction = async (path, body = {}) => {
        setBusy(true);
        setError("");
        setMessage("");
        try {
            const response = await api.post(path, { vessel: selectedVesselId, ...body });
            mergeSession(response.data?.session);
            setMessage(response.data?.message || "Simulation updated");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Simulation action failed");
        } finally {
            setBusy(false);
        }
    };

    const formatCoordinate = (value) => Number.isFinite(Number(value)) ? Number(value).toFixed(5) : "--";
    const isRunning = session?.status === "RUNNING";
    const attackActive = Boolean(session?.attack?.active);
    const hardware = session?.hardware || { greenLed: true, redLed: false, buzzer: false };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
                            <ShieldAlert className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Attack Simulation</h1>
                            <p className="text-sm text-slate-400">Controlled voyage, GPS spoofing and fake-distress demonstrations</p>
                        </div>
                    </div>
                </div>
                <select
                    value={selectedVesselId}
                    onChange={(event) => setSelectedVesselId(event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                >
                    {vessels.map((vessel) => <option key={vessel._id} value={vessel._id}>{vessel.name} ({vessel.vesselId})</option>)}
                </select>
            </div>

            {(message || error) && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}>
                    {error || message}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500">Selected vessel</p>
                            <h2 className="mt-1 text-lg font-semibold text-white">{selectedVessel?.name || "No vessel"}</h2>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isRunning ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                            {session?.status || "IDLE"}
                        </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <Metric label="GPS position" value={`${formatCoordinate(telemetry?.latitude)}, ${formatCoordinate(telemetry?.longitude)}`} />
                        <Metric label="Independent AIS" value={`${formatCoordinate(telemetry?.navigationReference?.aisLatitude)}, ${formatCoordinate(telemetry?.navigationReference?.aisLongitude)}`} />
                        <Metric label="Speed" value={`${Number(telemetry?.speed || session?.actual?.speed || 0).toFixed(1)} kn`} />
                        <Metric label="Gyro heading" value={`${Number(telemetry?.navigationReference?.gyroHeading || session?.actual?.heading || 0).toFixed(1)}°`} />
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white"><Navigation className="h-4 w-4 text-cyan-400" /> Planned route</div>
                        <p className="mt-3 text-sm text-slate-300">
                            {session?.route?.origin?.name || selectedVessel?.route?.origin || "Current position"}
                            <span className="mx-3 text-cyan-400">→</span>
                            {session?.route?.destination?.name || selectedVessel?.route?.destination || selectedVessel?.destination || "Dubai"}
                        </p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                        <ActionButton icon={Play} label="Start Voyage" color="cyan" disabled={!canManage || busy || isRunning} onClick={() => runAction("/attack-simulation/voyage/start")} />
                        <ActionButton icon={Siren} label="Inject GPS Spoofing" color="red" disabled={!canManage || busy || !isRunning || attackActive} onClick={() => runAction("/attack-simulation/gps-spoofing", { distanceMeters: 650, direction: "NORTH" })} />
                        <ActionButton icon={LifeBuoy} label="Inject Fake Distress" color="red" disabled={!canManage || busy} onClick={() => runAction("/attack-simulation/fake-distress")} />
                        <ActionButton icon={Radio} label="Inject Fake Command" color="red" disabled={!canManage || busy} onClick={() => runAction("/attack-simulation/fake-command")} />
                        <ActionButton icon={RotateCcw} label="Restore Signals" color="amber" disabled={!canManage || busy || !session} onClick={() => runAction("/attack-simulation/reset")} />
                        <ActionButton icon={CircleStop} label="Stop Voyage" color="slate" disabled={!canManage || busy || !isRunning} onClick={() => runAction("/attack-simulation/voyage/stop")} />
                    </div>
                    {!canManage && <p className="mt-3 text-xs text-amber-300">Your role has read-only access to simulations.</p>}
                </section>

                <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                    <div className="flex items-center gap-2"><Radio className="h-4 w-4 text-cyan-400" /><h2 className="font-semibold text-white">Simulated onboard panel</h2></div>
                    <p className="mt-1 text-xs text-slate-500">Replaced by ESP32 LEDs and buzzer when hardware is connected</p>
                    <div className="mt-6 flex justify-center gap-8">
                        <Indicator label="GREEN" active={hardware.greenLed} color="emerald" />
                        <Indicator label="RED" active={hardware.redLed} color="red" />
                    </div>
                    <div className={`mt-6 rounded-xl border p-4 text-center ${hardware.buzzer ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-slate-800 bg-slate-900/50 text-slate-500"}`}>
                        <Activity className={`mx-auto h-6 w-6 ${hardware.buzzer ? "animate-pulse" : ""}`} />
                        <p className="mt-2 text-xs font-bold tracking-widest">BUZZER {hardware.buzzer ? "ON" : "OFF"}</p>
                    </div>
                    <div className="mt-5 border-t border-slate-800 pt-4 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Attack</span><span className={attackActive ? "text-red-400" : "text-emerald-400"}>{attackActive ? "GPS SPOOFING" : "NONE"}</span></div>
                        <div className="mt-3 flex justify-between"><span className="text-slate-500">MPU6050 motion</span><span className="text-cyan-300">{telemetry?.motion?.motionDetected ? "DETECTED" : "STATIONARY"}</span></div>
                    </div>
                </section>
            </div>
        </div>
    );
};

const Metric = ({ label, value }) => <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold text-white">{value}</p></div>;

const ActionButton = ({ icon: Icon, label, color, ...props }) => {
    const styles = { cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300", red: "border-red-500/30 bg-red-500/10 text-red-300", amber: "border-amber-500/30 bg-amber-500/10 text-amber-300", slate: "border-slate-700 bg-slate-800/70 text-slate-300" };
    return <button {...props} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-xs font-semibold transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 ${styles[color]}`}><Icon className="h-4 w-4" />{label}</button>;
};

const Indicator = ({ label, active, color }) => {
    const styles = color === "red" ? "bg-red-500 shadow-[0_0_24px_#ef4444]" : "bg-emerald-500 shadow-[0_0_24px_#10b981]";
    return <div className="text-center"><div className={`mx-auto h-14 w-14 rounded-full border-4 border-slate-800 ${active ? styles : "bg-slate-800"}`} /><p className="mt-3 text-xs font-bold text-slate-400">{label} LED</p></div>;
};

export default AttackSimulation;
