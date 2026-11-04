import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchOrders } from '../api/orders';
import { OrderCard } from '../components/OrderCard';
import { STATUS_LABEL } from '../components/statusLabels';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../hooks/useAuth';
import type { OrderStatus, RentalOrderResponse } from '../types/order';

const FILTERS: (OrderStatus | null)[] = [
    null,
    'SUBMITTED',
    'APPROVED',
    'CONTRACTED',
    'REJECTED',
    'CANCELLED',
];

/**
 * Orders: customers follow their own orders (and change or cancel them while
 * under analysis); agents see every order.
 */
export function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<RentalOrderResponse[]>([]);
    const [filter, setFilter] = useState<OrderStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        fetchOrders(filter ?? undefined)
            .then((page) => {
                if (!ignore) {
                    setOrders(page.content);
                    setError(null);
                }
            })
            .catch(() => {
                if (!ignore) {
                    setError('Não foi possível carregar os pedidos.');
                }
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [filter]);

    function changeFilter(next: OrderStatus | null) {
        setLoading(true);
        setFilter(next);
    }

    function replace(updated: RentalOrderResponse) {
        setOrders((current) =>
            filter && updated.status !== filter
                ? current.filter((order) => order.id !== updated.id)
                : current.map((order) =>
                      order.id === updated.id ? updated : order,
                  ),
        );
    }

    const isCustomer = user?.role === 'CUSTOMER';

    return (
        <section className="mx-auto max-w-5xl">
            <h1 className="text-3xl font-bold tracking-tight">
                {isCustomer ? 'Meus pedidos' : 'Pedidos'}
                <span className="text-brand-400">.</span>
            </h1>

            <div
                className="mt-6 flex gap-2 overflow-x-auto pb-1"
                role="group"
                aria-label="Filtrar por status"
            >
                {FILTERS.map((status) => (
                    <button
                        key={status ?? 'ALL'}
                        type="button"
                        aria-pressed={filter === status}
                        onClick={() => changeFilter(status)}
                        className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
                            filter === status
                                ? 'bg-ink-900 text-cream-50'
                                : 'bg-white text-ink-700 ring-1 ring-cream-200 hover:bg-cream-50'
                        }`}
                    >
                        {status ? STATUS_LABEL[status] : 'Todos'}
                    </button>
                ))}
            </div>

            <div className="mt-6 space-y-4">
                {error && <Alert>{error}</Alert>}

                {loading &&
                    Array.from({ length: 3 }, (_, index) => (
                        <div
                            key={index}
                            className="h-40 animate-pulse rounded-3xl bg-white/60"
                        />
                    ))}

                {!loading && !error && orders.length === 0 && (
                    <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-cream-200">
                        <p className="font-semibold">Nenhum pedido aqui.</p>
                        {isCustomer && (
                            <Link
                                to="/carros"
                                className="mt-4 inline-flex h-12 items-center rounded-full bg-brand-400 px-6 text-sm font-semibold text-ink-900 hover:bg-brand-300"
                            >
                                Escolher um carro
                            </Link>
                        )}
                    </div>
                )}

                {!loading &&
                    orders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            viewer={user!}
                            onChange={replace}
                        />
                    ))}
            </div>
        </section>
    );
}
