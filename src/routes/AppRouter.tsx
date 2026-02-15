import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SelectBranchePage } from "@/features/auth/pages/SelectBranchePage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { SalesPage } from "@/features/sales/pages/SalesPage";
import { MainLayout } from "@/layouts/MainLayout";
import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";

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
          <Route path="/sales" element={<SalesPage></SalesPage>}></Route>
        </Route>
      </Route>
    </Routes>
  );
};
