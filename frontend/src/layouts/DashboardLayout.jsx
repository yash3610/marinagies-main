import { useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import ModernDashboardSidebar from "../components/dashboard/ModernDashboardSidebar";
import ConnectivityBanner from "../components/dashboard/ConnectivityBanner";

const DashboardLayout = () => {
    const [navigationOpen, setNavigationOpen] = useState(false);
    return (
    <div className="dashboard-frame flex h-screen overflow-hidden bg-[#050a12] text-slate-200">
        <ModernDashboardSidebar open={navigationOpen} onClose={() => setNavigationOpen(false)} />
        <main className="relative flex h-screen min-w-0 flex-1 flex-col">
            <DashboardHeader onMenu={() => setNavigationOpen(true)} />
            <ConnectivityBanner />
            <div className="dashboard-content marine-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
                <Outlet />
            </div>
        </main>
    </div>
    );
};

export default DashboardLayout;
