/**
 * App — Root component
 * --------------------
 * Route structure:
 *   <Layout> wraps all pages with Navbar + Footer.
 *
 *   Public routes (anyone):
 *     /             → Home
 *
 *   Public-only routes (logged OUT only):
 *     /login        → Login
 *     /register     → Register
 *
 *   Protected routes (logged IN only):
 *     /dashboard    → Dashboard
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

function App() {
  return (
    <BrowserRouter>
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

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;