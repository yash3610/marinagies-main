import { useCallback, useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, Radio, Satellite, Wifi, WifiOff } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const MODES = ["CONNECTED", "LIMITED", "MINIMAL", "OFFLINE"];
const modeStyle = {
    CONNECTED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    LIMITED: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    MINIMAL: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    OFFLINE: "border-red-500/30 bg-red-500/10 text-red-300",
};
const severityStyle = {
    CRITICAL: "text-red-300", HIGH: "text-orange-300", MEDIUM: "text-amber-300", LOW: "text-cyan-300",
};

const Connectivity = () => {
    const { hasPermission } = useAuth();
    const canManage = hasPermission("connectivity:manage");
    const [overview, setOverview] = useState(null);
    const [events, setEvents] = useState([]);
    const [reason, setReason] = useState("Satellite link simulation");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");

    const load = useCallback(async () => {
        try {
            const [statusResponse, queueResponse] = await Promise.all([
                api.get("/connectivity"), api.get("/connectivity/queue?limit=100"),
            ]);
            setOverview(statusResponse.data);
            setEvents(queueResponse.data.events || []);
        } catch (error) {
            setMessage(error.response?.data?.message || "Connectivity data could not be loaded");
        }
    }, []);

    useEffect(() => {
        const initialTimer = window.setTimeout(load, 0);
        const timer = window.setInterval(load, 10000);
        return () => {
            window.clearTimeout(initialTimer);
            window.clearInterval(timer);
        };
    }, [load]);

    const run = async (request) => {
        setBusy(true); setMessage("");
        try {
            const response = await request();
            setMessage(response.data.message);
            await load();
        } catch (error) {
            setMessage(error.response?.data?.message || "Action failed");
        } finally { setBusy(false); }
    };

    const state = overview?.state;
    const queue = overview?.queue || {};
    const Icon = state?.mode === "OFFLINE" ? WifiOff : state?.mode === "CONNECTED" ? Wifi : Satellite;

    return <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${modeStyle[state?.mode] || modeStyle.LIMITED}`}><Icon className="h-5 w-5" /></div><div><h1 className="text-2xl font-bold text-white">Satellite & Offline Operations</h1><p className="text-sm text-slate-400">Store-and-forward queue for low-bandwidth vessel operations</p></div></div>
            <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${modeStyle[state?.mode] || modeStyle.LIMITED}`}>{state?.mode || "LOADING"}</span>
        </div>

        {message && <div role="status" className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-xs text-cyan-200">{message}</div>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Radio} label="Pending" value={queue.pending || 0} />
            <Stat icon={RefreshCw} label="Syncing" value={queue.syncing || 0} />
            <Stat icon={CloudOff} label="Failed" value={queue.failed || 0} />
            <Stat icon={Cloud} label="Queued size" value={`${((queue.totalBytes || 0) / 1024).toFixed(1)} KB`} />
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                <div className="flex-1"><h2 className="text-sm font-semibold text-white">Connectivity simulation</h2><p className="mt-1 text-xs text-slate-500">Local detection continues in every mode. Events are retained for 7 days and synchronized Critical-first.</p><input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} className="mt-4 h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300" aria-label="Connectivity change reason" /></div>
                {canManage && <div className="flex flex-wrap gap-2">{MODES.map((mode) => <button key={mode} disabled={busy || mode === state?.mode} onClick={() => run(() => api.patch("/connectivity/mode", { mode, reason }))} className={`rounded-lg border px-3 py-2 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${modeStyle[mode]}`}>{mode}</button>)}<button disabled={busy || state?.mode === "OFFLINE"} onClick={() => run(() => api.post("/connectivity/sync", { limit: 500 }))} className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[10px] font-semibold text-cyan-300 disabled:opacity-40">SYNC NOW</button></div>}
            </div>
            <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-3"><p>Reason: <span className="text-slate-200">{state?.reason || "--"}</span></p><p>Changed: <span className="text-slate-200">{state?.changedAt ? new Date(state.changedAt).toLocaleString() : "--"}</span></p><p>Last sync: <span className="text-slate-200">{state?.lastSuccessfulSyncAt ? new Date(state.lastSuccessfulSyncAt).toLocaleString() : "Never"}</span></p></div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
            <div className="border-b border-slate-800 px-4 py-3"><h2 className="text-sm font-semibold text-white">Durable event queue</h2></div>
            <div className="grid grid-cols-[.7fr_.7fr_1fr_.6fr] border-b border-slate-800 px-4 py-3 text-[10px] uppercase text-slate-600"><span>Priority</span><span>Type</span><span>Vessel / source</span><span>Status</span></div>
            {!events.length ? <div className="p-10 text-center text-xs text-slate-600">Queue is empty. Switch offline and run telemetry simulation to store events.</div> : events.map((event) => <div key={event._id} className="grid grid-cols-[.7fr_.7fr_1fr_.6fr] items-center border-b border-slate-800/60 px-4 py-3 text-xs"><span className={severityStyle[event.severity]}>{event.severity}</span><span className="text-slate-300">{event.eventType}</span><span className="truncate text-slate-400">{event.vessel?.name || event.sourceRef || "Platform"}</span><span className="text-slate-300">{event.status}</span></div>)}
        </section>
    </div>;
};

const Stat = ({ icon: Icon, label, value }) => <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><Icon className="h-4 w-4 text-cyan-400" /><p className="mt-3 text-[10px] uppercase text-slate-600">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>;
export default Connectivity;
