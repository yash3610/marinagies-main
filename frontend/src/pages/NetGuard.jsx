import DarkSelect from "../components/ui/DarkSelect";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Ban, CheckCircle2, Globe2, RefreshCw, Router, Satellite, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import api from "../services/api";
import { createSocket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";

const verdictStyles = {
    ALLOWED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
    BLOCKED: "border-red-400/20 bg-red-400/10 text-red-400",
    SINKHOLED: "border-orange-400/20 bg-orange-400/10 text-orange-400",
};

const NetGuard = () => {
    const { hasPermission } = useAuth();
    const [events, setEvents] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [indicators, setIndicators] = useState([]);
    const [vessels, setVessels] = useState([]);
    const [stats, setStats] = useState({ total: 0, allowed: 0, blocked: 0, sinkholed: 0 });
    const [vessel, setVessel] = useState("");
    const [eventType, setEventType] = useState("DNS_QUERY");
    const [domain, setDomain] = useState("malware-command-control.xyz");
    const [sourceSegment, setSourceSegment] = useState("CREW");
    const [destinationSegment, setDestinationSegment] = useState("OT");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [networkResponse, vesselResponse] = await Promise.all([api.get("/network"), api.get("/vessels")]);
            setEvents(networkResponse.data?.events || []);
            setPolicies(networkResponse.data?.policies || []);
            setIndicators(networkResponse.data?.indicators || []);
            setStats(networkResponse.data?.stats || { total: 0, allowed: 0, blocked: 0, sinkholed: 0 });
            const availableVessels = vesselResponse.data?.vessels || [];
            setVessels(availableVessels);
            setVessel((current) => current || availableVessels[0]?._id || "");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to load NetGuard data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(loadData, 0);
        const socket = createSocket();
        socket.on("netguard:event", (event) => {
            setEvents((current) => [event, ...current.filter((item) => item._id !== event._id)].slice(0, 200));
            setStats((current) => ({
                ...current,
                total: current.total + 1,
                allowed: current.allowed + (event.verdict === "ALLOWED" ? 1 : 0),
                blocked: current.blocked + (event.verdict === "BLOCKED" ? 1 : 0),
                sinkholed: current.sinkholed + (event.verdict === "SINKHOLED" ? 1 : 0),
            }));
        });
        socket.on("netguard:policy", (policy) => {
            setPolicies((current) => {
                const exists = current.some((item) => item._id === policy._id);
                return exists ? current.map((item) => item._id === policy._id ? policy : item) : [policy, ...current];
            });
        });
        return () => {
            window.clearTimeout(timer);
            socket.disconnect();
        };
    }, [loadData]);

    const run = async (operation, selectedDomain = domain) => {
        if (!vessel) return;
        try {
            setBusy(true);
            setError("");
            setMessage("");
            let response;
            if (operation === "simulate") {
                response = await api.post("/network/events/ingest", {
                    vessel, eventId: `ui-netguard-${Date.now()}`, eventType,
                    sourceDevice: "MOCK-CREW-LAPTOP-01", sourceIp: "10.30.0.25", sourceSegment,
                    ...(eventType === "DNS_QUERY" ? { domain: selectedDomain } : { destinationSegment, destinationPort: 502, protocol: "TCP" }),
                    simulated: true,
                });
            } else if (operation === "block" || operation === "whitelist") {
                response = await api.post(`/network/domains/${operation}`, {
                    vessel, domain: selectedDomain,
                    reason: operation === "whitelist" ? "Analyst reviewed and confirmed false positive" : "Analyst-added malicious domain rule",
                });
            } else if (operation === "failover") {
                response = await api.post(`/network/policies/${vessel}/failover`, { simulated: true });
            } else if (operation === "sync") {
                response = await api.post("/network/threat-feed/sync", {
                    indicators: [{ value: "fleet-ransomware-c2.top", verdict: "MALICIOUS", confidence: 98, reason: "Mock shore-feed ransomware command-and-control indicator" }],
                });
            }
            setMessage(response.data?.message || "NetGuard operation completed");
            await loadData();
        } catch (requestError) {
            setError(requestError.response?.data?.message || "NetGuard operation failed");
        } finally {
            setBusy(false);
        }
    };

    const filteredEvents = useMemo(() => {
        const query = search.toLowerCase();
        return events.filter((event) => !query || [event.domain, event.sourceDevice, event.vessel?.name, event.verdict, event.reason]
            .some((value) => String(value || "").toLowerCase().includes(query)));
    }, [events, search]);
    const currentPolicy = policies.find((item) => String(item.vessel?._id || item.vessel) === vessel);
    const blockedEvents = events.filter((event) => event.verdict !== "ALLOWED").slice(0, 8);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10"><Router className="h-5 w-5 text-cyan-400" /></div>
                    <div><h1 className="text-2xl font-bold text-white">NetGuard</h1><p className="mt-1 text-sm text-slate-400">DNS sinkhole, threat intelligence and vessel network segmentation</p></div>
                </div>
                <button type="button" onClick={loadData} className="flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
            </div>

            {error && <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">{message}</div>}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat icon={Activity} label="Total Requests" value={stats.total} tone="cyan" />
                <Stat icon={CheckCircle2} label="Allowed" value={stats.allowed} tone="emerald" />
                <Stat icon={Ban} label="Policy Blocked" value={stats.blocked} tone="red" />
                <Stat icon={ShieldAlert} label="DNS Sinkholed" value={stats.sinkholed} tone="orange" />
            </div>

            {hasPermission("network:manage") && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                    <div className="mb-4 flex items-center gap-2"><Globe2 className="h-4 w-4 text-cyan-400" /><h2 className="text-sm font-semibold text-white">Policy Test Console</h2><span className="rounded bg-orange-400/10 px-2 py-1 text-[9px] text-orange-300">MOCK INPUT</span></div>
                    <div className="grid gap-3 lg:grid-cols-6">
                        <Field label="Vessel"><DarkSelect value={vessel} onChange={(event) => setVessel(event.target.value)} className="netguard-input"><option value="">Select vessel</option>{vessels.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</DarkSelect></Field>
                        <Field label="Event"><DarkSelect value={eventType} onChange={(event) => setEventType(event.target.value)} className="netguard-input"><option value="DNS_QUERY">DNS Query</option><option value="NETWORK_CONNECTION">Segment Connection</option></DarkSelect></Field>
                        {eventType === "DNS_QUERY" ? (
                            <div className="lg:col-span-2"><Field label="Domain"><input value={domain} onChange={(event) => setDomain(event.target.value)} className="netguard-input" /></Field></div>
                        ) : (
                            <><Field label="From"><SegmentSelect value={sourceSegment} onChange={setSourceSegment} /></Field><Field label="To"><SegmentSelect value={destinationSegment} onChange={setDestinationSegment} /></Field></>
                        )}
                        <div className="flex items-end"><button type="button" disabled={busy || !vessel} onClick={() => run("simulate")} className="h-10 w-full rounded-lg bg-cyan-400/10 text-xs font-semibold text-cyan-300 disabled:opacity-40">Run Request</button></div>
                        <div className="flex items-end gap-2">
                            {eventType === "DNS_QUERY" && <button type="button" disabled={busy || !vessel} onClick={() => run("block")} className="h-10 flex-1 rounded-lg border border-red-400/20 text-[10px] text-red-300">Block</button>}
                            {eventType === "DNS_QUERY" && <button type="button" disabled={busy || !vessel} onClick={() => run("whitelist")} className="h-10 flex-1 rounded-lg border border-emerald-400/20 text-[10px] text-emerald-300">Whitelist</button>}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[1.45fr_.8fr]">
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-4"><div><h2 className="text-sm font-semibold text-white">Network Event Log</h2><p className="mt-1 text-[10px] text-slate-600">Append-only DNS and segmentation decisions</p></div><div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events" className="h-9 w-44 rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-xs text-slate-300" /></div></div>
                    {!filteredEvents.length ? <div className="p-12 text-center text-sm text-slate-600">No network events recorded yet.</div> : <div className="max-h-[560px] divide-y divide-slate-800/70 overflow-y-auto">{filteredEvents.map((event) => <EventRow key={event._id} event={event} />)}</div>}
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                        <div className="flex items-center gap-2"><Satellite className="h-4 w-4 text-cyan-400" /><h2 className="text-sm font-semibold text-white">SD-WAN Policy</h2></div>
                        <div className="mt-4 space-y-3 text-xs"><Info label="Policy version" value={currentPolicy?.policyVersion || "Not initialized"} /><Info label="Active provider" value={currentPolicy?.satellite?.activeProvider || "--"} /><Info label="Sinkhole" value={currentPolicy?.dns?.sinkholeIp || "10.255.255.1"} /><Info label="Last shore sync" value={currentPolicy?.lastShoreSyncAt ? new Date(currentPolicy.lastShoreSyncAt).toLocaleString() : "Never"} /></div>
                        {hasPermission("network:manage") && <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={busy || !vessel} onClick={() => run("failover")} className="rounded-lg border border-cyan-400/20 px-3 py-2 text-[10px] text-cyan-300">Test Failover</button><button type="button" disabled={busy} onClick={() => run("sync")} className="rounded-lg border border-purple-400/20 px-3 py-2 text-[10px] text-purple-300">Sync Mock Feed</button></div>}
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-400" /><h2 className="text-sm font-semibold text-white">Blocked Review</h2></div><div className="mt-4 space-y-2">{blockedEvents.length ? blockedEvents.map((event) => <div key={event._id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs text-slate-300">{event.domain || `${event.sourceSegment} → ${event.destinationSegment}`}</p>{event.domain && hasPermission("network:manage") && <button type="button" disabled={busy} onClick={() => run("whitelist", event.domain)} className="shrink-0 text-[9px] text-emerald-400">Whitelist</button>}</div><p className="mt-1 text-[9px] text-slate-600">{event.sourceDevice} · {event.riskScore}% risk</p></div>) : <p className="text-xs text-slate-600">No blocked requests.</p>}</div></div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"><h2 className="text-sm font-semibold text-white">Threat Intelligence</h2><p className="mt-1 text-[10px] text-slate-600">{indicators.length} active domain indicators</p><div className="mt-3 max-h-40 space-y-2 overflow-y-auto">{indicators.slice(0, 10).map((item) => <div key={item._id} className="flex items-center justify-between gap-2 text-[10px]"><span className="truncate text-slate-400">{item.value}</span><span className={item.verdict === "TRUSTED" ? "text-emerald-400" : "text-red-400"}>{item.verdict}</span></div>)}</div></div>
                </div>
            </div>
        </div>
    );
};

const toneClasses = { cyan: "text-cyan-400", emerald: "text-emerald-400", red: "text-red-400", orange: "text-orange-400" };
const Stat = ({ icon: Icon, label, value, tone }) => <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><Icon className={`h-4 w-4 ${toneClasses[tone]}`} /><p className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>;
const Field = ({ label, children }) => <label className="block"><span className="mb-2 block text-[9px] uppercase tracking-wider text-slate-600">{label}</span>{children}</label>;
const SegmentSelect = ({ value, onChange }) => <DarkSelect value={value} onChange={(event) => onChange(event.target.value)} className="netguard-input">{["OT", "IT", "CREW", "MARINEAEGIS", "UPLINK"].map((item) => <option key={item}>{item}</option>)}</DarkSelect>;
const Info = ({ label, value }) => <div className="flex justify-between gap-3"><span className="text-slate-600">{label}</span><span className="text-right text-slate-300">{value}</span></div>;
const EventRow = ({ event }) => <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-slate-200">{event.domain || `${event.sourceSegment} → ${event.destinationSegment}`}</p><span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${verdictStyles[event.verdict]}`}>{event.verdict}</span>{event.simulated && <span className="text-[9px] text-orange-400">MOCK</span>}</div><p className="mt-1 text-[10px] text-slate-500">{event.vessel?.name || "--"} · {event.sourceDevice} · {event.satelliteProvider || "local"}</p><p className="mt-2 text-xs leading-5 text-slate-500">{event.reason}</p></div><div className="shrink-0 text-right"><p className="text-xs font-semibold text-cyan-400">{event.confidence}%</p><p className="mt-1 text-[9px] text-slate-700">{new Date(event.timestamp).toLocaleTimeString()}</p></div></div></div>;

export default NetGuard;
