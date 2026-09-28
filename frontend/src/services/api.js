import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

let refreshRequest = null;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const request = error.config;
        const status = error.response?.status;
        const url = String(request?.url || "");
        const isAuthAction =
            url.includes("/auth/login") ||
            url.includes("/auth/register") ||
            url.includes("/auth/refresh") ||
            url.includes("/auth/logout");

        if (status !== 401 || !request || request._retried || isAuthAction) {
            return Promise.reject(error);
        }

        request._retried = true;

        try {
            refreshRequest ||= axios.post(
                api.defaults.baseURL + "/auth/refresh",
                {},
                { withCredentials: true }
            );

            await refreshRequest;
            return api(request);
        } catch (refreshError) {
            localStorage.removeItem("marineaegis_user");
            return Promise.reject(refreshError);
        } finally {
            refreshRequest = null;
        }
    }
);

export default api;