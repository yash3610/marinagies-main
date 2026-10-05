import { useEffect, useState } from "react";
import { Settings as SettingsIcon, ShieldCheck, User, Radar, Save } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

const Settings = () => {
    const { user, hasPermission } = useAuth();
    const canManage = hasPermission("vessels:manage");
    const [ghostTrace, setGhostTrace] = useState(null);
    const [baselines, setBaselines] = useState([]);
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await api.get("/ghosttrace/config");
                setGhostTrace(response.data.policy);
                setBaselines(response.data.baselines || []);
            } catch (error) {
                setMessage(error.response?.data?.message || "GhostTrace configuration could not be loaded");
            }
        };
        load();
    }, []);

    const updateThreshold = (type, value) => setGhostTrace((current) => ({
        ...current,
        classThresholds: { ...current.classThresholds, [type]: Number(value) },
    }));

    const saveGhostTrace = async () => {
        setSaving(true); setMessage("");
        try {
            const response = await api.put("/ghosttrace/config", {
                classThresholds: ghostTrace.classThresholds,
                slowDrift: ghostTrace.slowDrift,
            });
            setGhostTrace(response.data.policy);
            setMessage(response.data.message);
        } catch (error) {
            setMessage(error.response?.data?.message || "Configuration update failed");
        } finally { setSaving(false); }
    };
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                    <SettingsIcon className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                    <p className="text-sm text-slate-400">Account and platform information</p>
                </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                    <div className="mb-4 flex items-center gap-2 text-white"><User className="h-4 w-4 text-cyan-400" /><h2 className="font-semibold">Account</h2></div>
                    <dl className="space-y-3 text-sm">
                        <div><dt className="text-xs text-slate-500">Name</dt><dd className="mt-1 text-slate-200">{user?.name || "--"}</dd></div>
                        <div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-1 text-slate-200">{user?.email || "--"}</dd></div>
                        <div><dt className="text-xs text-slate-500">Role</dt><dd className="mt-1 text-slate-200">{user?.role || "--"}</dd></div>
                    </dl>
                </section>
                <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                    <div className="mb-4 flex items-center gap-2 text-white"><ShieldCheck className="h-4 w-4 text-emerald-400" /><h2 className="font-semibold">Session Security</h2></div>
                    <p className="text-sm leading-6 text-slate-400">Your dashboard session is protected and automatically expires after inactivity. Use Logout on shared devices.</p>
                </section>
            </div>
            {message && <div role="status" className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-xs text-cyan-200">{message}</div>}
            {ghostTrace && <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-2"><Radar className="h-4 w-4 text-cyan-400" /><div><h2 className="font-semibold text-white">GhostTrace adaptive detection</h2><p className="mt-1 text-xs text-slate-500">Vessel-class thresholds, 90-day baseline and slow cumulative drift controls</p></div></div>{canManage && <button disabled={saving} onClick={saveGhostTrace} className="flex w-fit items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-300 disabled:opacity-40"><Save className="h-3.5 w-3.5" /> Save thresholds</button>}</div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{Object.entries(ghostTrace.classThresholds || {}).filter(([type]) => !type.startsWith("$")).map(([type, value]) => <label key={type} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"><span className="text-[10px] uppercase text-slate-500">{type.replaceAll("_", " ")}</span><div className="mt-2 flex items-center gap-2"><input disabled={!canManage} type="number" min="0.5" max="0.95" step="0.01" value={value} onChange={(event) => updateThreshold(type, event.target.value)} className="h-9 w-full rounded border border-slate-700 bg-slate-950 px-2 text-sm text-white disabled:opacity-60" /><span className="text-xs text-slate-600">score</span></div></label>)}</div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["windowHours","Drift window (hours)"],["minimumSamples","Minimum samples"],["minimumDurationMinutes","Minimum duration (min)"],["minimumNetDriftMeters","Net drift (m)"],["minimumSlopeMetersPerHour","Slope (m/hour)"]].map(([key,label]) => <label key={key}><span className="mb-2 block text-[10px] uppercase text-slate-500">{label}</span><input disabled={!canManage} type="number" value={ghostTrace.slowDrift?.[key] ?? ""} onChange={(event) => setGhostTrace((current) => ({ ...current, slowDrift: { ...current.slowDrift, [key]: Number(event.target.value) } }))} className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300 disabled:opacity-60" /></label>)}</div>
                <div className="mt-5 overflow-hidden rounded-lg border border-slate-800"><div className="grid grid-cols-[1fr_.5fr_.6fr_.7fr] border-b border-slate-800 px-3 py-2 text-[9px] uppercase text-slate-600"><span>Vessel baseline</span><span>Samples</span><span>90-day status</span><span>Refreshed</span></div>{!baselines.length ? <p className="p-5 text-center text-xs text-slate-600">Baselines will appear after telemetry is processed.</p> : baselines.map((baseline) => <div key={baseline._id} className="grid grid-cols-[1fr_.5fr_.6fr_.7fr] border-b border-slate-800/60 px-3 py-3 text-xs"><span className="text-slate-200">{baseline.vessel?.name || "Unknown"}</span><span className="text-slate-400">{baseline.sampleCount}</span><span className={baseline.minimumSamplesMet ? "text-emerald-300" : "text-amber-300"}>{baseline.minimumSamplesMet ? "READY" : "LEARNING"}</span><span className="text-slate-500">{new Date(baseline.refreshedAt).toLocaleString()}</span></div>)}</div>
            </section>}
        </div>
    );
};

export default Settings;
