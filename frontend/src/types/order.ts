// Mirrors com.lucas.rentacar.dto.order. Dates travel as ISO "YYYY-MM-DD".
import type { CarResponse } from './car';

export type OrderStatus =
    'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CONTRACTED' | 'CANCELLED';

export type OwnershipType = 'CUSTOMER' | 'COMPANY' | 'BANK';

export interface Party {
    id: number;
    name: string;
}

export interface CreditContract {
    id: number;
    bank: Party;
    amount: number;
    monthlyInterestRate: number;
    installments: number;
    installmentAmount: number;
    createdAt: string;
}

export interface Contract {
    id: number;
    ownershipType: OwnershipType;
    owner: Party;
    executedBy: Party;
    signedAt: string;
}

export interface RentalOrderResponse {
    id: number;
    status: OrderStatus;
    startDate: string;
    /** Return date: the rental is endDate - startDate days. */
    endDate: string;
    days: number;
    dailyRate: number;
    totalAmount: number;
    creditRequested: boolean;
    car: CarResponse;
    customer: Party;
    agentOpinion: string | null;
    evaluatedBy: Party | null;
    evaluatedAt: string | null;
    creditContract: CreditContract | null;
    contract: Contract | null;
    createdAt: string;
    updatedAt: string;
}

export interface OrderEvaluationRequest {
    approved: boolean;
    opinion: string;
    /** Required when a bank approves an order that requested credit. */
    credit?: {
        /** Percent per month, 0 to 20. */
        monthlyInterestRate: number;
        /** 1 to 60. */
        installments: number;
    };
}

export interface RentalOrderRequest {
    carId: number;
    startDate: string;
    endDate: string;
    creditRequested: boolean;
}
