import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { ToastProvider } from "./components/ui/Toast";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import VehicleDetail from "./pages/VehicleDetail";
import VehicleForm from "./pages/VehicleForm";
import Maintenance from "./pages/Maintenance";
import Energy from "./pages/Energy";
import Expenses from "./pages/Expenses";
import Reminders from "./pages/Reminders";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Guard><Onboarding /></Guard>} />
            <Route path="/app" element={<Guard><AppLayout /></Guard>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="vehicles/new" element={<VehicleForm />} />
              <Route path="vehicles/:vehicleId" element={<VehicleDetail />} />
              <Route path="vehicles/:vehicleId/edit" element={<VehicleForm />} />
              <Route path="vehicles/:vehicleId/maintenance" element={<Maintenance />} />
              <Route path="vehicles/:vehicleId/energy" element={<Energy />} />
              <Route path="vehicles/:vehicleId/expenses" element={<Expenses />} />
              <Route path="vehicles/:vehicleId/documents" element={<Documents />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="energy" element={<Energy />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="documents" element={<Documents />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}
