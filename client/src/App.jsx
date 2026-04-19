import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ResearchPage from './pages/ResearchPage';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ResearcherDashboard from './pages/ResearcherDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to={`/${user.role}`} replace />;
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<DashboardLayout />}>
             <Route path="/patient" element={
                <ProtectedRoute allowedRole="patient"><PatientDashboard /></ProtectedRoute>
             } />
             <Route path="/doctor" element={
                <ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>
             } />
             <Route path="/researcher" element={
                <ProtectedRoute allowedRole="researcher"><ResearcherDashboard /></ProtectedRoute>
             } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
