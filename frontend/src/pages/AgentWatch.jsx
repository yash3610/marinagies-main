import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, FastForward, RefreshCw, Search, ShieldAlert, ShieldOff, XCircle } from "lucide-react";
import api from "../services/api";
import { createSocket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";

const stageStyles = {
    RECON: "border-cyan-400/20 bg-cyan-400/10 text-cyan-400",
    CREDENTIAL_ATTACK: "border-amber-400/20 bg-amber-400/10 text-amber-400",
    LATERAL_MOVEMENT: "border-orange-400/20 bg-orange-400/10 text-orange-400",
    EXFILTRATION: "border-red-400/20 bg-red-400/10 text-red-400",
};

const AgentWatch = () => {
    const { hasPermission } = useAuth();
    const [sequences, setSequences] = useState([]);
    const [events, setEvents] = useState([]);
    const [patterns, setPatterns] = useState([]);
    const [stats, setStats] = useState({ sequences: 0, highConfidence: 0, isolatedSources: 0, confirmedPatterns: 0 });
    const [vessels, setVessels] = useState([]);
    const [vessel, setVessel] = useState("");
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [watchResponse, vesselResponse] = await Promise.all([api.get("/agentwatch"), api.get("/vessels")]);
            setSequences(watchResponse.data?.sequences || []);
            setEvents(watchResponse.data?.events || []);
            setPatterns(watchResponse.data?.patterns || []);
            setStats(watchResponse.data?.stats || {});
            const available = vesselResponse.data?.vessels || [];
            setVessels(available);
            setVessel((current) => current || available[0]?._id || "");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to load AgentWatch data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(loadData, 0);
        const socket = createSocket();
        socket.on("agentwatch:event", (event) => setEvents((current) => [event, ...current].slice(0, 300)));
        socket.on("agentwatch:sequence", () => loadData());
        return () => {
            window.clearTimeout(timer);
            socket.disconnect();
        };
    }, [loadData]);

    const execute = async (action, sequence = null) => {
        try {
            setBusy(true);
            setError("");
            setMessage("");
            let response;
            if (action === "simulate") {
                response = await api.post("/agentwatch/simulate", { vessel });
            } else if (action === "release") {
                response = await api.post(`/agentwatch/sequences/${sequence._id}/release`);
            } else {
                response = await api.post(`/agentwatch/sequences/${sequence._id}/review`, {
                    decision: action,
                    note: action === "CONFIRMED" ? "Analyst confirmed the machine-speed attack progression" : "Analyst confirmed benign automated maintenance activity",
                });
            }
            setMessage(response.data?.message || "AgentWatch action completed");
            setSelected(null);
            await loadData();
        } catch (requestError) {
            setError(requestError.response?.data?.message || "AgentWatch action failed");
        } finally {
            setBusy(false);
        }
    };

    const visibleSequences = useMemo(() => {
        const query = search.toLowerCase();
        return sequences.filter((sequence) => !query || [sequence.sequenceId, sequence.sourceIp, sequence.sourceDevice, sequence.vessel?.name, sequence.reviewStatus]
            .some((value) => String(value || "").toLowerCase().includes(query)));
    }, [sequences, search]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10"><Bot className="h-5 w-5 text-purple-400" /></div><div><h1 className="text-2xl font-bold text-white">AgentWatch</h1><p className="mt-1 text-sm text-slate-400">Machine-speed attack sequence detection and source isolation</p></div></div>
                <button type="button" onClick={loadData} className="flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
            </div>
            {error && <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">{message}</div>}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat icon={FastForward} label="Sequences" value={stats.sequences || 0} tone="purple" />
                <Stat icon={ShieldAlert} label="High Confidence" value={stats.highConfidence || 0} tone="red" />
                <Stat icon={ShieldOff} label="Isolated Sources" value={stats.isolatedSources || 0} tone="orange" />
                <Stat icon={CheckCircle2} label="Fleet Patterns" value={stats.confirmedPatterns || 0} tone="emerald" />
            </div>

            {hasPermission("network:manage") && (
                <div className="rounded-xl border border-purple-400/15 bg-purple-400/[0.03] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                        <label className="flex-1"><span className="mb-2 block text-[9px] uppercase tracking-wider text-slate-600">Demo vessel</span><select value={vessel} onChange={(event) => setVessel(event.target.value)} className="netguard-input"><option value="">Select vessel</option>{vessels.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
                        <button type="button" disabled={busy || !vessel} onClick={() => execute("simulate")} className="h-10 rounded-lg border border-purple-400/20 bg-purple-400/10 px-5 text-xs font-semibold text-purple-300 disabled:opacity-40">Simulate Machine-Speed Attack</button>
                    </div>
                    <p className="mt-3 text-[10px] text-slate-600">Generates Recon → Credential Attack → Lateral Movement → Exfiltration events at 500 ms intervals using a TEST-NET source IP.</p>
                </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[1.35fr_.85fr]">
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                    <div className="flex items-center justify-between border-b border-slate-800 p-4"><div><h2 className="text-sm font-semibold text-white">Detected Sequences</h2><p className="mt-1 text-[10px] text-slate-600">Timing, stage progression and MITRE correlation</p></div><div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sequences" className="h-9 w-44 rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-xs text-slate-300" /></div></div>
                    {!visibleSequences.length ? <div className="p-12 text-center text-sm text-slate-600">No autonomous attack sequence detected.</div> : <div className="divide-y divide-slate-800/70">{visibleSequences.map((sequence) => <SequenceRow key={sequence._id} sequence={sequence} onSelect={() => setSelected(sequence)} />)}</div>}
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><h2 className="text-sm font-semibold text-white">Live Event Stream</h2><p className="mt-1 text-[10px] text-slate-600">Latest classified security events</p><div className="mt-4 max-h-80 space-y-2 overflow-y-auto">{events.slice(0, 20).map((event) => <div key={event._id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"><div className="flex items-center justify-between gap-2"><span className={`rounded border px-2 py-1 text-[9px] ${stageStyles[event.stage]}`}>{event.stage.replaceAll("_", " ")}</span><span className="text-[9px] text-slate-700">{new Date(event.timestamp).toLocaleTimeString()}</span></div><p className="mt-2 text-xs text-slate-300">{event.eventKind.replaceAll("_", " ")}</p><p className="mt-1 text-[9px] text-slate-600">{event.sourceIp} → {event.target || "unknown target"}</p></div>)}</div></div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><h2 className="text-sm font-semibold text-white">Confirmed Fleet Learning Patterns</h2><p className="mt-1 text-[10px] text-slate-600">{patterns.length} confirmed signature(s)</p><div className="mt-3 space-y-2">{patterns.slice(0, 6).map((pattern) => <div key={pattern._id} className="rounded-lg border border-slate-800 p-3 text-[10px] text-slate-400"><p>{pattern.stageSequence.join(" → ")}</p><p className="mt-1 text-slate-700">{pattern.confidence}% · {pattern.occurrences} occurrence(s)</p></div>)}</div></div>
                </div>
            </div>

            {selected && <SequenceModal sequence={selected} canManage={hasPermission("network:manage")} busy={busy} onClose={() => setSelected(null)} onAction={(action) => execute(action, selected)} />}
        </div>
    );
};

const toneClasses = { purple: "text-purple-400", red: "text-red-400", orange: "text-orange-400", emerald: "text-emerald-400" };
const Stat = ({ icon: Icon, label, value, tone }) => <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><Icon className={`h-4 w-4 ${toneClasses[tone]}`} /><p className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>;

const SequenceRow = ({ sequence, onSelect }) => <button type="button" onClick={onSelect} className="w-full p-4 text-left transition hover:bg-slate-900/40"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-200">{sequence.sequenceId}</p><span className="rounded border border-red-400/20 bg-red-400/10 px-2 py-1 text-[9px] text-red-400">{sequence.confidence}% {sequence.confidenceLevel}</span>{sequence.isolated && <span className="rounded border border-orange-400/20 bg-orange-400/10 px-2 py-1 text-[9px] text-orange-400">ISOLATED</span>}<span className="text-[9px] text-slate-600">{sequence.reviewStatus}</span></div><p className="mt-2 text-xs text-slate-400">{sequence.vessel?.name} · Source {sequence.sourceIp} · {(sequence.durationMs / 1000).toFixed(1)}s total</p></div><div className="flex flex-wrap gap-1.5">{sequence.stages.map((stage) => <span key={stage} className={`rounded border px-2 py-1 text-[8px] ${stageStyles[stage]}`}>{stage.replaceAll("_", " ")}</span>)}</div></div></button>;

const SequenceModal = ({ sequence, canManage, busy, onClose, onAction }) => (
    <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 z-[2000] flex items-end justify-center overflow-y-auto bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div role="dialog" aria-modal="true" aria-label="Attack sequence analysis" className="max-h-[96dvh] w-full max-w-4xl overflow-y-auto rounded-t-2xl border border-white/[0.08] bg-[#08111f] shadow-[0_28px_100px_rgba(0,0,0,.72)] sm:max-h-[92dvh] sm:rounded-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/[0.07] bg-[#08111f]/95 p-5 backdrop-blur-xl"><div><h2 className="text-lg font-bold text-white">Attack Sequence Analysis</h2><p className="mt-1 text-xs text-slate-600">{sequence.sequenceId} · {sequence.sourceIp}</p></div><button type="button" aria-label="Close attack analysis" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"><XCircle className="h-5 w-5" /></button></div><div className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-4"><Detail label="Confidence" value={`${sequence.confidence}% ${sequence.confidenceLevel}`} /><Detail label="Duration" value={`${(sequence.durationMs / 1000).toFixed(1)} seconds`} /><Detail label="Median interval" value={`${(sequence.medianIntervalMs / 1000).toFixed(2)} seconds`} /><Detail label="Review" value={sequence.reviewStatus} /></div>
        <div className="rounded-xl border border-purple-400/10 bg-purple-400/[0.03] p-4"><p className="text-[10px] uppercase tracking-wider text-purple-400">Explain Why</p><p className="mt-3 text-sm text-slate-300">{sequence.explanation.whatHappened}</p><p className="mt-2 text-xs leading-5 text-slate-500">{sequence.explanation.whatCausedIt}</p><p className="mt-2 text-xs leading-5 text-orange-300">{sequence.explanation.recommendedAction}</p></div>
        <div><p className="mb-3 text-xs font-semibold text-white">Attack Timeline</p><div className="space-y-2">{sequence.events.map((event, index) => <div key={event._id} className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3"><div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-400/10 text-[9px] text-purple-400">{index + 1}</div><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs text-slate-200">{event.eventKind.replaceAll("_", " ")}</p><span className={`rounded border px-2 py-0.5 text-[8px] ${stageStyles[event.stage]}`}>{event.stage.replaceAll("_", " ")}</span></div><p className="mt-1 text-[9px] text-slate-600">{new Date(event.timestamp).toLocaleTimeString()} · {event.target}</p></div></div>)}</div></div>
        <div><p className="mb-3 text-xs font-semibold text-white">MITRE ATT&amp;CK Correlation</p><div className="grid gap-2 md:grid-cols-2">{sequence.mitreTechniques.map((item) => <div key={item.techniqueId} className="rounded-lg border border-slate-800 p-3"><p className="text-xs font-semibold text-cyan-400">{item.techniqueId}</p><p className="mt-1 text-[10px] text-slate-400">{item.name}</p></div>)}</div></div>
    </div>{canManage && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-800 p-5">{sequence.isolated && <button type="button" disabled={busy} onClick={() => onAction("release")} className="rounded-lg border border-orange-400/20 px-4 py-2 text-xs text-orange-300">Release Source</button>}{sequence.reviewStatus === "PENDING" && <><button type="button" disabled={busy} onClick={() => onAction("FALSE_POSITIVE")} className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300">False Positive</button><button type="button" disabled={busy} onClick={() => onAction("CONFIRMED")} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300">Confirm &amp; Share Pattern</button></>}</div>}</div></div>
);

const Detail = ({ label, value }) => <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"><p className="text-[9px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-xs text-slate-300">{value}</p></div>;
export default AgentWatch;
