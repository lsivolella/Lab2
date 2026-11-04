import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthProvider';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PublicOnly, RequireAuth } from './routes/guards';

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
        children: [{ path: '/', element: <HomePage /> }],
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
