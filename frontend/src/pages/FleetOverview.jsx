import { useEffect, useState } from "react";
import {
    Activity,
    AlertTriangle,
    Anchor,
    Search,
    Ship,
    Wifi,
    WifiOff,
} from "lucide-react";
import api from "../services/api";

const FleetOverview = () => {
    const [vessels, setVessels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
            <div>
                <div className="flex items-center gap-2">
                    <Anchor className="w-5 h-5 text-cyan-400" />

                    <h1 className="text-2xl font-semibold text-white">
                        Fleet Overview
                    </h1>
                </div>

                <p className="text-sm text-slate-500 mt-1">
                    Monitor and manage all registered vessels
                </p>
            </div>

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
                <div className="p-5 border-b border-slate-800">
                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-sm font-semibold text-white">
                                Registered Vessels
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                Current fleet status and navigation data
                            </p>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/50">
                            <Search className="w-4 h-4 text-slate-500" />

                            <span className="text-xs text-slate-600">
                                Search coming soon
                            </span>
                        </div>

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

                            </tr>
                        </thead>

                        <tbody>
                            {vessels.map((vessel) => (
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

                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>

                {/* Empty State */}
                {vessels.length === 0 && (
                    <div className="py-12 text-center">
                        <Ship className="w-8 h-8 text-slate-700 mx-auto mb-3" />

                        <p className="text-sm text-slate-500">
                            No vessels found
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default FleetOverview;