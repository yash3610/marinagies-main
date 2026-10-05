import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Satellite, WifiOff } from "lucide-react";
import api from "../../services/api";

const ConnectivityBanner = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const response = await api.get("/connectivity");
                if (active) setData(response.data);
            } catch {
                // Connectivity polling must not block the rest of the dashboard.
            }
        };
        load();
        const timer = window.setInterval(load, 15000);
        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, []);

    const mode = data?.state?.mode;
    if (!mode || mode === "CONNECTED") return null;
    const pending = (data.queue?.pending || 0) + (data.queue?.failed || 0);
    const Icon = mode === "OFFLINE" ? WifiOff : Satellite;

    return <Link to="/dashboard/connectivity" className={`flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2 text-xs md:px-7 ${mode === "OFFLINE" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
        <span className="flex min-w-0 items-center gap-2"><Icon className="h-4 w-4 shrink-0" /><span className="truncate">Satellite link: <strong>{mode}</strong>. Local protection remains active.</span></span>
        <span className="shrink-0 font-semibold">{pending} queued</span>
    </Link>;
};

export default ConnectivityBanner;
