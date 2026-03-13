import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: string[]; // Optional roles prop to restrict access based on user roles
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Show a loading state while checking auth
    }
    if (!user) {
        return <Navigate to="/login" replace />; // Redirect to login if not authenticated
    }
    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" />; // Redirect if user doesn't have required role
    }
    return <>{children}</>; // Render children if authenticated and authorized
}
