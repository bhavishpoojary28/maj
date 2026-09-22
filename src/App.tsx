import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { ToastProvider } from './lib/toast';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Otp from './pages/Otp';
import Dashboard from './pages/Dashboard';
import Fittings from './pages/Fittings';
import QrGenerator from './pages/QrGenerator';
import QrScanner from './pages/QrScanner';
import AiInspectionPage from './pages/AiInspection';
import Maintenance from './pages/Maintenance';
import Complaints from './pages/Complaints';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import About from './pages/About';
import Architecture from './pages/Architecture';
import Modules from './pages/Modules';
import TechStack from './pages/TechStack';
import AiWorkflow from './pages/AiWorkflow';
import QrLifecycle from './pages/QrLifecycle';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/otp" element={<Otp />} />
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/fittings" element={<ProtectedRoute><Layout><Fittings /></Layout></ProtectedRoute>} />
              <Route path="/qr-generator" element={<ProtectedRoute><Layout><QrGenerator /></Layout></ProtectedRoute>} />
              <Route path="/scanner" element={<ProtectedRoute><Layout><QrScanner /></Layout></ProtectedRoute>} />
              <Route path="/inspection" element={<ProtectedRoute><Layout><AiInspectionPage /></Layout></ProtectedRoute>} />
              <Route path="/maintenance" element={<ProtectedRoute><Layout><Maintenance /></Layout></ProtectedRoute>} />
              <Route path="/complaints" element={<ProtectedRoute><Layout><Complaints /></Layout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
              <Route path="/about" element={<ProtectedRoute><Layout><About /></Layout></ProtectedRoute>} />
              <Route path="/architecture" element={<ProtectedRoute><Layout><Architecture /></Layout></ProtectedRoute>} />
              <Route path="/modules" element={<ProtectedRoute><Layout><Modules /></Layout></ProtectedRoute>} />
              <Route path="/tech-stack" element={<ProtectedRoute><Layout><TechStack /></Layout></ProtectedRoute>} />
              <Route path="/ai-workflow" element={<ProtectedRoute><Layout><AiWorkflow /></Layout></ProtectedRoute>} />
              <Route path="/qr-lifecycle" element={<ProtectedRoute><Layout><QrLifecycle /></Layout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
