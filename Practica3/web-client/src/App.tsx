import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Catalog from "./pages/Catalog";
import ClassDetail from "./pages/ClassDetail";
import Player from "./pages/Player";
import EnrollmentPanel from "./pages/EnrollmentPanel";
import AccountSettings from "./pages/AccountSettings";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminSchools from "./pages/admin/AdminSchools";
import AdminSemesters from "./pages/admin/AdminSemesters";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminProfessors from "./pages/admin/AdminProfessors";
import AdminCsvUpload from "./pages/admin/AdminCsvUpload";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import NavBar from "./components/NavBar";

const ADMIN_ROLES = ["ROLE_ADMIN", "ROLE_CATEDRATICO", "ROLE_AUXILIAR"];

// Enrutamiento del cliente web. Cada ruta corresponde a uno de los
// mockups requeridos por el enunciado del proyecto, más el Panel Web de
// Administración (RBAC) agregado en la Práctica 3.
export default function App() {
  return (
    <AuthProvider>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/clase/:id" element={<ClassDetail />} />
        <Route path="/reproductor/:id" element={<Player />} />
        <Route path="/mis-cursos" element={<EnrollmentPanel />} />
        <Route path="/cuenta" element={<AccountSettings />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={ADMIN_ROLES}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="schools" replace />} />
          <Route path="schools" element={<AdminSchools />} />
          <Route path="semesters" element={<AdminSemesters />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="professors" element={<AdminProfessors />} />
          <Route path="csv" element={<AdminCsvUpload />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
