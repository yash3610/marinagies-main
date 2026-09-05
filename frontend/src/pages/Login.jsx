import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Anchor, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
    const navigate = useNavigate();
    const { login, loading } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please enter email and password.");
            return;
        }

        const result = await login(email, password);

        if (result.success) {
            navigate("/dashboard");
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex items-center justify-center px-4 relative overflow-hidden">

            {/* Background Glow */}
            <div className="absolute top-[-150px] left-[-150px] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />

            <div className="w-full max-w-md relative z-10">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 mb-4">
                        <Anchor className="w-8 h-8 text-cyan-400" />
                    </div>

                    <h1 className="text-3xl font-bold tracking-wider text-white">
                        MARINE<span className="text-cyan-400">AEGIS</span>
                    </h1>

                    <p className="text-slate-400 mt-2 text-sm">
                        Autonomous Maritime Cyber Defense
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-7 shadow-2xl">

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Secure Login
                            </h2>
                            <p className="text-xs text-slate-500">
                                Authorized personnel only
                            </p>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label className="block text-sm text-slate-300 mb-2">
                                Email Address
                            </label>

                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@marineaegis.com"
                                    className="w-full bg-slate-950/70 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-slate-300 mb-2">
                                Password
                            </label>

                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full bg-slate-950/70 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition"
                                />
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-800 disabled:cursor-not-allowed text-slate-950 font-semibold transition"
                        >
                            {loading ? "Authenticating..." : "Sign In"}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 pt-5 border-t border-slate-800">
                        <p className="text-xs text-slate-500 mb-2">
                            Demo credentials
                        </p>

                        <div className="text-xs text-slate-400 space-y-1">
                            <p>
                                Email:{" "}
                                <span className="text-cyan-400">
                                    admin@marineaegis.com
                                </span>
                            </p>

                            <p>
                                Password:{" "}
                                <span className="text-cyan-400">
                                    Marine@123
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    MARINEAEGIS Security Operations Platform
                </p>
            </div>
        </div>
    );
};

export default Login;