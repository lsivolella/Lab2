import type {
    OrderStatus,
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
