import type { RentalOrderResponse } from '../types/order';
import {
    DISPLAY_LABEL,
    displayStatus,
    type DisplayStatus,
} from './statusLabels';

const STATUS_CLASS: Record<DisplayStatus, string> = {
    SUBMITTED: 'bg-brand-400/20 text-brand-600',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    CONTRACTED: 'bg-ink-900 text-brand-400',
    IN_PROGRESS: 'bg-sky-100 text-sky-800',
    FINISHED: 'bg-cream-200 text-ink-700',
    CANCELLED: 'bg-cream-100 text-ink-500',
};

export function StatusBadge({
    order,
}: {
    order: Pick<RentalOrderResponse, 'status' | 'contractPhase'>;
}) {
    const status = displayStatus(order);

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[status]}`}
        >
            {DISPLAY_LABEL[status]}
        </span>
    );
}
