import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    AlertTriangle,
    Anchor,
    Check,
    ChevronDown,
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    Ship,
    Trash2,
    Wifi,
    WifiOff,
    X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const EMPTY_FORM = {
    name: "", vesselId: "", imoNumber: "", vesselType: "CARGO", status: "OFFLINE",
    riskScore: "0", riskLevel: "LOW", latitude: "18.9", longitude: "72.75", speed: "12",
    heading: "270", destination: "Jebel Ali / Dubai", captain: "", origin: "Mumbai Port", routeDestination: "Jebel Ali / Dubai",
    originPort: "MUMBAI", destinationPort: "DUBAI",
    destinationLatitude: "25.1389", destinationLongitude: "54.8867",
};

const VESSEL_TYPES = ["CONTAINER", "TANKER", "CARGO", "BULK_CARRIER", "PASSENGER", "OTHER"];
const VESSEL_STATUSES = ["ONLINE", "OFFLINE", "WARNING", "CRITICAL"];
const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const FleetOverview = () => {
    const { hasPermission } = useAuth();
    const canManage = hasPermission("vessels:manage");
    const [vessels, setVessels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [editing, setEditing] = useState(undefined);
    const [deleting, setDeleting] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [ports, setPorts] = useState([]);

    useEffect(() => {
        const fetchVessels = async () => {
            try {
                const response = await api.get("/vessels");

                if (response.data.success) {
                    setVessels(response.data.vessels || []);
                }
            } catch (err) {
                console.error("Fleet fetch error:", err);

                setError(
                    err.response?.data?.message ||
                    "Failed to load fleet data."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchVessels();
    }, []);

    useEffect(() => {
        api.get("/vessels/marine-route/ports")
            .then((response) => setPorts(response.data?.ports || []))
            .catch(() => setPorts([]));
    }, []);

    const totalVessels = vessels.length;

    const onlineVessels = vessels.filter(
        (vessel) => vessel.status === "ONLINE"
    ).length;

    const warningVessels = vessels.filter(
        (vessel) => vessel.status === "WARNING"
    ).length;

    const criticalVessels = vessels.filter(
        (vessel) => vessel.status === "CRITICAL"
    ).length;

    const visibleVessels = vessels.filter((vessel) => {
        const searchable = [vessel.name, vessel.vesselId, vessel.imoNumber, vessel.vesselType, vessel.destination, vessel.status]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return searchable.includes(query.trim().toLowerCase());
    });

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setFormError("");
        setEditing(null);
    };

    const openEdit = (vessel) => {
        setForm({
            name: vessel.name || "", vesselId: vessel.vesselId || "", imoNumber: vessel.imoNumber || "",
            vesselType: vessel.vesselType || "CARGO", status: vessel.status || "OFFLINE",
            riskScore: String(vessel.riskScore ?? 0), riskLevel: vessel.riskLevel || "LOW",
            latitude: String(vessel.latitude ?? 0), longitude: String(vessel.longitude ?? 0),
            speed: String(vessel.speed ?? 0), heading: String(vessel.heading ?? 0),
            destination: vessel.destination || "", captain: vessel.captain || "",
            origin: vessel.route?.origin || "", routeDestination: vessel.route?.destination || "",
            originPort: vessel.route?.originPort || "MUMBAI", destinationPort: vessel.route?.destinationPort || "DUBAI",
            destinationLatitude: String(vessel.route?.destinationLatitude ?? 25.1389),
            destinationLongitude: String(vessel.route?.destinationLongitude ?? 54.8867),
        });
        setFormError("");
        setEditing(vessel);
    };

    const handleField = (event) => {
        const { name, value } = event.target;
        if (name === "originPort" || name === "destinationPort") {
            const port = ports.find((item) => item.key === value);
            if (port) {
                setForm((current) => name === "originPort"
                    ? { ...current, originPort: value, origin: port.name, latitude: String(port.latitude), longitude: String(port.longitude) }
                    : { ...current, destinationPort: value, routeDestination: port.name, destination: port.name, destinationLatitude: String(port.latitude), destinationLongitude: String(port.longitude) });
                return;
            }
        }
        setForm((current) => ({ ...current, [name]: name === "vesselId" ? value.toUpperCase() : value }));
    };

    const saveVessel = async (event) => {
        event.preventDefault();
        setFormError("");
        if (!form.name.trim() || !form.vesselId.trim() || !form.imoNumber.trim()) {
            setFormError("Vessel name, Vessel ID and IMO number are required.");
            return;
        }
        const payload = {
            name: form.name.trim(), vesselId: form.vesselId.trim(), imoNumber: form.imoNumber.trim(),
            vesselType: form.vesselType, status: form.status, riskScore: Number(form.riskScore),
            riskLevel: form.riskLevel, latitude: Number(form.latitude), longitude: Number(form.longitude),
            speed: Number(form.speed), heading: Number(form.heading), destination: form.destination.trim(),
            captain: form.captain.trim(), route: {
                origin: form.origin.trim(), destination: form.routeDestination.trim(),
                originPort: form.originPort, destinationPort: form.destinationPort,
                destinationLatitude: Number(form.destinationLatitude),
                destinationLongitude: Number(form.destinationLongitude),
            },
        };
        if (payload.riskScore < 0 || payload.riskScore > 100 || payload.heading < 0 || payload.heading > 360
            || payload.latitude < -90 || payload.latitude > 90 || payload.longitude < -180 || payload.longitude > 180
            || payload.route.destinationLatitude < -90 || payload.route.destinationLatitude > 90
            || payload.route.destinationLongitude < -180 || payload.route.destinationLongitude > 180) {
            setFormError("Check risk, heading and coordinate ranges before saving.");
            return;
        }
        try {
            setBusy(true);
            const response = editing
                ? await api.put(`/vessels/${editing._id}`, payload)
                : await api.post("/vessels", payload);
            const saved = response.data.vessel;
            setVessels((current) => editing
                ? current.map((item) => item._id === saved._id ? saved : item)
                : [saved, ...current]);
            setEditing(undefined);
            setMessage(editing ? "Vessel updated successfully." : "New vessel added successfully.");
            window.setTimeout(() => setMessage(""), 3500);
        } catch (err) {
            const apiMessage = err.response?.data?.message || "Vessel could not be saved.";
            setFormError(apiMessage.includes("duplicate key") ? "Vessel ID or IMO number already exists." : apiMessage);
        } finally {
            setBusy(false);
        }
    };

    const removeVessel = async () => {
        try {
            setBusy(true);
            await api.delete(`/vessels/${deleting._id}`);
            setVessels((current) => current.filter((item) => item._id !== deleting._id));
            setDeleting(null);
            setMessage("Vessel removed from the active fleet.");
            window.setTimeout(() => setMessage(""), 3500);
        } catch (err) {
            setError(err.response?.data?.message || "Vessel could not be removed.");
        } finally {
            setBusy(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "ONLINE":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

            case "WARNING":
                return "bg-amber-500/10 text-amber-400 border-amber-500/20";

            case "CRITICAL":
                return "bg-red-500/10 text-red-400 border-red-500/20";

            case "OFFLINE":
                return "bg-slate-500/10 text-slate-400 border-slate-500/20";

            default:
                return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    const getRiskClass = (riskLevel) => {
        switch (riskLevel) {
            case "LOW":
                return "text-emerald-400";

            case "MEDIUM":
                return "text-amber-400";

            case "HIGH":
                return "text-orange-400";

            case "CRITICAL":
                return "text-red-400";

            default:
                return "text-slate-400";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-cyan-400 text-sm animate-pulse">
                    Loading fleet data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2"><Anchor className="h-5 w-5 text-cyan-400" /><h1 className="text-2xl font-semibold text-white">Fleet Overview</h1></div>
                    <p className="mt-1 text-sm text-slate-500">Monitor and manage all registered vessels</p>
                </div>
                {canManage && <button type="button" onClick={openCreate} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/15"><Plus className="h-4 w-4" />Add Vessel</button>}
            </div>

            {message && <div role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-xs text-emerald-300">{message}</div>}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* Total */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500">
                                Total Vessels
                            </p>

                            <p className="text-3xl font-bold text-white mt-2">
                                {totalVessels}
                            </p>
                        </div>

                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                            <Ship className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>
                </div>

                {/* Online */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500">
                                Online
                            </p>

                            <p className="text-3xl font-bold text-emerald-400 mt-2">
                                {onlineVessels}
                            </p>
                        </div>

                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Wifi className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                </div>

                {/* Warning */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500">
                                Warning
                            </p>

                            <p className="text-3xl font-bold text-amber-400 mt-2">
                                {warningVessels}
                            </p>
                        </div>

                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                    </div>
                </div>

                {/* Critical */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500">
                                Critical
                            </p>

                            <p className="text-3xl font-bold text-red-400 mt-2">
                                {criticalVessels}
                            </p>
                        </div>

                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                    </div>
                </div>

            </div>

            {/* Fleet Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">

                {/* Table Header */}
                <div className="border-b border-slate-800 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <h2 className="text-sm font-semibold text-white">
                                Registered Vessels
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                Current fleet status and navigation data
                            </p>
                        </div>

                        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-950/60 px-3 transition focus-within:border-cyan-400/35 sm:w-72">
                            <Search className="w-4 h-4 text-slate-500" />
                            <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search vessels" placeholder="Search vessel, IMO or destination" className="h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-xs shadow-none outline-none focus:border-0" />
                        </label>

                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">

                        <thead>
                            <tr className="border-b border-slate-800">

                                <th className="text-left text-[11px] font-medium text-slate-500 px-5 py-4">
                                    Vessel
                                </th>

                                <th className="text-left text-[11px] font-medium text-slate-500 px-5 py-4">
                                    Vessel ID
                                </th>

                                <th className="text-left text-[11px] font-medium text-slate-500 px-5 py-4">
                                    Type
                                </th>

                                <th className="text-left text-[11px] font-medium text-slate-500 px-5 py-4">
                                    Status
                                </th>

                                <th className="text-left text-[11px] font-medium text-slate-500 px-5 py-4">
                                    Risk
                                </th>

                                <th className="text-left text-[11px] font-medium text-slate-500 px-5 py-4">
                                    Speed
                                </th>

                                <th className="text-left text-[11px] font-medium text-slate-500 px-5 py-4">
                                    Heading
                                </th>

                                <th className="text-left text-[11px] font-medium text-slate-500 px-5 py-4">
                                    Destination
                                </th>

                                {canManage && <th className="px-5 py-4 text-left text-[11px] font-medium text-slate-500">Actions</th>}

                            </tr>
                        </thead>

                        <tbody>
                            {visibleVessels.map((vessel) => (
                                <tr
                                    key={vessel._id}
                                    className="border-b border-slate-800/70 hover:bg-slate-800/20 transition"
                                >

                                    {/* Vessel */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">

                                            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                                <Ship className="w-4 h-4 text-cyan-400" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {vessel.name}
                                                </p>

                                                <p className="text-[10px] text-slate-600">
                                                    IMO {vessel.imoNumber}
                                                </p>
                                            </div>

                                        </div>
                                    </td>

                                    {/* Vessel ID */}
                                    <td className="px-5 py-4">
                                        <span className="text-xs font-mono text-cyan-400">
                                            {vessel.vesselId}
                                        </span>
                                    </td>

                                    {/* Type */}
                                    <td className="px-5 py-4">
                                        <span className="text-xs text-slate-400">
                                            {vessel.vesselType
                                                ?.replace("_", " ")}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${getStatusClass(
                                                vessel.status
                                            )}`}
                                        >
                                            {vessel.status === "ONLINE" && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            )}

                                            {vessel.status === "OFFLINE" && (
                                                <WifiOff className="w-3 h-3" />
                                            )}

                                            {vessel.status}
                                        </span>
                                    </td>

                                    {/* Risk */}
                                    <td className="px-5 py-4">
                                        <div>
                                            <p
                                                className={`text-sm font-semibold ${getRiskClass(
                                                    vessel.riskLevel
                                                )}`}
                                            >
                                                {vessel.riskScore}
                                            </p>

                                            <p
                                                className={`text-[10px] ${getRiskClass(
                                                    vessel.riskLevel
                                                )}`}
                                            >
                                                {vessel.riskLevel}
                                            </p>
                                        </div>
                                    </td>

                                    {/* Speed */}
                                    <td className="px-5 py-4">
                                        <span className="text-xs text-slate-300">
                                            {vessel.speed} kn
                                        </span>
                                    </td>

                                    {/* Heading */}
                                    <td className="px-5 py-4">
                                        <span className="text-xs text-slate-300">
                                            {vessel.heading}°
                                        </span>
                                    </td>

                                    {/* Destination */}
                                    <td className="px-5 py-4">
                                        <span className="text-xs text-slate-300">
                                            {vessel.destination}
                                        </span>
                                    </td>

                                    {canManage && <td className="px-5 py-4"><div className="flex items-center gap-1"><button type="button" aria-label={`Edit ${vessel.name}`} onClick={() => openEdit(vessel)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-cyan-400/10 hover:text-cyan-300"><Pencil className="h-3.5 w-3.5" /></button><button type="button" aria-label={`Delete ${vessel.name}`} onClick={() => setDeleting(vessel)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-400/10 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button></div></td>}

                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>

                {/* Empty State */}
                {visibleVessels.length === 0 && (
                    <div className="py-12 text-center">
                        <Ship className="w-8 h-8 text-slate-700 mx-auto mb-3" />

                        <p className="text-sm text-slate-500">
                            {query ? "No vessels match your search" : "No vessels found"}
                        </p>
                    </div>
                )}

            </div>

            {editing !== undefined && <VesselModal form={form} ports={ports} editing={editing} busy={busy} error={formError} onChange={handleField} onClose={() => !busy && setEditing(undefined)} onSubmit={saveVessel} />}
            {deleting && <DeleteVesselModal vessel={deleting} busy={busy} onClose={() => !busy && setDeleting(null)} onConfirm={removeVessel} />}
        </div>
    );
};

const useDialogLifecycle = (onClose) => {
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [onClose]);
};

const FormField = ({ label, required, ...props }) => <label className="block">
    <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}{required && <span className="text-red-400"> *</span>}</span>
    <input required={required} {...props} className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 outline-none" />
</label>;

const FormSelect = ({ label, options, name, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const close = (event) => {
            if (event.key === "Escape" || !rootRef.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", close);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("keydown", close);
        };
    }, [open]);

    return <div ref={rootRef} className="relative">
        <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</span>
        <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className={`flex h-10 w-full items-center justify-between rounded-lg border bg-slate-950 px-3 text-left text-xs text-slate-200 outline-none transition ${open ? "border-cyan-400/45 ring-2 ring-cyan-400/[0.07]" : "border-slate-800 hover:border-slate-700"}`}>
            <span>{(options.find((option) => (typeof option === "string" ? option : option.value) === value)?.label || value).replaceAll("_", " ")}</span><ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${open ? "rotate-180 text-cyan-300" : ""}`} />
        </button>
        {open && <div role="listbox" className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-white/[0.09] bg-[#07111f] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,.6)]">
            {options.map((option) => {
                const optionValue = typeof option === "string" ? option : option.value;
                const optionLabel = typeof option === "string" ? option.replaceAll("_", " ") : option.label;
                const selected = optionValue === value;
                return <button key={optionValue} type="button" role="option" aria-selected={selected} onClick={() => { onChange({ target: { name, value: optionValue } }); setOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition ${selected ? "bg-cyan-400/10 text-cyan-200" : "text-slate-300 hover:bg-white/[0.05] hover:text-white"}`}><span>{optionLabel}</span>{selected && <Check className="h-3.5 w-3.5 text-cyan-300" />}</button>;
            })}
        </div>}
    </div>;
};

const VesselModal = ({ form, ports, editing, busy, error, onChange, onClose, onSubmit }) => {
    const [closing, setClosing] = useState(false);
    const requestClose = useCallback(() => {
        if (busy || closing) return;
        setClosing(true);
        window.setTimeout(onClose, 260);
    }, [busy, closing, onClose]);
    useDialogLifecycle(requestClose);
    return createPortal(
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }} className={`ma-drawer-backdrop fixed inset-0 z-[2200] flex justify-end bg-slate-950/70 backdrop-blur-[3px] ${closing ? "ma-drawer-backdrop-out" : ""}`}>
            <aside role="dialog" aria-modal="true" aria-label={editing ? "Edit vessel" : "Add vessel"} className={`ma-drawer-panel marine-scrollbar flex h-full w-full max-w-2xl flex-col overflow-y-auto overscroll-contain border-l border-white/[0.08] bg-[#08111f] shadow-[-28px_0_100px_rgba(0,0,0,.55)] ${closing ? "ma-drawer-panel-out" : ""}`}>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#08111f]/95 px-5 py-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Ship className="h-5 w-5" /></div><div><h2 className="text-base font-semibold text-white">{editing ? "Edit Vessel" : "Add New Vessel"}</h2><p className="mt-0.5 text-[10px] text-slate-500">Identity, navigation and operational status</p></div></div>
                    <button type="button" aria-label="Close vessel form" onClick={requestClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={onSubmit} className="space-y-5 p-5">
                    {error && <div className="rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-xs text-red-300">{error}</div>}
                    <section><h3 className="mb-3 text-xs font-semibold text-slate-200">Vessel identity</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <FormField label="Vessel name" required name="name" value={form.name} onChange={onChange} placeholder="MV MarineAegis" />
                        <FormField label="Vessel ID" required name="vesselId" value={form.vesselId} onChange={onChange} placeholder="VSL-001" />
                        <FormField label="IMO number" required name="imoNumber" value={form.imoNumber} onChange={onChange} placeholder="9876543" />
                        <FormSelect label="Vessel type" name="vesselType" value={form.vesselType} onChange={onChange} options={VESSEL_TYPES} />
                        <FormField label="Captain" name="captain" value={form.captain} onChange={onChange} placeholder="Captain name" />
                    </div></section>
                    <section><h3 className="mb-3 text-xs font-semibold text-slate-200">Operational state</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <FormSelect label="Status" name="status" value={form.status} onChange={onChange} options={VESSEL_STATUSES} />
                        <FormField label="Risk score" type="number" min="0" max="100" name="riskScore" value={form.riskScore} onChange={onChange} />
                        <FormSelect label="Risk level" name="riskLevel" value={form.riskLevel} onChange={onChange} options={RISK_LEVELS} />
                        <FormField label="Speed (kn)" type="number" min="0" step="0.1" name="speed" value={form.speed} onChange={onChange} />
                    </div></section>
                    <section><div className="mb-3"><h3 className="text-xs font-semibold text-slate-200">Marine route planner</h3><p className="mt-1 text-[10px] text-slate-500">Choose ports to fill verified approach coordinates automatically. MarineAegis generates sea-corridor waypoints between them.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <FormSelect label="Origin port" name="originPort" value={form.originPort} onChange={onChange} options={ports.map((port) => ({ value: port.key, label: port.name }))} />
                        <FormSelect label="Destination port" name="destinationPort" value={form.destinationPort} onChange={onChange} options={ports.map((port) => ({ value: port.key, label: port.name }))} />
                        <FormField label="Start latitude" readOnly type="number" name="latitude" value={form.latitude} onChange={onChange} />
                        <FormField label="Start longitude" readOnly type="number" name="longitude" value={form.longitude} onChange={onChange} />
                        <FormField label="Heading" type="number" min="0" max="360" step="0.1" name="heading" value={form.heading} onChange={onChange} />
                        <FormField label="Destination latitude" readOnly type="number" name="destinationLatitude" value={form.destinationLatitude} onChange={onChange} />
                        <FormField label="Destination longitude" readOnly type="number" name="destinationLongitude" value={form.destinationLongitude} onChange={onChange} />
                    </div></section>
                    <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-2 border-t border-white/[0.07] bg-[#08111f]/95 px-5 py-4 backdrop-blur-xl">
                        <button type="button" disabled={busy} onClick={requestClose} className="rounded-lg border border-slate-700 px-4 py-2.5 text-xs text-slate-400">Cancel</button>
                        <button type="submit" disabled={busy} className="flex min-w-28 items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-4 py-2.5 text-xs font-semibold text-cyan-200 disabled:opacity-50">{busy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{editing ? "Save Changes" : "Add Vessel"}</button>
                    </div>
                </form>
            </aside>
        </div>,
        document.body
    );
};

const DeleteVesselModal = ({ vessel, busy, onClose, onConfirm }) => {
    useDialogLifecycle(onClose);
    return createPortal(
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 z-[2300] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div role="alertdialog" aria-modal="true" aria-label="Remove vessel" className="w-full max-w-md rounded-2xl border border-red-400/15 bg-[#08111f] p-5 shadow-2xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-red-300"><Trash2 className="h-5 w-5" /></div>
                <h2 className="mt-4 text-base font-semibold text-white">Remove vessel from fleet?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400"><span className="font-medium text-slate-200">{vessel.name}</span> will no longer appear in active fleet views. Historical security records are preserved.</p>
                <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2.5 text-xs text-slate-400">Cancel</button><button type="button" disabled={busy} onClick={onConfirm} className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-xs font-semibold text-red-300 disabled:opacity-50">{busy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}Remove Vessel</button></div>
            </div>
        </div>,
        document.body
    );
};

export default FleetOverview;
