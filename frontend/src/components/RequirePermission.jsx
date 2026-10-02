import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RequirePermission({ permission, children }) {
    const { hasPermission } = useAuth();

    if (!hasPermission(permission)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
