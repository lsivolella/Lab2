import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import * as authApi from '../api/auth';
import type { RegisterRequest } from '../types/customer';
import type { LoginRequest, UserResponse } from '../types/user';
import { AuthContext, type AuthContextValue } from './AuthContext';

/**
 * Keeps the logged-in user for the whole app. The session itself lives in the
 * backend (JSESSIONID cookie); on page load the user is read from
 * GET /api/users/me, which answers 401 when there is no session.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authApi
            .fetchCurrentUser()
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (request: LoginRequest) => {
        const loggedIn = await authApi.login(request);
        setUser(loggedIn);
        return loggedIn;
    }, []);

    const register = useCallback(
        async (request: RegisterRequest) => {
            await authApi.register(request);
            return login({ email: request.email, password: request.password });
        },
        [login],
    );

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } finally {
            setUser(null);
        }
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({ user, loading, login, register, logout }),
        [user, loading, login, register, logout],
    );

    return <AuthContext value={value}>{children}</AuthContext>;
}
