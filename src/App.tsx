import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

// Auth Pages
import Login from "./pages/auth/Login";
import AdminLogin from "./pages/auth/AdminLogin";

// Patient Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import Medicines from "./pages/patient/Medicines";
import Cart from "./pages/patient/Cart";
import Appointments from "./pages/patient/Appointments";
import Consultation from "./pages/patient/Consultation";
import History from "./pages/patient/History";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorConsultation from "./pages/doctor/DoctorConsultation";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMedicines from "./pages/admin/AdminMedicines";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminChatbot from "./pages/admin/AdminChatbot";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Components
const PatientRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role !== 'patient') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const DoctorRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role !== 'doctor') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        isAuthenticated && user?.role === 'patient' ? <Navigate to="/patient/dashboard" replace /> :
        isAuthenticated && user?.role === 'doctor' ? <Navigate to="/doctor/dashboard" replace /> :
        <Login />
      } />
      <Route path="/admin/login" element={
        isAuthenticated && user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
        <AdminLogin />
      } />

      {/* Patient Routes */}
      <Route path="/patient/dashboard" element={<PatientRoute><PatientDashboard /></PatientRoute>} />
      <Route path="/patient/medicines" element={<PatientRoute><Medicines /></PatientRoute>} />
      <Route path="/patient/cart" element={<PatientRoute><Cart /></PatientRoute>} />
      <Route path="/patient/appointments" element={<PatientRoute><Appointments /></PatientRoute>} />
      <Route path="/patient/consultation" element={<PatientRoute><Consultation /></PatientRoute>} />
      <Route path="/patient/history" element={<PatientRoute><History /></PatientRoute>} />

      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={<DoctorRoute><DoctorDashboard /></DoctorRoute>} />
      <Route path="/doctor/appointments" element={<DoctorRoute><DoctorAppointments /></DoctorRoute>} />
      <Route path="/doctor/consultation" element={<DoctorRoute><DoctorConsultation /></DoctorRoute>} />
      <Route path="/doctor/prescriptions" element={<DoctorRoute><DoctorPrescriptions /></DoctorRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/medicines" element={<AdminRoute><AdminMedicines /></AdminRoute>} />
      <Route path="/admin/doctors" element={<AdminRoute><AdminDoctors /></AdminRoute>} />
      <Route path="/admin/appointments" element={<AdminRoute><AdminAppointments /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/chatbot" element={<AdminRoute><AdminChatbot /></AdminRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
