import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, Factory, FlaskConical, GitFork, RefreshCw, Search, Ship, ShieldAlert } from "lucide-react";
import api from "../services/api";
import { createSocket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";

const riskStyles = {
    LOW: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
    MEDIUM: "border-amber-400/20 bg-amber-400/10 text-amber-400",
    HIGH: "border-orange-400/20 bg-orange-400/10 text-orange-400",
    CRITICAL: "border-red-400/20 bg-red-400/10 text-red-400",
};

const FleetChoke = () => {
    const { hasPermission } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [assets, setAssets] = useState([]);
    const [scenarios, setScenarios] = useState([]);
    const [stats, setStats] = useState({});
    const [selectedId, setSelectedId] = useState("");
    const [severity, setSeverity] = useState(90);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/fleetchoke");
            const nextSuppliers = response.data?.suppliers || [];
            setSuppliers(nextSuppliers);
            setAssets(response.data?.assets || []);
            setScenarios(response.data?.scenarios || []);
            setStats(response.data?.stats || {});
            setSelectedId((current) => current || nextSuppliers[0]?._id || "");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to load FleetChoke data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(loadData, 0);
        const socket = createSocket();
        socket.on("fleetchoke:supplier", () => loadData());
        return () => {
            window.clearTimeout(timer);
            socket.disconnect();
        };
    }, [loadData]);

    const execute = async (action) => {
        try {
            setBusy(true);
            setError("");
            setMessage("");
            const response = action === "bootstrap"
                ? await api.post("/fleetchoke/bootstrap-demo")
                : await api.post(`/fleetchoke/suppliers/${selectedId}/simulate`, { compromiseSeverity: Number(severity) });
            setMessage(response.data?.message || "FleetChoke operation completed");
            await loadData();
        } catch (requestError) {
            setError(requestError.response?.data?.message || "FleetChoke operation failed");
        } finally {
            setBusy(false);
        }
    };

    const visibleSuppliers = useMemo(() => {
        const query = search.toLowerCase();
        return suppliers.filter((supplier) => !query || [supplier.name, supplier.supplierId, supplier.category, supplier.riskLevel]
            .some((value) => String(value || "").toLowerCase().includes(query)));
    }, [suppliers, search]);
    const selected = suppliers.find((supplier) => supplier._id === selectedId) || null;
    const selectedAssets = assets.filter((asset) => String(asset.supplier?._id || asset.supplier) === selectedId);
    const vesselGroups = selectedAssets.reduce((groups, asset) => {
        const id = String(asset.vessel?._id || asset.vessel);
        if (!groups[id]) groups[id] = { vessel: asset.vessel, assets: [] };
        groups[id].assets.push(asset);
        return groups;
    }, {});
    const latestScenario = scenarios.find((scenario) => String(scenario.supplier?._id || scenario.supplier) === selectedId);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10"><GitFork className="h-5 w-5 text-amber-400" /></div><div><h1 className="text-2xl font-bold text-white">FleetChoke</h1><p className="mt-1 text-sm text-slate-400">Supplier dependency graph, firmware exposure and fleet blast radius</p></div></div>
                <div className="flex gap-2">{hasPermission("fleet-risk:manage") && <button type="button" disabled={busy} onClick={() => execute("bootstrap")} className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300 disabled:opacity-40">Load Mock Supply Chain</button>}<button type="button" onClick={loadData} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</button></div>
            </div>
            {error && <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">{message}</div>}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <Stat icon={Factory} label="Suppliers" value={stats.suppliers || 0} tone="cyan" />
                <Stat icon={Boxes} label="Assets" value={stats.assets || 0} tone="purple" />
                <Stat icon={Ship} label="Vessels" value={stats.vessels || 0} tone="emerald" />
                <Stat icon={ShieldAlert} label="High Risk" value={stats.highRiskSuppliers || 0} tone="red" />
                <Stat icon={GitFork} label="Blast Radius" value={stats.totalBlastRadius || 0} tone="amber" />
            </div>

            <div className="grid gap-4 xl:grid-cols-[.75fr_1.5fr]">
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                    <div className="border-b border-slate-800 p-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search suppliers" className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-xs text-slate-300" /></div></div>
                    {!visibleSuppliers.length ? <div className="p-10 text-center text-sm text-slate-600">No supplier dependencies registered.</div> : <div className="divide-y divide-slate-800/70">{visibleSuppliers.map((supplier) => <button type="button" key={supplier._id} onClick={() => setSelectedId(supplier._id)} className={`w-full p-4 text-left transition ${selectedId === supplier._id ? "bg-amber-400/[0.05]" : "hover:bg-slate-900/40"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-200">{supplier.name}</p><p className="mt-1 text-[10px] text-slate-600">{supplier.category} · {supplier.assetCount} assets</p></div><span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${riskStyles[supplier.riskLevel]}`}>{supplier.riskScore}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded bg-slate-800"><div className="h-full bg-amber-400" style={{ width: `${supplier.riskScore}%` }} /></div></button>)}</div>}
                </div>

                <div className="space-y-4">
                    {!selected ? <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-12 text-center text-sm text-slate-600">Select a supplier to inspect dependencies.</div> : <>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Factory className="h-4 w-4 text-amber-400" /><h2 className="text-lg font-bold text-white">{selected.name}</h2><span className={`rounded-full border px-2 py-1 text-[9px] ${riskStyles[selected.riskLevel]}`}>{selected.riskLevel}</span></div><p className="mt-2 text-xs text-slate-500">{selected.explanation?.summary}</p></div><div className="text-right"><p className="text-3xl font-bold text-amber-400">{selected.riskScore}%</p><p className="text-[9px] text-slate-600">SUPPLIER RISK</p></div></div><div className="mt-4 grid gap-3 md:grid-cols-3"><Detail label="Affected vessels" value={selected.affectedVesselCount} /><Detail label="Weighted blast radius" value={selected.blastRadius} /><Detail label="Known CVEs" value={selected.cves?.length || 0} /></div><div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-600">Risk Factors</p>{selected.explanation?.factors?.map((factor) => <p key={factor} className="mt-2 flex gap-2 text-xs text-slate-400"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-orange-400" />{factor}</p>)}<p className="mt-3 text-xs text-cyan-300">{selected.explanation?.recommendation}</p></div></div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><div className="flex items-center gap-2"><GitFork className="h-4 w-4 text-cyan-400" /><h2 className="text-sm font-semibold text-white">Dependency Map</h2></div><div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-center"><Factory className="mx-auto h-5 w-5 text-amber-400" /><p className="mt-2 text-sm font-semibold text-white">{selected.name}</p><p className="text-[9px] text-slate-600">SUPPLIER ROOT</p></div><div className="mx-auto h-5 w-px bg-slate-700" /><div className="grid gap-3 md:grid-cols-2">{Object.values(vesselGroups).map((group) => <div key={group.vessel?._id} className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] p-4"><div className="flex items-center gap-2"><Ship className="h-4 w-4 text-cyan-400" /><p className="text-xs font-semibold text-slate-200">{group.vessel?.name}</p></div><div className="mt-3 space-y-2">{group.assets.map((asset) => <div key={asset._id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"><div className="flex justify-between gap-2"><p className="text-[10px] text-slate-300">{asset.name}</p><span className="text-[8px] text-orange-400">{asset.criticality.replaceAll("_", " ")}</span></div><p className="mt-1 text-[9px] text-slate-600">{asset.deviceModel} · firmware {asset.firmwareVersion}</p></div>)}</div></div>)}</div></div>

                        {hasPermission("fleet-risk:manage") && <div className="rounded-xl border border-purple-400/15 bg-purple-400/[0.03] p-5"><div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-purple-400" /><h2 className="text-sm font-semibold text-white">What-if Supplier Compromise</h2></div><div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end"><label className="flex-1"><span className="mb-2 flex justify-between text-[10px] text-slate-500"><span>Compromise severity</span><span>{severity}%</span></span><input type="range" min="1" max="100" value={severity} onChange={(event) => setSeverity(event.target.value)} className="w-full accent-purple-400" /></label><button type="button" disabled={busy || !selectedId} onClick={() => execute("simulate")} className="rounded-lg border border-purple-400/20 bg-purple-400/10 px-4 py-2.5 text-xs text-purple-300 disabled:opacity-40">Simulate Impact</button></div>{latestScenario && <div className="mt-4 rounded-lg border border-slate-800 p-4"><p className="text-xs text-slate-300">{latestScenario.summary}</p><div className="mt-3 space-y-2">{latestScenario.affectedVessels.map((item) => <div key={item.vessel?._id} className="flex items-center justify-between text-[10px]"><span className="text-slate-500">{item.vessel?.name}</span><span className={item.impactLevel === "CRITICAL" ? "text-red-400" : "text-orange-400"}>{item.projectedRisk}% {item.impactLevel}</span></div>)}</div></div>}</div>}
                    </>}
                </div>
            </div>
        </div>
    );
};

const tones = { cyan: "text-cyan-400", purple: "text-purple-400", emerald: "text-emerald-400", red: "text-red-400", amber: "text-amber-400" };
const Stat = ({ icon: Icon, label, value, tone }) => <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><Icon className={`h-4 w-4 ${tones[tone]}`} /><p className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>;
const Detail = ({ label, value }) => <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"><p className="text-[9px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-sm font-semibold text-slate-300">{value}</p></div>;
export default FleetChoke;
