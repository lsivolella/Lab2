import type {
    ContractPhase,
    OrderStatus,
    RentalOrderResponse,
} from '../types/order';

export const STATUS_LABEL: Record<OrderStatus, string> = {
    SUBMITTED: 'Em análise',
    APPROVED: 'Aprovado',
    REJECTED: 'Recusado',
    CONTRACTED: 'Contratado',
    CANCELLED: 'Cancelado',
};

const PHASE_LABEL: Record<ContractPhase, string> = {
    UPCOMING: 'Contratado',
    IN_PROGRESS: 'Em andamento',
    FINISHED: 'Encerrado',
};

/**
 * What the user sees as the order's situation: the status, or for contracted
 * orders the phase of the rental (contracted, in progress or finished).
 */
export type DisplayStatus = OrderStatus | 'IN_PROGRESS' | 'FINISHED';

export function displayStatus(
    order: Pick<RentalOrderResponse, 'status' | 'contractPhase'>,
): DisplayStatus {
    if (order.status === 'CONTRACTED' && order.contractPhase) {
        return order.contractPhase === 'UPCOMING'
            ? 'CONTRACTED'
            : order.contractPhase;
    }

    return order.status;
}

export const DISPLAY_LABEL: Record<DisplayStatus, string> = {
    ...STATUS_LABEL,
    IN_PROGRESS: PHASE_LABEL.IN_PROGRESS,
    FINISHED: PHASE_LABEL.FINISHED,
};
