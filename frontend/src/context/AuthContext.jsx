import { useCallback, useState } from "react";
import api from "../services/api";
import { AuthContext } from "./auth-context";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("marineaegis_user");

        if (savedUser) {
            try {
                return JSON.parse(savedUser);
            } catch {
                localStorage.removeItem("marineaegis_user");
                return null;
            }
        }

        return null;
    });

    const [loading, setLoading] = useState(false);

    const storeUser = useCallback((nextUser) => {
        if (nextUser) {
            localStorage.setItem(
                "marineaegis_user",
                JSON.stringify(nextUser)
            );
        } else {
            localStorage.removeItem("marineaegis_user");
        }
        setUser(nextUser);
    }, []);

    const refreshUser = useCallback(async () => {
        const response = await api.get("/auth/me");
        const nextUser = response.data?.user || null;
        storeUser(nextUser);
        return nextUser;
    }, [storeUser]);

    const login = async (email, password) => {
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email,
                password,
            });
            const { user } = response.data;
            storeUser(user);

            return {
                success: true,
                user,
            };
        } catch (error) {
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Login failed. Please try again.",
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            storeUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                refreshUser,
                hasPermission: (permission) =>
                    Boolean(user?.permissions?.includes(permission)),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
