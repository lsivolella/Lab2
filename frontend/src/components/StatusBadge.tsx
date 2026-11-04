import type { OrderStatus } from '../types/order';
import { STATUS_LABEL } from './statusLabels';

const STATUS_CLASS: Record<OrderStatus, string> = {
    SUBMITTED: 'bg-brand-400/20 text-brand-600',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    CONTRACTED: 'bg-ink-900 text-brand-400',
    CANCELLED: 'bg-cream-100 text-ink-500',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[status]}`}
        >
            {STATUS_LABEL[status]}
        </span>
    );
}
