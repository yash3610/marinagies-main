import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import api from "../services/api";
export default function RequireAuth() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    if (!localStorage.getItem("marineaegis_token")) {
      window.location.replace("/login");
      return;
    }
    api.get("/auth/me").then(() => { if (active) setReady(true); }).catch((err) => {
      if (!active) return;
      if ([401, 403, 404].includes(err.response?.status)) {
        localStorage.removeItem("marineaegis_token");
        localStorage.removeItem("marineaegis_user");
        window.location.replace("/login");
      } else setError(true);
    });
    return () => { active = false; };
  }, []);
  if (error) return <div className="p-8 text-slate-200">Unable to connect. <button onClick={() => window.location.reload()}>Retry</button></div>;
  return ready ? <Outlet /> : null;
}
