import { Outlet } from "react-router-dom";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

const DashboardLayout = () => (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex">
        <DashboardSidebar />
        <main className="flex-1 min-w-0">
            <DashboardHeader />
            <div className="p-6">
                <Outlet />
            </div>
        </main>
    </div>
);

export default DashboardLayout;
