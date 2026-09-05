import {
    Activity,
    Cpu,
    Navigation,
    ShieldCheck,
    Ship,
    Zap,
} from "lucide-react";

const DigitalTwinStatus = () => {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden h-full">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div>
                    <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400" />

                        <h2 className="text-sm font-semibold text-white">
                            Digital Twin Status
                        </h2>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-1">
                        Live vessel simulation environment
                    </p>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE SIMULATION
                </div>
            </div>

            {/* Ship Visualization */}
            <div className="relative h-[220px] overflow-hidden bg-[#03111f]">

                {/* Grid */}
                <div
                    className="absolute inset-0 opacity-25"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(34,211,238,0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(34,211,238,0.15) 1px, transparent 1px)
                        `,
                        backgroundSize: "32px 32px",
                    }}
                />

                {/* Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(6,182,212,0.14),transparent_55%)]" />

                {/* Water Lines */}
                <div className="absolute left-0 right-0 bottom-8 h-px bg-cyan-400/10" />
                <div className="absolute left-0 right-0 bottom-14 h-px bg-cyan-400/10" />
                <div className="absolute left-0 right-0 bottom-20 h-px bg-cyan-400/10" />

                {/* Ship */}
                <div className="absolute inset-0 flex items-center justify-center">

                    <div className="relative">

                        {/* Outer scanning ring */}
                        <div className="absolute -inset-12 rounded-full border border-cyan-400/10 animate-pulse" />

                        <div className="absolute -inset-8 rounded-full border border-cyan-400/10" />

                        {/* Ship */}
                        <div className="relative w-36 h-20">

                            {/* Hull */}
                            <div
                                className="absolute left-2 right-2 bottom-2 h-8 border-2 border-cyan-400/70 bg-cyan-400/5"
                                style={{
                                    clipPath:
                                        "polygon(5% 0, 95% 0, 82% 100%, 18% 100%)",
                                }}
                            />

                            {/* Main body */}
                            <div className="absolute left-10 bottom-10 w-20 h-9 border border-cyan-400/60 bg-cyan-400/5 rounded-sm" />

                            {/* Bridge */}
                            <div className="absolute left-16 bottom-[4.25rem] w-10 h-6 border border-cyan-400/50 bg-cyan-400/5" />

                            {/* Mast */}
                            <div className="absolute left-20 bottom-[5.7rem] w-px h-6 bg-cyan-400/60" />

                            {/* Containers */}
                            <div className="absolute left-12 bottom-[2.9rem] flex gap-1">
                                <span className="w-3 h-3 border border-cyan-400/40" />
                                <span className="w-3 h-3 border border-cyan-400/40" />
                                <span className="w-3 h-3 border border-cyan-400/40" />
                                <span className="w-3 h-3 border border-cyan-400/40" />
                            </div>

                            <div className="absolute left-12 bottom-[1.9rem] flex gap-1">
                                <span className="w-3 h-3 border border-cyan-400/30" />
                                <span className="w-3 h-3 border border-cyan-400/30" />
                                <span className="w-3 h-3 border border-cyan-400/30" />
                                <span className="w-3 h-3 border border-cyan-400/30" />
                            </div>

                        </div>

                        {/* Scanning points */}
                        <span className="absolute -top-3 left-5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                        <span className="absolute top-5 -right-4 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />

                    </div>

                </div>

                {/* Simulation badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-slate-950/80 px-3 py-2">
                    <Ship className="w-3.5 h-3.5 text-cyan-400" />

                    <div>
                        <p className="text-[10px] text-white font-medium">
                            MV Samudra
                        </p>

                        <p className="text-[9px] text-slate-500">
                            VSL-001
                        </p>
                    </div>
                </div>

                {/* Status */}
                <div className="absolute top-4 right-4">
                    <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                        OPERATIONAL
                    </span>
                </div>

            </div>

            {/* Simulation Information */}
            <div className="grid grid-cols-2 gap-3 p-4">

                <TwinItem
                    icon={Activity}
                    label="Simulation Time"
                    value={new Date().toLocaleTimeString()}
                />

                <TwinItem
                    icon={Navigation}
                    label="Scenario"
                    value="Normal Operations"
                />

                <TwinItem
                    icon={Zap}
                    label="Navigation Model"
                    value="Active"
                />

                <TwinItem
                    icon={ShieldCheck}
                    label="Threat Engine"
                    value="Ready"
                />

            </div>

            {/* Engine / AI status */}
            <div className="px-4 pb-4">

                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">

                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">
                            Simulation Health
                        </span>

                        <span className="text-[10px] text-emerald-400">
                            96%
                        </span>
                    </div>

                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: "96%" }}
                        />
                    </div>

                </div>

            </div>

        </div>
    );
};

const TwinItem = ({ icon: Icon, label, value }) => {
    return (
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">

            <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-cyan-400" />

                <span className="text-[9px] text-slate-500">
                    {label}
                </span>
            </div>

            <p className="text-xs text-white mt-2">
                {value}
            </p>

        </div>
    );
};

export default DigitalTwinStatus;