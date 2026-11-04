import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';

function FullPageSpinner() {
    return (
        <div className="grid min-h-svh place-items-center">
            <span
                className="size-10 animate-spin rounded-full border-4 border-cream-200 border-t-brand-400"
                role="status"
                aria-label="Carregando"
            />
        </div>
    );
}

/** Pages that need a logged-in user; others are sent to /login. */
export function RequireAuth() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <FullPageSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}

/** Login and registration: a logged-in user goes straight to the app. */
export function PublicOnly() {
    const { user, loading } = useAuth();

    if (loading) {
        return <FullPageSpinner />;
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
