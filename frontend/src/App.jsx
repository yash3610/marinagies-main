import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import FleetOverview from "./pages/FleetOverview";
import NavigationMap from "./pages/NavigationMap";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="fleet" element={<FleetOverview />} />
          <Route path="navigation" element={<NavigationMap />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;