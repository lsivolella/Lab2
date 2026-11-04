// Mirrors the backend DTOs in com.lucas.rentacar.dto.user and dto.auth.

export type Role = 'CUSTOMER' | 'AGENT';

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    role: Role;
}

export interface LoginRequest {
    email: string;
    password: string;
}
