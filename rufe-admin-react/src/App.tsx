import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "@/lib/auth";

// Import Admin Pages
import LoginPage from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";        // ← Create if not exists
import ProductsPage from "@/pages/Products";
import OrdersPage from "@/pages/Orders";
import CategoriesPage from "@/pages/Categories";
import BannersPage from "@/pages/Banners";
import ReviewsPage from "@/pages/Reviews";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Admin Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/banners"
              element={
                <ProtectedRoute>
                  <BannersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reviews"
              element={
                <ProtectedRoute>
                  <ReviewsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/temp"
              element={
                <ProtectedRoute>
                  <div>Temp Page</div>
                </ProtectedRoute>
              }
            />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              color: "#1F2937",
              border: "1px solid #E5E0D8",
              borderRadius: "16px",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            },
            success: {
              iconTheme: { primary: "#D4AF37", secondary: "#FFFFFF" },
            },
            error: {
              iconTheme: { primary: "#9F1239", secondary: "#FFFFFF" },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}