import type { RegisterRequest } from '../types/customer';
import type { LoginRequest, UserResponse } from '../types/user';
import { api } from './client';

/** Current user of the session, or 401 (ApiError) when logged out. */
export function fetchCurrentUser(): Promise<UserResponse> {
    return api<UserResponse>('/users/me');
}

export function login(request: LoginRequest): Promise<UserResponse> {
    return api<UserResponse>('/auth/login', { method: 'POST', body: request });
}

export function logout(): Promise<void> {
    return api<void>('/auth/logout', { method: 'POST' });
}

export function register(request: RegisterRequest): Promise<UserResponse> {
    return api<UserResponse>('/auth/register', {
        method: 'POST',
        body: request,
    });
}

/** Works for customers and agents; requires the current password. */
export function changePassword(
    currentPassword: string,
    newPassword: string,
): Promise<void> {
    return api<void>('/users/me/password', {
        method: 'PATCH',
        body: { currentPassword, newPassword },
    });
}
