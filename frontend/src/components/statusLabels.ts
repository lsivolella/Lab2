import type { OrderStatus } from '../types/order';

export const STATUS_LABEL: Record<OrderStatus, string> = {
    SUBMITTED: 'Em análise',
    APPROVED: 'Aprovado',
    REJECTED: 'Recusado',
    CONTRACTED: 'Contratado',
    CANCELLED: 'Cancelado',
};
