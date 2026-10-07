import DarkSelect from "../components/ui/DarkSelect";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CloudRain, LifeBuoy, Radio, RefreshCw, Satellite, ShieldQuestion, Ship, XCircle } from "lucide-react";
import api from "../services/api";
import { createSocket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";

const decisionStyle = {
    AUTO_ACCEPTED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    HUMAN_REVIEW: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    LIKELY_FALSE: "border-red-400/20 bg-red-400/10 text-red-300",
};
const scoreLabels = { geographicPlausibility: "Geographic plausibility", technicalOrigin: "Technical origin", weatherConsistency: "Weather consistency", historicalTrust: "Historical trust", multiSourceCorroboration: "Multi-source corroboration" };

const SARVerify = () => {
    const { hasPermission } = useAuth();
    const [signals, setSignals] = useState([]);
    const [registry, setRegistry] = useState([]);
    const [weather, setWeather] = useState([]);
    const [stats, setStats] = useState({});
    const [thresholds, setThresholds] = useState({});
    const [vessels, setVessels] = useState([]);
    const [vesselId, setVesselId] = useState("");
    const [selectedId, setSelectedId] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [overview, vesselResponse] = await Promise.all([api.get("/sarverify"), api.get("/vessels")]);
            const nextSignals = overview.data?.signals || [];
            const nextVessels = vesselResponse.data?.vessels || vesselResponse.data?.data || [];
            setSignals(nextSignals);
            setRegistry(overview.data?.registry || []);
            setWeather(overview.data?.weather || []);
            setStats(overview.data?.stats || {});
            setThresholds(overview.data?.thresholds || {});
            setVessels(nextVessels);
            setVesselId((current) => current || nextVessels[0]?._id || "");
            setSelectedId((current) => nextSignals.some((item) => item._id === current) ? current : nextSignals[0]?._id || "");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to load SARVerify data");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(loadData, 0);
        const socket = createSocket();
        socket.on("sarverify:signal", loadData);
        return () => { window.clearTimeout(timer); socket.disconnect(); };
    }, [loadData]);

    const execute = async (action) => {
        try {
            setBusy(true); setError(""); setMessage("");
            let response;
            if (action === "bootstrap") response = await api.post("/sarverify/bootstrap-demo");
            else response = await api.post("/sarverify/simulate", { receivingVessel: vesselId, scenario: action, claimedLocation: { latitude: 18.94, longitude: 72.84 } });
            setMessage(response.data?.message || "Operation completed");
            await loadData();
        } catch (requestError) { setError(requestError.response?.data?.message || "SARVerify operation failed"); }
        finally { setBusy(false); }
    };

    const review = async (decision) => {
        try {
            setBusy(true); setError(""); setMessage("");
            const response = await api.post(`/sarverify/signals/${selectedId}/review`, { decision, confirmedHoax: decision === "REJECT", note: decision === "ACCEPT" ? "Verified by bridge/ROC operator" : "Rejected after evidence review" });
            setMessage(response.data?.message); await loadData();
        } catch (requestError) { setError(requestError.response?.data?.message || "Review failed"); }
        finally { setBusy(false); }
    };

    const selected = useMemo(() => signals.find((item) => item._id === selectedId) || null, [signals, selectedId]);
    return <div className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10"><LifeBuoy className="h-5 w-5 text-cyan-400" /></div><div><h1 className="text-2xl font-bold text-white">SARVerify</h1><p className="mt-1 text-sm text-slate-400">Distress authenticity, trust scoring and safe navigation handoff</p></div></div>
            <button type="button" onClick={loadData} className="flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
        </div>
        {error && <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</div>}
        {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">{message}</div>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><Stat icon={Radio} label="Evaluated" value={stats.total || 0} tone="cyan" /><Stat icon={CheckCircle2} label="Accepted" value={stats.accepted || 0} tone="emerald" /><Stat icon={ShieldQuestion} label="Human Review" value={stats.pendingReview || 0} tone="amber" /><Stat icon={XCircle} label="Rejected" value={stats.rejected || 0} tone="red" /><Stat icon={Satellite} label="Avg Trust" value={`${stats.averageTrust || 0}%`} tone="purple" /></div>

        {hasPermission("sar-verify:manage") && <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.03] p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-end"><label className="flex-1"><span className="mb-2 block text-[10px] uppercase tracking-wider text-slate-500">Receiving vessel</span><DarkSelect value={vesselId} onChange={(event) => setVesselId(event.target.value)} className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300">{vessels.map((vessel) => <option key={vessel._id} value={vessel._id}>{vessel.name} ({vessel.vesselId})</option>)}</DarkSelect></label><button disabled={busy} onClick={() => execute("bootstrap")} className="rounded-lg border border-slate-700 px-3 py-2.5 text-xs text-slate-300 disabled:opacity-40">Load Offline Demo Context</button><button disabled={busy || !vesselId} onClick={() => execute("GENUINE")} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-xs text-emerald-300 disabled:opacity-40">Simulate Genuine Signal</button><button disabled={busy || !vesselId} onClick={() => execute("FAKE")} className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-xs text-red-300 disabled:opacity-40">Simulate Fake Signal</button></div><p className="mt-3 text-[10px] text-slate-600">Thresholds: auto-accept above {Math.round((thresholds.autoAccept || .75) * 100)}% · auto-reject below {Math.round((thresholds.autoReject || .4) * 100)}% · otherwise human review</p></div>}

        <div className="grid gap-4 xl:grid-cols-[.8fr_1.4fr]">
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">{!signals.length ? <div className="p-12 text-center text-sm text-slate-600">No distress signals evaluated.</div> : <div className="divide-y divide-slate-800/70">{signals.map((signal) => <button key={signal._id} onClick={() => setSelectedId(signal._id)} className={`w-full p-4 text-left ${selectedId === signal._id ? "bg-cyan-400/[0.05]" : "hover:bg-slate-900/40"}`}><div className="flex justify-between gap-3"><div><p className="text-sm font-semibold text-slate-200">{signal.distressNature.replaceAll("_", " ")}</p><p className="mt-1 text-[10px] text-slate-600">MMSI {signal.mmsi} · {signal.format}</p></div><span className={`h-fit rounded-full border px-2 py-1 text-[9px] ${decisionStyle[signal.decision]}`}>{signal.decision.replaceAll("_", " ")}</span></div><div className="mt-3 flex items-center justify-between"><div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${signal.confidence}%` }} /></div><span className="ml-3 text-xs font-semibold text-cyan-300">{signal.confidence}%</span></div></button>)}</div>}</div>

            <div>{!selected ? <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-12 text-center text-sm text-slate-600">Select a signal to inspect its evidence.</div> : <div className="space-y-4"><div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><div className="flex flex-wrap justify-between gap-3"><div><div className="flex items-center gap-2"><Radio className="h-4 w-4 text-cyan-400" /><h2 className="font-bold text-white">{selected.signalId}</h2></div><p className="mt-2 text-xs text-slate-400">{selected.explanation?.whatHappened}</p></div><div className="text-right"><p className="text-3xl font-bold text-cyan-400">{selected.confidence}%</p><p className="text-[9px] text-slate-600">COMPOSITE TRUST</p></div></div><div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4"><p className="text-xs text-slate-300">{selected.explanation?.whyItMatters}</p><p className="mt-2 text-xs text-cyan-300">{selected.explanation?.recommendedAction}</p></div>{selected.navigationDispatch?.forwarded && <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-300">Forwarded to autonomous navigation response bus.</div>}</div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><h3 className="text-sm font-semibold text-white">Five-dimension evidence</h3><div className="mt-4 space-y-3">{Object.entries(selected.scores || {}).map(([key, value]) => <div key={key} className="rounded-lg border border-slate-800 p-3"><div className="flex justify-between text-xs"><span className="text-slate-300">{scoreLabels[key]}</span><span className="font-semibold text-cyan-300">{Math.round(value.score * 100)}% <span className="text-slate-600">× {Math.round(value.weight * 100)}%</span></span></div><div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${value.score * 100}%` }} /></div><p className="mt-2 text-[10px] text-slate-500">{value.reasons?.join(" ")}</p></div>)}</div></div>
                {selected.status === "PENDING_REVIEW" && hasPermission("sar-verify:manage") && <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.03] p-5"><h3 className="text-sm font-semibold text-white">Bridge / ROC decision required</h3><div className="mt-4 flex gap-3"><button disabled={busy} onClick={() => review("ACCEPT")} className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Accept & Forward</button><button disabled={busy} onClick={() => review("REJECT")} className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs text-red-300"><XCircle className="h-4 w-4" /> Reject as Hoax</button></div></div>}
            </div>}</div>
        </div>
        <div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-center gap-2"><Ship className="h-4 w-4 text-cyan-400" /><h3 className="text-sm font-semibold text-white">Local MMSI Registry</h3></div><p className="mt-2 text-xs text-slate-500">{registry.length} cached identities · {registry.filter((item) => item.confirmedHoaxCount).length} with confirmed hoax history</p></div><div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-center gap-2"><CloudRain className="h-4 w-4 text-purple-400" /><h3 className="text-sm font-semibold text-white">Offline Weather Cache</h3></div><p className="mt-2 text-xs text-slate-500">{weather.length} cached zones available without shore connectivity</p></div></div>
    </div>;
};

const tones = { cyan: "text-cyan-400", emerald: "text-emerald-400", amber: "text-amber-400", red: "text-red-400", purple: "text-purple-400" };
const Stat = ({ icon: Icon, label, value, tone }) => <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><Icon className={`h-4 w-4 ${tones[tone]}`} /><p className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>;
export default SARVerify;
