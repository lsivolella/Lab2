import type {
    CustomerResponse,
    CustomerUpdateRequest,
} from '../types/customer';
import { api } from './client';

export function fetchMyProfile(): Promise<CustomerResponse> {
    return api<CustomerResponse>('/customers/me');
}

export function updateMyProfile(
    request: CustomerUpdateRequest,
): Promise<CustomerResponse> {
    return api<CustomerResponse>('/customers/me', {
        method: 'PUT',
        body: request,
    });
}

/** Soft-deletes the account; the backend also ends the session. */
export function deleteMyAccount(): Promise<void> {
    return api<void>('/customers/me', { method: 'DELETE' });
}
