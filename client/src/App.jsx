import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WorkspaceListPage from "./pages/WorkspaceListPage";
import WorkspaceViewPage from "./pages/WorkspaceViewPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <WorkspaceProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <WorkspaceListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspaces/:workspaceId"
                element={
                  <ProtectedRoute>
                    <WorkspaceViewPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WorkspaceProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
