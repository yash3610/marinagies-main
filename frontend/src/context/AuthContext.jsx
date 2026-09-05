import { createContext, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext(null);

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

    const login = async (email, password) => {
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email,
                password,
            });

            const { token, user } = response.data;

            localStorage.setItem("marineaegis_token", token);
            localStorage.setItem(
                "marineaegis_user",
                JSON.stringify(user)
            );

            setUser(user);

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

    const logout = () => {
        localStorage.removeItem("marineaegis_token");
        localStorage.removeItem("marineaegis_user");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};