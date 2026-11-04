// Mirrors the backend DTOs in com.lucas.rentacar.dto.user and dto.auth.

export type Role = 'CUSTOMER' | 'AGENT';

export type AgentType = 'COMPANY' | 'BANK';

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    role: Role;
    /** Null for customers. agent.id matches car.owner.id for company agents. */
    agent: { id: number; type: AgentType } | null;
}

export interface LoginRequest {
    email: string;
    password: string;
}
