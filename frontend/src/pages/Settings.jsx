import { Settings as SettingsIcon, ShieldCheck, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const Settings = () => {
    const { user } = useAuth();
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
        </div>
    );
};

export default Settings;
