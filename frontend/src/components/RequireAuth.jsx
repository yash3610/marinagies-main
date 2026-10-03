import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DashboardShellSkeleton from "./dashboard/DashboardShellSkeleton";
export default function RequireAuth() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const { refreshUser } = useAuth();
  useEffect(() => {
    let active = true;
    refreshUser().then(() => { if (active) setReady(true); }).catch((err) => {
      if (!active) return;
      if ([401, 403, 404].includes(err.response?.status)) {
        localStorage.removeItem("marineaegis_user");
        window.location.replace("/login");
      } else setError(true);
    });
    return () => { active = false; };
  }, [refreshUser]);
  if (error) return <div className="p-8 text-slate-200">Unable to connect. <button onClick={() => window.location.reload()}>Retry</button></div>;
  return ready ? <Outlet /> : <DashboardShellSkeleton />;
}
