import { Bell } from "lucide-react";

const DashboardHeader = () => (
    <header className="h-20 shrink-0 border-b border-slate-800 bg-[#07111f]/80 backdrop-blur-xl flex items-center justify-between px-7">
        <div>
            <h2 className="text-lg font-semibold text-white">Security Operations Center</h2>
            <p className="text-xs text-slate-500 mt-1">Autonomous Maritime Cyber Defense Platform</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">Systems Operational</span>
            </div>
            <button type="button" aria-label="Notifications" className="relative w-9 h-9 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400" />
            </button>
        </div>
    </header>
);

export default DashboardHeader;
