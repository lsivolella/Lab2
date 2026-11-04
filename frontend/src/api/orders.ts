import type {
    OrderEvaluationRequest,
    OrderStatus,
    OwnershipType,
    RentalOrderRequest,
    RentalOrderResponse,
} from '../types/order';
import type { Page } from '../types/page';
import { api } from './client';

/** Customers get their own orders; agents get all orders. Newest first. */
export function fetchOrders(
    status?: OrderStatus,
): Promise<Page<RentalOrderResponse>> {
    const query = status ? `&status=${status}` : '';

    return api<Page<RentalOrderResponse>>(`/orders?size=100${query}`);
}

export function createOrder(
    request: RentalOrderRequest,
): Promise<RentalOrderResponse> {
    return api<RentalOrderResponse>('/orders', {
        method: 'POST',
        body: request,
    });
}

export function updateOrder(
    id: number,
    request: RentalOrderRequest,
): Promise<RentalOrderResponse> {
    return api<RentalOrderResponse>(`/orders/${id}`, {
        method: 'PUT',
        body: request,
    });
}

export function cancelOrder(id: number): Promise<RentalOrderResponse> {
    return api<RentalOrderResponse>(`/orders/${id}/cancel`, {
        method: 'POST',
    });
}

/** Agent's financial opinion; banks approving a credit order send credit. */
export function evaluateOrder(
    id: number,
    request: OrderEvaluationRequest,
): Promise<RentalOrderResponse> {
    return api<RentalOrderResponse>(`/orders/${id}/evaluation`, {
        method: 'POST',
        body: request,
    });
}

/** The car owner company executes the contract of an approved order. */
export function executeContract(
    id: number,
    ownershipType: OwnershipType,
): Promise<RentalOrderResponse> {
    return api<RentalOrderResponse>(`/orders/${id}/contract`, {
        method: 'POST',
        body: { ownershipType },
    });
}
