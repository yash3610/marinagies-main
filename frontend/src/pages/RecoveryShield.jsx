import DarkSelect from "../components/ui/DarkSelect";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CloudUpload, DatabaseBackup, Download, FileWarning, HardDrive, Play, RefreshCw, RotateCcw, ShieldCheck, Siren } from "lucide-react";
import api from "../services/api";
import { createSocket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";

const statusStyles = { DETECTED: "text-red-300 bg-red-400/10 border-red-400/20", CONTAINED: "text-orange-300 bg-orange-400/10 border-orange-400/20", RESTORE_PENDING: "text-amber-300 bg-amber-400/10 border-amber-400/20", RESTORING: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20", RECOVERED: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20", FAILED: "text-red-300 bg-red-400/10 border-red-400/20" };

const RecoveryShield = () => {
    const { hasPermission } = useAuth();
    const [snapshots, setSnapshots] = useState([]);
    const [events, setEvents] = useState([]);
    const [cases, setCases] = useState([]);
    const [stats, setStats] = useState({});
    const [vessels, setVessels] = useState([]);
    const [vesselId, setVesselId] = useState("");
    const [selectedCaseId, setSelectedCaseId] = useState("");
    const [snapshotId, setSnapshotId] = useState("");
    const [manualSnapshotId, setManualSnapshotId] = useState("");
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadData = useCallback(async () => {
        try {
            setLoading(true); setError("");
            const [overview, vesselResponse] = await Promise.all([api.get("/recoveryshield"), api.get("/vessels")]);
            const nextCases = overview.data?.cases || []; const nextSnapshots = overview.data?.snapshots || []; const nextVessels = vesselResponse.data?.vessels || [];
            setCases(nextCases); setSnapshots(nextSnapshots); setEvents(overview.data?.events || []); setStats(overview.data?.stats || {}); setVessels(nextVessels);
            setVesselId((current) => current || nextVessels[0]?._id || "");
            setSelectedCaseId((current) => nextCases.some((item) => item._id === current) ? current : nextCases[0]?._id || "");
        } catch (requestError) { setError(requestError.response?.data?.message || "Failed to load RecoveryShield data"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(loadData, 0); const socket = createSocket();
        socket.on("recovery:case", loadData); socket.on("recovery:activity", loadData);
        return () => { window.clearTimeout(timer); socket.disconnect(); };
    }, [loadData]);

    const execute = async (action) => {
        try {
            setBusy(true); setError(""); setMessage(""); let response;
            if (["FULL", "INCREMENTAL"].includes(action)) response = await api.post("/recoveryshield/snapshots", { vessel: vesselId, kind: action, changedItemCount: action === "INCREMENTAL" ? 3 : 0 });
            else if (action === "SIMULATE") response = await api.post("/recoveryshield/simulate", { vessel: vesselId });
            else if (action === "MANUAL") response = await api.post("/recoveryshield/cases/start", { vessel: vesselId, snapshot: manualSnapshotId, reason: "Manual recovery initiated after delayed ransomware detection" });
            else if (action === "VERIFY") response = await api.post(`/recoveryshield/snapshots/${snapshotId}/verify`);
            else if (action === "PREVIEW") { response = await api.post(`/recoveryshield/cases/${selectedCaseId}/preview`, { snapshot: snapshotId }); setPreview(response.data?.preview || null); }
            else if (action === "RESTORE") response = await api.post(`/recoveryshield/cases/${selectedCaseId}/restore`, { snapshot: snapshotId });
            else if (action === "SYNC") response = await api.post(`/recoveryshield/cases/${selectedCaseId}/shore-sync`);
            setMessage(response.data?.message || "RecoveryShield operation completed"); await loadData();
        } catch (requestError) { setError(requestError.response?.data?.message || "RecoveryShield operation failed"); }
        finally { setBusy(false); }
    };

    const downloadReport = async () => {
        if (!selectedCase?.incident?._id) return;
        try {
            setBusy(true); const response = await api.get(`/incidents/${selectedCase.incident._id}/report.pdf`, { responseType: "blob" }); const url = URL.createObjectURL(response.data); const link = document.createElement("a"); link.href = url; link.download = `MarineAegis-${selectedCase.incident.incidentId}-recovery-report.pdf`; link.click(); URL.revokeObjectURL(url);
        } catch (requestError) { setError(requestError.response?.data?.message || "Failed to download recovery report"); }
        finally { setBusy(false); }
    };

    const selectedCase = cases.find((item) => item._id === selectedCaseId) || null;
    const caseVesselId = String(selectedCase?.vessel?._id || selectedCase?.vessel || vesselId);
    const availableSnapshots = snapshots.filter((item) => String(item.vessel?._id || item.vessel) === caseVesselId);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            const candidates = snapshots.filter((item) => String(item.vessel?._id || item.vessel) === caseVesselId);
            setSnapshotId((current) => candidates.some((item) => item._id === current) ? current : candidates[0]?._id || "");
            setPreview(null);
        }, 0);
        return () => window.clearTimeout(timer);
    }, [selectedCaseId, caseVesselId, snapshots]);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            const candidates = snapshots.filter((item) => String(item.vessel?._id || item.vessel) === vesselId);
            setManualSnapshotId((current) => candidates.some((item) => item._id === current) ? current : candidates[0]?._id || "");
        }, 0);
        return () => window.clearTimeout(timer);
    }, [vesselId, snapshots]);

    return <div className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10"><DatabaseBackup className="h-5 w-5 text-emerald-400" /></div><div><h1 className="text-2xl font-bold text-white">RecoveryShield</h1><p className="mt-1 text-sm text-slate-400">Encrypted snapshots, ransomware containment and verified rollback</p></div></div><button onClick={loadData} className="flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</button></div>
        {error && <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</div>}{message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">{message}</div>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><Stat icon={HardDrive} label="Snapshots" value={stats.snapshots || 0} tone="cyan" /><Stat icon={DatabaseBackup} label="Full Snapshots" value={stats.fullSnapshots || 0} tone="purple" /><Stat icon={Siren} label="Active Cases" value={stats.activeCases || 0} tone="red" /><Stat icon={ShieldCheck} label="Contained" value={stats.contained || 0} tone="amber" /><Stat icon={CheckCircle2} label="Recovered" value={stats.recovered || 0} tone="emerald" /></div>

        {hasPermission("recovery:execute") && <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.03] p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-end"><label className="flex-1"><span className="mb-2 block text-[10px] uppercase text-slate-500">Vessel</span><DarkSelect value={vesselId} onChange={(event) => setVesselId(event.target.value)} className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300">{vessels.map((vessel) => <option key={vessel._id} value={vessel._id}>{vessel.name} ({vessel.vesselId})</option>)}</DarkSelect></label><button disabled={busy || !vesselId} onClick={() => execute("INCREMENTAL")} className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2.5 text-xs text-cyan-300">Create Incremental</button><button disabled={busy || !vesselId} onClick={() => execute("FULL")} className="rounded-lg border border-purple-400/20 bg-purple-400/10 px-3 py-2.5 text-xs text-purple-300">Create Full Snapshot</button><button disabled={busy || !vesselId} onClick={() => execute("SIMULATE")} className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-xs text-red-300"><span className="flex items-center gap-2"><Play className="h-3.5 w-3.5" /> Simulate Ransomware</span></button></div><p className="mt-3 text-[10px] text-slate-600">Scheduler creates incremental snapshots every 15 minutes and full snapshots every 6 hours while the backend is running.</p></div>}

        <div className="grid gap-4 xl:grid-cols-[.8fr_1.4fr]"><div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70"><div className="border-b border-slate-800 p-4"><h2 className="text-sm font-semibold text-white">Recovery Cases</h2></div>{!cases.length ? <div className="p-12 text-center text-sm text-slate-600">No ransomware recovery cases.</div> : <div className="divide-y divide-slate-800/70">{cases.map((item) => <button key={item._id} onClick={() => setSelectedCaseId(item._id)} className={`w-full p-4 text-left ${selectedCaseId === item._id ? "bg-emerald-400/[0.05]" : "hover:bg-slate-900/40"}`}><div className="flex justify-between gap-3"><div><p className="text-sm font-semibold text-slate-200">{item.caseId}</p><p className="mt-1 text-[10px] text-slate-600">{item.vessel?.name} · {item.affectedDeviceIds?.join(", ") || "Manual recovery"}</p></div><span className={`h-fit rounded-full border px-2 py-1 text-[9px] ${statusStyles[item.status]}`}>{item.status.replaceAll("_", " ")}</span></div><p className="mt-3 text-[10px] text-slate-500">Sync {item.fileSynchronizationEnabled ? "enabled" : "disabled"} · Backup comm {item.emergencyCommunicationActive ? "active" : "inactive"}</p></button>)}</div>}</div>
            <div>{!selectedCase ? <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-12 text-center text-sm text-slate-600">Simulate an incident or select a recovery case.</div> : <div className="space-y-4"><div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><div className="flex flex-wrap justify-between gap-3"><div><div className="flex items-center gap-2"><FileWarning className="h-4 w-4 text-red-400" /><h2 className="font-bold text-white">{selectedCase.caseId}</h2></div><p className="mt-2 text-xs text-slate-400">{selectedCase.vessel?.name} · {selectedCase.incident?.incidentId || "Independent recovery"}</p></div><span className={`h-fit rounded-full border px-2 py-1 text-[10px] ${statusStyles[selectedCase.status]}`}>{selectedCase.status}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Detail label="File synchronization" value={selectedCase.fileSynchronizationEnabled ? "ENABLED" : "DISABLED"} /><Detail label="Backup communication" value={selectedCase.emergencyCommunicationActive ? "ACTIVE" : "STANDBY"} /><Detail label="Shore evidence" value={selectedCase.shoreSyncStatus} /></div>{selectedCase.integrity?.beforeRestore && <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-300">SHA-256 verified before restore {selectedCase.integrity.afterRestore ? "and after recovery" : ""}.</div>}</div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><h3 className="text-sm font-semibold text-white">Rollback Point</h3><DarkSelect value={snapshotId} onChange={(event) => { setSnapshotId(event.target.value); setPreview(null); }} className="mt-3 h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300">{availableSnapshots.map((item) => <option key={item._id} value={item._id}>{new Date(item.createdAt).toLocaleString()} · {item.kind} · {item.manifest?.itemCount} items</option>)}</DarkSelect>{hasPermission("recovery:execute") && <div className="mt-3 flex flex-wrap gap-2"><button disabled={busy || !snapshotId} onClick={() => execute("VERIFY")} className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-300">Verify Hash</button><button disabled={busy || !snapshotId} onClick={() => execute("PREVIEW")} className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">Preview Restore</button><button disabled={busy || !snapshotId || !preview || selectedCase.status === "RECOVERED"} onClick={() => execute("RESTORE")} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300"><span className="flex items-center gap-2"><RotateCcw className="h-3.5 w-3.5" /> Restore Selected Point</span></button></div>}{preview && <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4"><p className="text-xs text-slate-300">{preview.warning}</p><ul className="mt-2 space-y-1 text-[10px] text-slate-500">{preview.restoreItems?.map((item) => <li key={item}>• {item}</li>)}</ul><p className="mt-2 text-[10px] text-cyan-300">Estimated demo recovery: {preview.estimatedDurationMinutes} minute(s)</p></div>}</div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><h3 className="text-sm font-semibold text-white">Immutable Recovery Timeline</h3><div className="mt-4 space-y-3">{selectedCase.steps?.map((step) => <div key={step._id} className="flex gap-3"><div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" /><div><p className="text-xs font-medium text-slate-300">{step.step.replaceAll("_", " ")}</p><p className="mt-1 text-[10px] text-slate-500">{step.message}</p></div></div>)}</div></div>
                <div className="flex flex-wrap gap-2">{selectedCase.reportReady && hasPermission("reports:export") && <button onClick={downloadReport} disabled={busy} className="flex items-center gap-2 rounded-lg border border-purple-400/20 bg-purple-400/10 px-3 py-2 text-xs text-purple-300"><Download className="h-3.5 w-3.5" /> Download Recovery Report</button>}{selectedCase.status === "RECOVERED" && selectedCase.shoreSyncStatus === "PENDING" && hasPermission("recovery:execute") && <button onClick={() => execute("SYNC")} disabled={busy} className="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-300"><CloudUpload className="h-3.5 w-3.5" /> Mark Shore Synced</button>}</div>
            </div>}</div></div>
        {snapshots.length > 0 && hasPermission("recovery:execute") && <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-sm text-slate-300">Detection delayed? Select a vessel and clean snapshot, then start recovery independently.</p><div className="mt-3 flex gap-2"><DarkSelect value={manualSnapshotId} onChange={(event) => setManualSnapshotId(event.target.value)} className="h-10 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300">{snapshots.filter((item) => String(item.vessel?._id || item.vessel) === vesselId).map((item) => <option key={item._id} value={item._id}>{item.snapshotId}</option>)}</DarkSelect><button disabled={!manualSnapshotId || busy} onClick={() => execute("MANUAL")} className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 text-xs text-amber-300">Start Independent Recovery</button></div></div>}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-xs text-slate-500">Recent file activity windows: {events.length}. Snapshots are encrypted with AES-256-GCM and locked against application updates/deletes; SHA-256 is verified before and after rollback.</p></div>
    </div>;
};
const tones = { cyan: "text-cyan-400", purple: "text-purple-400", red: "text-red-400", amber: "text-amber-400", emerald: "text-emerald-400" };
const Stat = ({ icon: Icon, label, value, tone }) => <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><Icon className={`h-4 w-4 ${tones[tone]}`} /><p className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>;
const Detail = ({ label, value }) => <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"><p className="text-[9px] uppercase text-slate-600">{label}</p><p className="mt-1 text-xs font-semibold text-slate-300">{value}</p></div>;
export default RecoveryShield;
