import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SelectBranchePage } from "@/features/auth/pages/SelectBranchePage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { SalesPage } from "@/features/sales/pages/SalesPage";
import { MainLayout } from "@/layouts/MainLayout";
import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { UsersPage } from "@/features/users/pages/UsersPage";
import { CorporativeConfigPage } from "@/features/core/pages/CorporativeConfigPage";

export const AppRouter = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={"/dashboard"} replace></Navigate>}
      ></Route>

      <Route path="/auth/login" element={<LoginPage></LoginPage>}></Route>

      <Route element={<PrivateRoute></PrivateRoute>}>
        <Route
          path="/auth/select-branch"
          element={<SelectBranchePage></SelectBranchePage>}
        ></Route>

        <Route element={<MainLayout></MainLayout>}>
          <Route
            path="/dashboard"
            element={<DashboardPage></DashboardPage>}
          ></Route>
          <Route path="/users" element={<UsersPage></UsersPage>}></Route>
          <Route path="/sales" element={<SalesPage></SalesPage>}></Route>

          <Route
            path="/configuracion"
            element={
              <Navigate to={"/configuracion/sucursales"} replace></Navigate>
            }
          ></Route>
          <Route
            path="/configuracion/:tab"
            element={<CorporativeConfigPage></CorporativeConfigPage>}
          ></Route>
        </Route>
      </Route>
    </Routes>
  );
};
