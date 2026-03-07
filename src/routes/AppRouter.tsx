import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SelectWorkspacePage } from "@/features/auth/pages/SelectWorkspacePage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { SalesPage } from "@/features/sales/pages/SalesPage";
import { UsersPage } from "@/features/users/pages/UsersPage";
import { CorporativeConfigPage } from "@/features/core/pages/CorporativeConfigPage";
import { MainLayout } from "@/layouts/MainLayout";

import { PrivateRoute } from "./PrivateRoute";
import { ProductosPage } from "@/features/products";

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Private Routes */}
      <Route element={<PrivateRoute />}>
        <Route
          path="/auth/select-workspace"
          element={<SelectWorkspacePage />}
        />

        {/* Routes with sidebar and header */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route
            path="/products"
            element={<ProductosPage></ProductosPage>}
          ></Route>

          {/* Corporative Configuration */}
          <Route path="/configuracion">
            <Route index element={<Navigate to="sucursales" replace />} />
            <Route path=":tab" element={<CorporativeConfigPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
