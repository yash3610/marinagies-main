import { Outlet } from "react-router-dom";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import ConnectivityBanner from "../components/dashboard/ConnectivityBanner";

const DashboardLayout = () => (
    <div className="h-screen overflow-hidden bg-[#020617] text-slate-200 flex">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 h-screen flex flex-col">
            <DashboardHeader />
            <ConnectivityBanner />
            <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin] [scrollbar-color:#0891b2_#07111f] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:border-l [&::-webkit-scrollbar-track]:border-slate-800/70 [&::-webkit-scrollbar-track]:bg-[#07111f] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-[#07111f] [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-cyan-400 [&::-webkit-scrollbar-thumb]:to-blue-600 hover:[&::-webkit-scrollbar-thumb]:from-cyan-300 hover:[&::-webkit-scrollbar-thumb]:to-blue-500">
                <Outlet />
            </div>
        </main>
    </div>
);

export default DashboardLayout;
