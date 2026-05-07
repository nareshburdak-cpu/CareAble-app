/**
 * App — Root component
 * --------------------
 * Route structure:
 *   <Layout> wraps all main pages with Navbar + Footer.
 *
 *   Public routes (anyone):
 *     /                       → Home
 *     /verify/:certificateId  → VerifyCertificate (Phase 14: QR landing page)
 *
 *   Public-only routes (logged OUT only):
 *     /login        → Login
 *     /register     → Register
 *
 *   Protected routes (logged IN only):
 *     /dashboard    → Dashboard
 *
 *   Admin routes (role-gated, own layout):
 *     /admin-x7k9p  → Admin panel
 *
 *   Catch-all:
 *     *             → NotFound
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyCertificate from "./pages/VerifyCertificate"; // Phase 14: public QR landing page
import AdminRoute from "./components/AdminRoute";
import EmployerRoute from "./components/EmployerRoute";
import EmployerDashboard from "./pages/EmployerDashboard";
import AdminLayout from "./components/AdminLayout";
import Analytics from "./pages/admin/Analytics";
import Users from "./pages/admin/Users";
import Questions from "./pages/admin/Questions";
import Categories from "./pages/admin/Categories";
import Audit from "./pages/admin/Audit";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
     <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            background: "#1a202c",
            color: "#fff",
          },
        }}
      />

      <Routes>
        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<Home />} />

          {/* Phase 14: Public certificate verification page (QR landing) — no auth required */}
          <Route path="/verify/:certificateId" element={<VerifyCertificate />} />

          {/* Public-only (redirect away if logged in) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route 
            path="/about" 
            element={
            <About />
            }
          />

          <Route 
            path="/privacy" 
            element={
            <Privacy />
            }
          />

          <Route 
            path="/terms" 
            element={
            <Terms />
            }
          />

          <Route 
            path="/contact" 
            element={
            <Contact />
            }
          />
          <Route 
            path="/forgot-password" 
            element={
            <ForgotPassword />
            }
             />
          <Route 
            path="/reset-password" 
            element={
            <ResetPassword />
            }
             />

          <Route
            path="/verify-email"
            element={
           <VerifyEmail />  
            }
          />


          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />



          {/* Protected (must be logged in) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={<ProtectedRoute><Profile /></ProtectedRoute>}
          />

          <Route
            path="/assessment"
            element={
              <ProtectedRoute>
                <Assessment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:id"
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/dashboard"
            element={
              <EmployerRoute>
                <EmployerDashboard />
              </EmployerRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin-x7k9p" element={<AdminLayout />}>
            <Route index element={<Analytics />} />
            <Route path="users" element={<Users />} />
            <Route path="questions" element={<Questions />} />
            <Route path="categories" element={<Categories />} />
            <Route path="audit" element={<Audit />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;