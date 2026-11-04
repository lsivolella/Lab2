import { createContext } from 'react';
import type { RegisterRequest } from '../types/customer';
import type { LoginRequest, UserResponse } from '../types/user';

export interface AuthContextValue {
    /** Logged-in user, or null when logged out. */
    user: UserResponse | null;
    /** True while the session is being checked on page load. */
    loading: boolean;
    login: (request: LoginRequest) => Promise<UserResponse>;
    /** Registers a customer and logs in right after. */
    register: (request: RegisterRequest) => Promise<UserResponse>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
