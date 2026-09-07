import { Outlet } from "react-router-dom";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

const DashboardLayout = () => (
    <div className="h-screen overflow-hidden bg-[#020617] text-slate-200 flex">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 h-screen flex flex-col">
            <DashboardHeader />
            <div className="flex-1 overflow-y-auto p-6">
                <Outlet />
            </div>
        </main>
    </div>
);

export default DashboardLayout;
