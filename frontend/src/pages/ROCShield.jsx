import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, KeyRound, RadioTower, RefreshCw, Send, ShieldCheck, ShieldX, Ship, UserCheck } from "lucide-react";
import api from "../services/api";
import { createSocket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";

const factorLabels = { routeDeviation: "Mission / route deviation", operatorPattern: "Operator pattern", environmentalContext: "Environmental context", timeAnomaly: "Time anomaly", sequenceAnomaly: "Command sequence", authorityCheck: "Authority & channel" };
const decisionStyles = { AUTO_EXECUTE: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300", HOLD: "border-amber-400/20 bg-amber-400/10 text-amber-300", BLOCK: "border-red-400/20 bg-red-400/10 text-red-300" };

const ROCShield = () => {
    const { hasPermission } = useAuth();
    const [commands, setCommands] = useState([]);
    const [baselines, setBaselines] = useState([]);
    const [stats, setStats] = useState({});
    const [vessels, setVessels] = useState([]);
    const [vesselId, setVesselId] = useState("");
    const [selectedId, setSelectedId] = useState("");
    const [commandType, setCommandType] = useState("SET_SPEED");
    const [parameter, setParameter] = useState("12");
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadData = useCallback(async () => {
        try {
            setLoading(true); setError("");
            const [overview, vesselResponse] = await Promise.all([api.get("/rocshield"), api.get("/vessels")]);
            const nextCommands = overview.data?.commands || [];
            const nextVessels = vesselResponse.data?.vessels || [];
            setCommands(nextCommands); setBaselines(overview.data?.baselines || []); setStats(overview.data?.stats || {}); setMfaEnabled(Boolean(overview.data?.mfaEnabled)); setVessels(nextVessels);
            setVesselId((current) => current || nextVessels[0]?._id || "");
            setSelectedId((current) => nextCommands.some((item) => item._id === current) ? current : nextCommands[0]?._id || "");
        } catch (requestError) { setError(requestError.response?.data?.message || "Failed to load ROCShield data"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(loadData, 0);
        const socket = createSocket(); socket.on("rocshield:command", loadData);
        return () => { window.clearTimeout(timer); socket.disconnect(); };
    }, [loadData]);

    const run = async (action) => {
        try {
            setBusy(true); setError(""); setMessage("");
            let response;
            if (action === "SAFE" || action === "FAKE") response = await api.post("/rocshield/simulate", { vessel: vesselId, scenario: action });
            else {
                const parameters = commandType === "SET_SPEED" ? { speed: Number(parameter) } : commandType === "SET_HEADING" ? { heading: Number(parameter) } : commandType === "CHANGE_ROUTE" ? { destination: parameter || "Remote waypoint", heading: 220, distanceKm: 500 } : {};
                response = await api.post("/rocshield/commands/intercept", { vessel: vesselId, type: commandType, parameters, nonce: `${crypto.randomUUID()}-${Date.now()}`, issuedAt: new Date().toISOString(), channelAuthenticated: true });
            }
            setMessage(response.data?.message || "Remote command evaluated"); await loadData();
        } catch (requestError) { setError(requestError.response?.data?.message || "Remote command operation failed"); }
        finally { setBusy(false); }
    };

    const review = async (decision) => {
        try {
            setBusy(true); setError(""); setMessage("");
            const response = await api.post(`/rocshield/commands/${selectedId}/review`, { decision, mfaCode, note: `${decision} by ROC supervisor` });
            setMessage(response.data?.message); setMfaCode(""); await loadData();
        } catch (requestError) { setError(requestError.response?.data?.message || "MFA command review failed"); }
        finally { setBusy(false); }
    };

    const beginMfa = async () => {
        try { setBusy(true); setError(""); const response = await api.post("/rocshield/mfa/enroll"); setEnrollment(response.data); setMessage(response.data?.message); }
        catch (requestError) { setError(requestError.response?.data?.message || "MFA enrollment failed"); }
        finally { setBusy(false); }
    };
    const enableMfa = async () => {
        try { setBusy(true); setError(""); const response = await api.post("/rocshield/mfa/enable", { mfaCode }); setMessage(response.data?.message); setEnrollment(null); setMfaCode(""); await loadData(); }
        catch (requestError) { setError(requestError.response?.data?.message || "Invalid authenticator code"); }
        finally { setBusy(false); }
    };

    const selected = useMemo(() => commands.find((item) => item._id === selectedId) || null, [commands, selectedId]);
    const parameterLabel = commandType === "SET_SPEED" ? "Speed (knots)" : commandType === "SET_HEADING" ? "Heading (degrees)" : commandType === "CHANGE_ROUTE" ? "Destination" : null;
    return <div className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10"><RadioTower className="h-5 w-5 text-purple-400" /></div><div><h1 className="text-2xl font-bold text-white">ROCShield</h1><p className="mt-1 text-sm text-slate-400">Inline remote-command integrity, approval and execution control</p></div></div><button onClick={loadData} className="flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</button></div>
        {error && <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</div>}{message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">{message}</div>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><Stat icon={RadioTower} label="Intercepted" value={stats.total || 0} tone="purple" /><Stat icon={CheckCircle2} label="Executed" value={stats.executed || 0} tone="emerald" /><Stat icon={Clock3} label="Pending" value={stats.pending || 0} tone="amber" /><Stat icon={ShieldX} label="Blocked" value={stats.blocked || 0} tone="red" /><Stat icon={ShieldCheck} label="Avg Risk" value={`${stats.averageRisk || 0}%`} tone="cyan" /></div>

        {hasPermission("commands:send") && <div className="rounded-xl border border-purple-400/15 bg-purple-400/[0.03] p-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><label><span className="mb-2 block text-[10px] uppercase text-slate-500">Vessel</span><select value={vesselId} onChange={(event) => setVesselId(event.target.value)} className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300">{vessels.map((vessel) => <option key={vessel._id} value={vessel._id}>{vessel.name}</option>)}</select></label><label><span className="mb-2 block text-[10px] uppercase text-slate-500">Command</span><select value={commandType} onChange={(event) => setCommandType(event.target.value)} className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300"><option>SET_SPEED</option><option>SET_HEADING</option><option>CHANGE_ROUTE</option><option>STOP_ENGINE</option><option>EMERGENCY_STOP</option><option>RETURN_TO_PORT</option><option>ENTER_SAFE_MODE</option></select></label>{parameterLabel ? <label><span className="mb-2 block text-[10px] uppercase text-slate-500">{parameterLabel}</span><input value={parameter} onChange={(event) => setParameter(event.target.value)} className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300" /></label> : <div />}<button disabled={busy || !vesselId} onClick={() => run("SEND")} className="mt-auto flex h-10 items-center justify-center gap-2 rounded-lg border border-purple-400/20 bg-purple-400/10 px-4 text-xs text-purple-300 disabled:opacity-40"><Send className="h-4 w-4" /> Intercept Command</button></div><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy || !vesselId} onClick={() => run("SAFE")} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300">Simulate Safe Command</button><button disabled={busy || !vesselId} onClick={() => run("FAKE")} className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">Simulate Fake Command</button></div></div>}

        <div className="grid gap-4 xl:grid-cols-[.8fr_1.4fr]"><div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">{!commands.length ? <div className="p-12 text-center text-sm text-slate-600">No remote commands intercepted.</div> : <div className="divide-y divide-slate-800/70">{commands.map((command) => <button key={command._id} onClick={() => setSelectedId(command._id)} className={`w-full p-4 text-left ${selectedId === command._id ? "bg-purple-400/[0.05]" : "hover:bg-slate-900/40"}`}><div className="flex justify-between gap-3"><div><p className="text-sm font-semibold text-slate-200">{command.type.replaceAll("_", " ")}</p><p className="mt-1 text-[10px] text-slate-600">{command.vessel?.name} · {command.operator?.name}</p></div><span className={`h-fit rounded-full border px-2 py-1 text-[9px] ${decisionStyles[command.decision]}`}>{command.decision.replaceAll("_", " ")}</span></div><div className="mt-3 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-800"><div className={`h-full ${command.riskPercent >= 70 ? "bg-red-400" : command.riskPercent > 30 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${command.riskPercent}%` }} /></div><span className="text-xs text-slate-300">{command.riskPercent}%</span></div></button>)}</div>}</div>
            <div>{!selected ? <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-12 text-center text-sm text-slate-600">Select a command to inspect.</div> : <div className="space-y-4"><div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><div className="flex justify-between gap-3"><div><div className="flex items-center gap-2"><Ship className="h-4 w-4 text-purple-400" /><h2 className="font-bold text-white">{selected.commandId}</h2></div><p className="mt-2 text-xs text-slate-400">{selected.explanation?.whatHappened}</p></div><div className="text-right"><p className="text-3xl font-bold text-purple-300">{selected.riskPercent}%</p><p className="text-[9px] text-slate-600">COMMAND RISK</p></div></div><div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4"><p className="text-xs text-slate-300">{selected.explanation?.whyItMatters}</p><p className="mt-2 text-xs text-purple-300">{selected.explanation?.recommendedAction}</p></div>{selected.outcome && <p className="mt-3 text-xs text-emerald-300">Outcome: {selected.outcome}</p>}</div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><h3 className="text-sm font-semibold text-white">Six-dimension integrity evidence</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{Object.entries(selected.riskFactors || {}).map(([key, value]) => <div key={key} className="rounded-lg border border-slate-800 p-3"><div className="flex justify-between text-xs"><span className="text-slate-300">{factorLabels[key]}</span><span className="text-purple-300">{Math.round(value.score * 100)}%</span></div><div className="mt-2 h-1.5 rounded bg-slate-800"><div className="h-full rounded bg-purple-400" style={{ width: `${value.score * 100}%` }} /></div><p className="mt-2 text-[10px] text-slate-500">{value.reasons?.join(" ")}</p></div>)}</div></div>
                {["PENDING_APPROVAL", "BLOCKED"].includes(selected.status) && hasPermission("commands:approve") && <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.03] p-5"><div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-amber-400" /><h3 className="text-sm font-semibold text-white">MFA-protected supervisor decision</h3></div>{!mfaEnabled && !enrollment && <button onClick={beginMfa} disabled={busy} className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-300">Set up Authenticator MFA</button>}{enrollment && <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-400">Add this setup key to Google/Microsoft Authenticator:</p><code className="mt-2 block break-all text-sm text-cyan-300">{enrollment.secret}</code></div>}<div className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit authenticator code" className="h-10 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300" />{enrollment ? <button disabled={busy || mfaCode.length !== 6} onClick={enableMfa} className="rounded-lg bg-cyan-500/15 px-4 text-xs text-cyan-300">Verify & Enable</button> : selected.status === "PENDING_APPROVAL" ? <><button disabled={busy || mfaCode.length !== 6} onClick={() => review("APPROVE")} className="rounded-lg bg-emerald-500/15 px-4 text-xs text-emerald-300">Approve</button><button disabled={busy || mfaCode.length !== 6} onClick={() => review("REJECT")} className="rounded-lg bg-red-500/15 px-4 text-xs text-red-300">Reject</button></> : <button disabled={busy || mfaCode.length !== 6} onClick={() => review("ACKNOWLEDGE")} className="rounded-lg bg-amber-500/15 px-4 text-xs text-amber-300">Acknowledge Block</button>}</div></div>}
            </div>}</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-cyan-400" /><h3 className="text-sm font-semibold text-white">Operator Behavioral Baselines</h3></div><p className="mt-2 text-xs text-slate-500">{baselines.length} local operator profile(s) · command types, timing and average risk are learned without shore connectivity.</p></div>
    </div>;
};
const tones = { purple: "text-purple-400", emerald: "text-emerald-400", amber: "text-amber-400", red: "text-red-400", cyan: "text-cyan-400" };
const Stat = ({ icon: Icon, label, value, tone }) => <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><Icon className={`h-4 w-4 ${tones[tone]}`} /><p className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>;
export default ROCShield;
