import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { CarsPage } from './pages/CarsPage';
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/OrdersPage';
import { RegisterPage } from './pages/RegisterPage';
import { PublicOnly, RequireAuth } from './routes/guards';

/** "/" opens the main page of each role. */
function RoleHome() {
    const { user } = useAuth();

    return (
        <Navigate
            to={user?.role === 'AGENT' ? '/pedidos' : '/carros'}
            replace
        />
    );
}

const router = createBrowserRouter([
    {
        element: <PublicOnly />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/cadastro', element: <RegisterPage /> },
        ],
    },
    {
        element: <RequireAuth />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { path: '/', element: <RoleHome /> },
                    { path: '/carros', element: <CarsPage /> },
                    { path: '/pedidos', element: <OrdersPage /> },
                ],
            },
        ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    );
}
