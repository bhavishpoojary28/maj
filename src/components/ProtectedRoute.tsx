import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { Role } from '../lib/supabase';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (roles && (!profile || !roles.includes(profile.role))) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
