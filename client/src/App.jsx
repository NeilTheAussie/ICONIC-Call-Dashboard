import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import ViewerDashboard from './pages/ViewerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PaymentDashboard from './pages/PaymentDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-bg"><div className="text-pur text-xl">Loading...</div></div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'viewer') return <Navigate to="/viewer" />;
  if (user.role === 'manager') return <Navigate to="/manager" />;
  return <Navigate to="/admin" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/manager" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/viewer" element={<ProtectedRoute allowedRoles={['viewer']}><ViewerDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><PaymentDashboard /></ProtectedRoute>} />
    </Routes>
  );
}
